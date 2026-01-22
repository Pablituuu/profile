import { ActiveSelection, type FabricObject } from 'fabric';
import type { TimelineEngine } from '../engine';
import { clearAuxiliaryObjects } from '../guidelines/utils';
import { TIMELINE_CONSTANTS } from '../constants';

const MICROSECONDS_PER_SECOND = 1_000_000;

/**
 * Helper to safely update the local clips map in Timeline to reflect the new visual state
 * before the asynchronous store update comes back.
 */
function updateClipTimeLocally(
  timeline: TimelineEngine,
  clipId: string,
  newDisplayFrom: number
) {
  const clip = timeline.clips[clipId];
  if (!clip) return;

  const duration = clip.display.to - clip.display.from;
  clip.display.from = newDisplayFrom;
  clip.display.to = newDisplayFrom + duration;
}

/**
 * Reverts a clip to its original position based on the clipsMap/store
 */
function revertClipToOriginal(
  timeline: TimelineEngine,
  clipId: string,
  target: FabricObject
) {
  const originalClip = timeline.clips[clipId];
  if (!originalClip) return;

  const startTimeSeconds = originalClip.display.from / MICROSECONDS_PER_SECOND;
  const originalLeft = timeline.getInfiniteX(startTimeSeconds);

  target.set('left', originalLeft);

  const tracks = timeline.tracks;
  const originalTrack = tracks.find((t) => t.clipIds.includes(clipId));
  if (originalTrack) {
    const originalRegion = timeline.trackRegions.find(
      (r) => r.id === originalTrack.id
    );
    if (originalRegion) {
      target.set('top', originalRegion.top);
    }
  }
  target.setCoords();
}

export function handleTrackRelocation(
  timeline: TimelineEngine,
  options: any
): boolean {
  const target = options.target as FabricObject | undefined;
  if (!target) return false;

  clearAuxiliaryObjects(timeline, timeline.getObjects());

  const targetAny = target as any;
  const targetType = targetAny.type?.toLowerCase();

  // 1. Handle Multi-selection Move
  if (targetType === 'activeselection') {
    const activeSelection = target as ActiveSelection;
    const objects = activeSelection.getObjects();

    // Calculate absolute positions and find target tracks for each clip
    const clipsToMove: Array<{
      clipId: string;
      absoluteCenterY: number;
      absoluteLeft: number;
    }> = [];

    const selectionCenter = activeSelection.getCenterPoint();

    for (const obj of objects) {
      const objAny = obj as any;
      if (!objAny.clipId) continue;

      // When in a group, obj.left/top are relative to the center of the group.
      const absoluteLeft = selectionCenter.x + obj.left;
      const absoluteTop = selectionCenter.y + obj.top;
      const absoluteCenterY = absoluteTop + (obj.height * obj.scaleY) / 2;

      clipsToMove.push({
        clipId: objAny.clipId,
        absoluteCenterY,
        absoluteLeft,
      });
    }

    if (clipsToMove.length === 0) return false;

    // Determine target tracks and validate movement
    const tracks = [...timeline.tracks];
    let groupOverlap = false;
    const clipToNewTrack = new Map<string, string>(); // clipId -> trackId

    for (const moveInfo of clipsToMove) {
      const trackRegion = timeline.getTrackAt(moveInfo.absoluteCenterY);
      if (trackRegion) {
        const clipInfo = timeline.clips[moveInfo.clipId];
        const targetTrack = tracks.find((t) => t.id === trackRegion.id);

        if (targetTrack && clipInfo) {
          // Simplified compatibility check (can be expanded later)
          const isCompatible = true;
          if (!isCompatible) continue;

          const absoluteLeft = moveInfo.absoluteLeft;
          let proposedStart = Math.round(
            timeline.getTimeFromInfiniteX(absoluteLeft) *
              MICROSECONDS_PER_SECOND
          );
          if (proposedStart < 0) proposedStart = 0;

          const obj = objects.find((o: any) => o.clipId === moveInfo.clipId);
          const width = obj ? obj.getScaledWidth() : 0;
          const proposedDuration = Math.round(
            (width / TIMELINE_CONSTANTS.PIXELS_PER_SECOND) *
              MICROSECONDS_PER_SECOND
          );
          const proposedEnd = proposedStart + proposedDuration;

          for (const otherClipId of targetTrack.clipIds) {
            if (clipsToMove.some((c) => c.clipId === otherClipId)) continue;
            const otherClip = timeline.clips[otherClipId];
            if (!otherClip) continue;

            if (
              proposedStart < otherClip.display.to &&
              proposedEnd > otherClip.display.from
            ) {
              // Check if transition or effect
              if (
                clipInfo.type !== 'Transition' &&
                clipInfo.type !== 'Effect'
              ) {
                groupOverlap = true;
                break;
              }
            }
          }
        }
        if (groupOverlap) break;
        clipToNewTrack.set(moveInfo.clipId, trackRegion.id);
      }
    }

    if (groupOverlap) {
      // Entire group snaps back
      const clipIdsToReSelect = clipsToMove.map((c) => c.clipId);
      timeline.discardActiveObject();
      timeline.refreshTimeline(); // Re-render from state
      timeline.selectClips(clipIdsToReSelect);
      return true;
    }

    // Success: Update times and tracks
    const modifiedClips: Array<{ clipId: string; displayFrom: number }> = [];
    for (const moveInfo of clipsToMove) {
      let displayFrom = Math.round(
        timeline.getTimeFromInfiniteX(moveInfo.absoluteLeft) *
          MICROSECONDS_PER_SECOND
      );
      if (displayFrom < 0) displayFrom = 0;
      updateClipTimeLocally(timeline, moveInfo.clipId, displayFrom);
      modifiedClips.push({ clipId: moveInfo.clipId, displayFrom });
    }

    // Update track structure
    const newTracksList = tracks
      .map((track) => {
        const remainingClipIds = track.clipIds.filter(
          (id: string) => !clipsToMove.some((c) => c.clipId === id)
        );
        const clipsMovingToThisTrack = clipsToMove
          .filter((c) => clipToNewTrack.get(c.clipId) === track.id)
          .map((c) => c.clipId);
        const clipsStayingOnThisTrack = track.clipIds.filter((id: string) =>
          clipsToMove.some(
            (c) => c.clipId === id && !clipToNewTrack.has(c.clipId)
          )
        );

        return {
          ...track,
          clipIds: [
            ...remainingClipIds,
            ...clipsMovingToThisTrack,
            ...clipsStayingOnThisTrack,
          ],
        };
      })
      .filter((t) => t.clipIds.length > 0);

    const clipIdsToReSelect = clipsToMove.map((c) => c.clipId);
    timeline.discardActiveObject();
    (timeline as any)._tracks = newTracksList; // Update internal tracks
    timeline.refreshTimeline();
    timeline.selectClips(clipIdsToReSelect);

    (timeline as any).fire('timeline:updated', { tracks: newTracksList });
    (timeline as any).fire('clips:modified', { clips: modifiedClips });

    return true;
  }

  // 2. Handle Single Clip Relocation
  const clipId = targetAny.clipId;
  if (!clipId) return false;

  const pointer = timeline.getPointer(options.e);
  const droppables = timeline
    .getObjects()
    .filter((obj: any) => obj.isHelper || obj.type === 'track-bg');

  const droppedOn = droppables.find((obj) => {
    const objRect = obj.getBoundingRect();
    return (
      pointer.x >= objRect.left &&
      pointer.x <= objRect.left + objRect.width &&
      pointer.y >= objRect.top &&
      pointer.y <= objRect.top + objRect.height
    );
  });

  const centerPoint = target.getCenterPoint();
  const trackRegion = timeline.getTrackAt(centerPoint.y);

  if (droppedOn && (droppedOn as any).isHelper) {
    // Drop on Separator
    let index = (droppedOn as any).separatorIndex ?? 0;
    let left = target.left || 0;
    if (left < 0) left = 0;
    const width = target.getScaledWidth() || 0;
    const proposedDuration = Math.round(
      (width / TIMELINE_CONSTANTS.PIXELS_PER_SECOND) * MICROSECONDS_PER_SECOND
    );
    let displayFrom = Math.round(
      timeline.getTimeFromInfiniteX(left) * MICROSECONDS_PER_SECOND
    );

    (timeline as any).fire('track:created', { clipId, index, displayFrom });
    (timeline as any).fire('clip:modified', {
      clipId,
      displayFrom,
      duration: proposedDuration,
    });
  } else if (trackRegion) {
    // Drop on Track
    let left = target.left || 0;
    if (left < 0) left = 0;
    const width = target.getScaledWidth() || 0;
    const proposedStart = Math.round(
      timeline.getTimeFromInfiniteX(left) * MICROSECONDS_PER_SECOND
    );
    const proposedDuration = Math.round(
      (width / TIMELINE_CONSTANTS.PIXELS_PER_SECOND) * MICROSECONDS_PER_SECOND
    );
    const proposedEnd = proposedStart + proposedDuration;

    const targetTrack = timeline.tracks.find((t) => t.id === trackRegion.id);
    let hasOverlap = false;

    if (targetTrack) {
      for (const otherId of targetTrack.clipIds) {
        if (otherId === clipId) continue;
        const otherClip = timeline.clips[otherId];
        if (!otherClip) continue;
        if (
          proposedStart < otherClip.display.to &&
          proposedEnd > otherClip.display.from
        ) {
          hasOverlap = true;
          break;
        }
      }
    }

    const clipInfo = timeline.clips[clipId];
    const isSpecial =
      clipInfo?.type === 'Transition' || clipInfo?.type === 'Effect';

    if (hasOverlap && !isSpecial) {
      // Forbidden: Create new track after
      const trackIndex = timeline.tracks.findIndex(
        (t) => t.id === trackRegion.id
      );
      const insertIndex =
        trackIndex !== -1 ? trackIndex + 1 : timeline.tracks.length;
      (timeline as any).fire('track:created', {
        clipId,
        index: insertIndex,
        displayFrom: proposedStart,
      });
      (timeline as any).fire('clip:modified', {
        clipId,
        displayFrom: proposedStart,
        duration: proposedDuration,
      });
    } else {
      // Allowed: Move to track
      (timeline as any).fire('clip:movedToTrack', {
        clipId,
        trackId: trackRegion.id,
        displayFrom: proposedStart,
      });
      (timeline as any).fire('clip:modified', {
        clipId,
        displayFrom: proposedStart,
        duration: proposedDuration,
      });
    }
  } else if (centerPoint.y > timeline.totalTracksHeight) {
    // Drop below timeline
    let left = target.left || 0;
    if (left < 0) left = 0;
    let displayFrom = Math.round(
      timeline.getTimeFromInfiniteX(left) * MICROSECONDS_PER_SECOND
    );
    (timeline as any).fire('track:created', {
      clipId,
      index: timeline.tracks.length,
      displayFrom,
    });
    (timeline as any).fire('clip:modified', {
      clipId,
      displayFrom,
      duration: Math.round(
        (target.getScaledWidth() / TIMELINE_CONSTANTS.PIXELS_PER_SECOND) *
          MICROSECONDS_PER_SECOND
      ),
    });
  } else {
    // Revert
    revertClipToOriginal(timeline, clipId, target);
  }

  timeline.clearSeparatorHighlights();
  timeline.activeSeparatorIndex = null;
  timeline.requestRenderAll();
  return true;
}

export function handleClipModification(
  timeline: TimelineEngine,
  options: any
): boolean {
  const target = options.target as FabricObject | undefined;
  if (!target) return false;

  clearAuxiliaryObjects(timeline, timeline.getObjects());

  const targetAny = target as any;
  const targetType = targetAny.type?.toLowerCase();

  if (targetType === 'activeselection') {
    const activeSelection = target as ActiveSelection;
    const objects = activeSelection.getObjects();
    const clips: Array<{ clipId: string; displayFrom: number }> = [];
    const selectionCenter = activeSelection.getCenterPoint();

    for (const obj of objects) {
      const objAny = obj as any;
      if (!objAny.clipId) continue;
      const absoluteLeft = selectionCenter.x + obj.left;
      let displayFrom = Math.round(
        timeline.getTimeFromInfiniteX(absoluteLeft) * MICROSECONDS_PER_SECOND
      );
      if (displayFrom < 0) displayFrom = 0;
      clips.push({ clipId: objAny.clipId, displayFrom });
    }

    if (clips.length > 0) {
      (timeline as any).fire('clips:modified', { clips });
    }
    return true;
  } else {
    const clipId = targetAny.clipId;
    if (!clipId) return false;

    let left = target.left || 0;
    if (left < 0) left = 0;

    // Y-Snap
    const trackRegion = timeline.getTrackAt(
      target.top + (target.height * target.scaleY) / 2
    );
    if (trackRegion) {
      target.set('top', trackRegion.top);
      target.setCoords();
    }

    let displayFrom = Math.round(
      timeline.getTimeFromInfiniteX(left) * MICROSECONDS_PER_SECOND
    );
    const duration = Math.round(
      (target.getScaledWidth() / TIMELINE_CONSTANTS.PIXELS_PER_SECOND) *
        MICROSECONDS_PER_SECOND
    );

    (timeline as any).fire('clip:modified', {
      clipId,
      displayFrom,
      duration,
      trim: targetAny.trim,
    });
    return true;
  }
}
