import { type FabricObject } from 'fabric';
import type { TimelineEngine } from '../engine';
import { clearAuxiliaryObjects } from '../guidelines/utils';
import { TIMELINE_CONSTANTS } from '../constants';

const MICROSECONDS_PER_SECOND = 1_000_000;

export function handleTrackRelocation(timeline: TimelineEngine, options: any) {
  if (!options || !options.target) return;
  const target = options.target as FabricObject | undefined;

  clearAuxiliaryObjects(timeline, timeline.getObjects());

  const pointer = timeline.getPointer(options.e);
  const droppables = timeline
    .getObjects()
    .filter((obj: any) => obj.isHelper || obj.type === 'track-bg');

  const droppedTarget = droppables.find((obj) => {
    const objRect = obj.getBoundingRect();
    // Simple point-in-rect check
    return (
      pointer.x >= objRect.left &&
      pointer.x <= objRect.left + objRect.width &&
      pointer.y >= objRect.top &&
      pointer.y <= objRect.top + objRect.height
    );
  });

  const targetAny = target as any;
  const clipId = targetAny.clipId;
  if (!clipId) return;

  if (droppedTarget && (droppedTarget as any).isHelper) {
    const helper = droppedTarget as any;

    let index = helper.separatorIndex;
    // Normalize index just in case
    if (index === undefined) index = 0;

    // Calculate new time
    let left = target?.left || 0;
    if (left < 0) left = 0;
    // @ts-ignore
    const timeScale = timeline.timeScale || 1;

    let newDisplayFrom = Math.round(
      (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale)) *
        MICROSECONDS_PER_SECOND
    );
    if (newDisplayFrom < 0) newDisplayFrom = 0;

    // Visual Snap
    target?.set('top', helper.top);
    target?.setCoords();

    (timeline as any).fire('track:created', {
      clipId,
      index,
      displayFrom: newDisplayFrom,
    });
  } else if (droppedTarget && droppedTarget.type === 'track-bg') {
    // Dropped on a Track
    // We already have trackRegions logic, but using the object is safer if layout changes
    // But we need the track ID. In engine.ts, track-bg has clipId = `track-${index}` or similar?
    // Let's rely on timeline.trackRegions for ID mapping if needed, OR checking the droppedTarget properties.
    // In engine.ts: clipId: `track-${index}`
    // We need the REAL track ID.

    // Fallback/Hybrid: Use getTrackIdByTop or similar if available, or parse the ID.
    // Actually, let's stick to trackRegions for the "Track" part since it maps to the *data* ID properly.
    // But wait, user wants explicit intersection.
    // Let's use the object to confirm "we are on a track", then find which one.

    const bg = droppedTarget as any;
    // The bg.clipId was set to `track-${index}` in engine.ts. This maps to the track index in _tracks array.
    // This is fragile if IDs change.
    // Better: Helper function to map visual object to track data.

    // Let's use the layout data (trackRegions) which is reliable for Y-lookup.
    const centerPoint = target?.getCenterPoint();
    const trackRegion = timeline.trackRegions.find(
      (r) => (centerPoint?.y || 0) >= r.top && (centerPoint?.y || 0) <= r.bottom
    );

    if (trackRegion) {
      let left = target?.left || 0;
      if (left < 0) left = 0;
      const width = target?.width || 0;
      // @ts-ignore
      const timeScale = timeline.timeScale || 1;
      const proposedStart = Math.round(
        (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale)) *
          MICROSECONDS_PER_SECOND
      );
      const proposedDuration = Math.round(
        (width / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale)) *
          MICROSECONDS_PER_SECOND
      );
      const proposedEnd = proposedStart + proposedDuration;

      // Overlap Check
      const targetTrack = timeline.tracks.find(
        (t: any) => t.id === trackRegion.id
      );
      let hasOverlap = false;

      if (targetTrack && targetTrack.clipIds) {
        for (const otherClipId of targetTrack.clipIds) {
          if (otherClipId === clipId) continue;
          const otherClip = timeline.clips[otherClipId];
          if (!otherClip) continue;
          const otherStart = otherClip.display.from;
          const otherEnd = otherClip.display.to;
          if (proposedStart < otherEnd && proposedEnd > otherStart) {
            hasOverlap = true;
            break;
          }
        }
      }

      if (hasOverlap) {
        // Insert AFTER this track
        const trackIndex = timeline.tracks.findIndex(
          (t: any) => t.id === trackRegion.id
        );
        const insertIndex =
          trackIndex !== -1 ? trackIndex + 1 : timeline.tracks.length;

        (timeline as any).fire('track:created', {
          clipId,
          index: insertIndex,
          displayFrom: proposedStart,
        });
      } else {
        // Force visual snap
        if (target) {
          target.set({
            top: trackRegion.top,
            left: target.left, // Keep current left
          });
          target.setCoords();
        }

        (timeline as any).fire('clip:movedToTrack', {
          clipId,
          trackId: trackRegion.id,
          displayFrom: proposedStart,
          displayTo: proposedEnd,
        });

        timeline.requestRenderAll();
      }
    }
  } else {
    // Dropped in empty space
    (timeline as any).fire('clip:droppedEmpty', { clipId });
  }

  timeline.clearSeparatorHighlights();
  timeline.setActiveSeparatorIndex(null);
  timeline.requestRenderAll();
}

export function handleClipModification(timeline: TimelineEngine, options: any) {
  const target = options.target as FabricObject | undefined;
  if (!target) return;

  clearAuxiliaryObjects(timeline, timeline.getObjects());

  const targetAny = target as any;
  // @ts-ignore
  const timeScale = timeline.timeScale || 1;

  if (targetAny.type === 'activeSelection' && targetAny._objects) {
    const clips: Array<{ clipId: string; displayFrom: number }> = [];

    for (const obj of targetAny._objects) {
      const objAny = obj as any;
      if (!objAny.clipId) continue;

      const left = (obj.left || 0) + (target.left || 0);

      let displayFrom = Math.round(
        (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale)) *
          MICROSECONDS_PER_SECOND
      );

      if (displayFrom < 0) displayFrom = 0;

      clips.push({
        clipId: objAny.clipId,
        displayFrom,
      });
    }

    if (clips.length > 0) {
      (timeline as any).fire('clips:modified', { clips });
    }
  } else {
    const clipId = targetAny.clipId;
    if (!clipId) return;

    let left = target.left || 0;
    const width = target.width || 0;

    // --- Y-AXIS SNAP LOGIC START ---
    // Ensure clip snaps to its track row even if moved slightly vertically
    const trackRegion = timeline.trackRegions.find(
      (r) =>
        (target.top || 0) + (target.height || 0) / 2 >= r.top &&
        (target.top || 0) + (target.height || 0) / 2 <= r.bottom
    );
    if (trackRegion) {
      target.set('top', trackRegion.top);
      target.setCoords();
    }
    // --- Y-AXIS SNAP LOGIC END ---

    if (left < 0) {
      left = 0;
      target.set('left', 0);
      target.setCoords();
    }

    let displayFrom = Math.round(
      (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale)) *
        MICROSECONDS_PER_SECOND
    );

    if (displayFrom < 0) displayFrom = 0;

    const duration = Math.round(
      (width / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale)) *
        MICROSECONDS_PER_SECOND
    );

    const trim = targetAny.trim;

    (timeline as any).fire('clip:modified', {
      clipId,
      displayFrom,
      duration,
      trim,
    });
  }
}
