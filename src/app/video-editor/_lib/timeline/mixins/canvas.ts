import TimelineCanvas from '../canvas';
import { TextClipTimeline } from '../text-clip';
import { VideoClipTimeline } from '../video-clip';
import { ImageClipTimeline } from '../image-clip';
import { AudioClipTimeline } from '../audio-clip';
import { EffectClipTimeline } from '../effect-clip';
import { Track } from '../track';
import { TIMELINE_CONSTANTS } from '../controls/constants';
import { ActiveSelection } from 'fabric';
import { TransitionClipTimeline } from '../transition-clip';
import { cloneDeep } from 'lodash';

class CanvasMixin {
  alignClipsToTrack(this: TimelineCanvas) {
    const objects = this.getObjects();
    const tracks = objects.filter((obj): obj is Track => obj instanceof Track);
    const activeObject = this.getActiveObject();
    let hasChanges = false;

    // 1. Map clips to their assigned track top position for efficient lookup
    const trackTopsByClipId: Record<string, number> = {};
    tracks.forEach((t) => {
      const clipIds = (t as any).clipIds || [];
      clipIds.forEach((id: string) => {
        trackTopsByClipId[id] = t.top;
      });
    });

    const clips = this.getClips();
    const affectedGroups = new Set<any>();

    // 2. Align each clip to its assigned track top
    clips.forEach((clip) => {
      const clipId = (clip as any).clipId || (clip as any).id;
      const targetTop = trackTopsByClipId[clipId];
      if (targetTop === undefined) return;

      // getAbsTop calculation
      let currentAbsTop: number;
      if (clip.group) {
        const matrix = clip.calcTransformMatrix();
        currentAbsTop = matrix[5] - clip.getScaledHeight() / 2;
      } else {
        currentAbsTop = clip.getBoundingRect().top;
      }

      const dy = targetTop - currentAbsTop;

      if (Math.abs(dy) > 0.1) {
        if (clip.group) {
          // Move child relative to its group/selection
          clip.set({ top: clip.top + dy });
          clip.setCoords();
          affectedGroups.add(clip.group);
        } else {
          // Move object directly
          clip.set({ top: clip.top + dy });
          clip.setCoords();
        }
        hasChanges = true;
      }
    });

    // 3. Update groups that had children moved to recalculate their bounding boxes
    affectedGroups.forEach((group) => {
      if (group.type.toLowerCase() === 'activeselection') {
        const groupObjects = group.getObjects();
        group.remove(...groupObjects);
        group.add(...groupObjects);
      }
      group.setCoords();
    });

    if (hasChanges) {
      this.detectConsecutiveClips();
      this.renderAll();
    }
  }

  orderTracks(this: TimelineCanvas) {
    const objects = this.getObjects();
    const tracks = objects.filter((obj): obj is Track => obj instanceof Track);

    tracks.sort((a, b) => a.top - b.top);

    const trackStep =
      TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;
    const initialOffset = TIMELINE_CONSTANTS.INITIAL_Y_OFFSET;

    tracks.forEach((track, index) => {
      const newTop = initialOffset + index * trackStep;
      if (Math.abs(track.top - newTop) > 0.1) {
        track.set({ top: newTop });
        track.setCoords();
      }

      this.sendObjectToBack(track);
    });

    this.renderAll();
  }

  getClips(this: TimelineCanvas) {
    const isClip = (obj: any) =>
      obj instanceof TextClipTimeline ||
      obj instanceof VideoClipTimeline ||
      obj instanceof ImageClipTimeline ||
      obj instanceof AudioClipTimeline ||
      obj instanceof EffectClipTimeline ||
      obj instanceof TransitionClipTimeline;

    const allObjects = this.getObjects();
    const activeObject = this.getActiveObject();

    // In Fabric, objects in an ActiveSelection might be temporarily removed from the canvas objects list
    const itemsToCheck = [...allObjects];
    if (activeObject && !itemsToCheck.includes(activeObject)) {
      itemsToCheck.push(activeObject);
    }

    const clips: any[] = [];
    const processedIds = new Set<string>();

    itemsToCheck.forEach((obj) => {
      if (isClip(obj)) {
        const id = (obj as any).clipId || (obj as any).id;
        if (id && !processedIds.has(id)) {
          clips.push(obj);
          processedIds.add(id);
        }
      } else if (
        obj.type.toLowerCase() === 'activeselection' ||
        obj.type.toLowerCase() === 'group'
      ) {
        (obj as any).getObjects().forEach((child: any) => {
          if (isClip(child)) {
            const id = (child as any).clipId || (child as any).id;
            if (id && !processedIds.has(id)) {
              clips.push(child);
              processedIds.add(id);
            }
          }
        });
      }
    });

    return clips;
  }

  synchronizeTracksWithClips(
    this: TimelineCanvas,
    options?: { protectedTrackIds?: string[] }
  ) {
    const clips = this.getClips();
    const allObjects = this.getObjects();
    const tracks = allObjects.filter(
      (obj): obj is Track => obj instanceof Track
    );

    // 0. Rebuild clipIds based on current vertical positions
    const getAbsTop = (obj: any) => {
      if (obj.group) {
        const matrix = obj.calcTransformMatrix();
        return matrix[5] - obj.getScaledHeight() / 2;
      }
      return obj.top;
    };

    tracks.forEach((t) => ((t as any).clipIds = []));

    clips.forEach((clip: any) => {
      const clipTop = getAbsTop(clip);
      let nearestTrack: any = null;
      let minDistance = Infinity;

      tracks.forEach((track) => {
        const dist = Math.abs(track.top - clipTop);
        if (dist < minDistance) {
          minDistance = dist;
          nearestTrack = track;
        }
      });

      if (
        nearestTrack &&
        minDistance < TIMELINE_CONSTANTS.CLIP_HEIGHT / 2 + 5
      ) {
        const clipId = clip.clipId || clip.id;
        if (clipId && !nearestTrack.clipIds.includes(clipId)) {
          nearestTrack.clipIds.push(clipId);
        }
      }
    });

    // Group tracks by their rounded vertical position to detect duplicates/conflicts
    const tracksByTop: Record<number, Track[]> = {};
    tracks.forEach((track) => {
      const top = Math.round(track.top);
      if (!tracksByTop[top]) tracksByTop[top] = [];
      tracksByTop[top].push(track);
    });

    // Process each vertical slot and collect survivor data
    const survivorData: any[] = [];

    // Sort slots by top to ensure consistent survivor selection and ordering
    const sortedTops = Object.keys(tracksByTop)
      .map(Number)
      .sort((a, b) => a - b);

    sortedTops.forEach((top) => {
      const peers = tracksByTop[top];

      // If one of the peers is protected, we must favor it as the survivor
      const survivor =
        peers.find((p) => options?.protectedTrackIds?.includes(p.id)) ||
        peers[0];

      // Merge: Remove all but the survivor
      peers.forEach((p) => {
        if (p !== survivor) this.remove(p);
      });

      // Requirement: If no object clips, delete track
      // EXCEPT if it was just created/dropped onto (protected)
      const isProtected = options?.protectedTrackIds?.includes(survivor.id);
      if (survivor.clipIds.length === 0 && !isProtected) {
        this.remove(survivor);
      } else {
        survivorData.push({
          id: survivor.id,
          name: survivor.name,
          type: (survivor as any).trackType || 'video',
          clipIds: survivor.clipIds,
          top: survivor.top, // Temporary for sorting if index is missing
          index: survivor.index,
        });
      }
    });

    // 4. Final Sort and Re-index:
    // We sort by 'index' (logical order) primarily so that manually assigned indices
    // during track creation are respected. 'top' is used as a fallback.
    survivorData.sort((a, b) => {
      if (a.index !== b.index) return (a.index ?? 0) - (b.index ?? 0);
      return (a.top ?? 0) - (b.top ?? 0);
    });

    // Re-index based on the sorted logical order
    survivorData.forEach((data, i) => {
      data.index = i;
    });

    // Use renderTracks to refresh the entire layout (including helpers and ordering)
    (this as any).renderTracks(survivorData);

    // Ensure clips are aligned to their new tracks
    this.alignClipsToTrack();
    this.renderAll();
  }

  cleanupEmptyTracks(this: TimelineCanvas) {
    this.synchronizeTracksWithClips();
  }

  selectedClips(this: TimelineCanvas, objectIds: string[]) {
    if (objectIds.length === 0) {
      this.discardActiveObject();
      this.renderAll();
      return;
    }
    if (objectIds.length === 1) {
      const clip = this.getClips().find((obj) => obj.clipId === objectIds[0]);
      if (!clip) return;
      this.setActiveObject(clip);
      this.renderAll();
      return;
    }
    const clips = this.getClips();
    const selectedClips = clips.filter((clip) =>
      objectIds.includes((clip as any).clipId)
    );
    const activeSelection = new ActiveSelection(selectedClips);
    this.setActiveObject(activeSelection);
    this.renderAll();
  }

  splitClips(this: TimelineCanvas, splitTimeUs: number) {
    const activeObjects = this.getActiveObjects();
    const zoom = (this as any).zoom || 1;
    const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoom;

    activeObjects.forEach((obj: any) => {
      // Check if it's a clip (has startUs and endUs)
      if (
        obj.startUs !== undefined &&
        obj.endUs !== undefined &&
        obj.startUs < splitTimeUs &&
        obj.endUs > splitTimeUs
      ) {
        const newDurationUs = splitTimeUs - obj.startUs;

        // Update visual width
        obj.set({
          width: (newDurationUs * pixelsPerSec) / 1_000_000,
        });

        // Update metadata
        obj.durationUs = newDurationUs;
        obj.endUs = splitTimeUs;

        // Update trim if applicable (Video/Audio)
        if (obj.trim) {
          obj.trim.to = (obj.trim.from || 0) + newDurationUs;
          obj.trimToUs = obj.trim.to;
        }

        obj.setCoords();
      }
    });

    this.renderAll();
  }

  detectConsecutiveClips(this: TimelineCanvas) {
    const clips = this.getClips();

    // Helper to get consistent coordinates
    const getAbsTop = (obj: any) => {
      if (obj.group) {
        const matrix = obj.calcTransformMatrix();
        return matrix[5] - obj.getScaledHeight() / 2;
      }
      return obj.top;
    };

    const getAbsLeft = (obj: any) => {
      if (obj.group) {
        const matrix = obj.calcTransformMatrix();
        return matrix[4] - obj.getScaledWidth() / 2;
      }
      return obj.left;
    };

    // Group ONLY Video and Image clips by track (ignoring transitions themselves)
    const tracks: Record<number, any[]> = {};
    clips.forEach((clip: any) => {
      if (
        clip instanceof VideoClipTimeline ||
        clip instanceof ImageClipTimeline
      ) {
        const top = Math.round(getAbsTop(clip));
        if (!tracks[top]) tracks[top] = [];
        tracks[top].push(clip);
      }
    });

    const usedTransitions = new Set<TransitionClipTimeline>();

    Object.keys(tracks).forEach((topStr) => {
      const trackClips = tracks[Number(topStr)];
      trackClips.sort((a, b) => getAbsLeft(a) - getAbsLeft(b));

      for (let i = 0; i < trackClips.length - 1; i++) {
        const current = trackClips[i];
        const next = trackClips[i + 1];

        const currentRight = getAbsLeft(current) + current.getScaledWidth();
        const nextLeft = getAbsLeft(next);
        const gap = Math.abs(currentRight - nextLeft);

        if (gap < 2) {
          const fromId = (current as any).clipId || (current as any).id;
          const toId = (next as any).clipId || (next as any).id;

          const targetLeft = currentRight - 12;
          const targetTop =
            Number(topStr) + (TIMELINE_CONSTANTS.CLIP_HEIGHT - 20) / 2;

          // Check if transition already exists (robust against ID promotion)
          const existing = this.getObjects().find((obj) => {
            if (!(obj instanceof TransitionClipTimeline)) return false;
            const matchesFrom =
              obj.clipIdFrom === (current as any).clipId ||
              obj.clipIdFrom === (current as any).id;
            const matchesTo =
              obj.clipIdTo === (next as any).clipId ||
              obj.clipIdTo === (next as any).id;
            return matchesFrom && matchesTo;
          }) as TransitionClipTimeline;

          if (!existing) {
            const transition = new TransitionClipTimeline({
              clipIdFrom: fromId,
              clipIdTo: toId,
              left: targetLeft,
              top: targetTop,
            });
            this.add(transition);
            this.bringObjectToFront(transition);
            usedTransitions.add(transition);
          } else {
            // Update position and IDs
            existing.set({
              clipIdFrom: fromId,
              clipIdTo: toId,
              left: targetLeft,
              top: targetTop,
            });
            existing.setCoords();
            usedTransitions.add(existing);
          }
        }
      }
    });

    // Cleanup: Remove junctions that are no longer between adjacent clips
    this.getObjects().forEach((obj) => {
      if (obj instanceof TransitionClipTimeline && !usedTransitions.has(obj)) {
        const idsToRemove = [(obj as any).clipId, obj.id].filter(Boolean);
        if (idsToRemove.length > 0) {
          this.getObjects().forEach((track) => {
            if (track instanceof Track) {
              track.clipIds = track.clipIds.filter(
                (id) => !idsToRemove.includes(id)
              );
            }
          });
        }
        this.remove(obj);
      }
    });

    this.renderAll();
  }
}

export default CanvasMixin;
