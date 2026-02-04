import { ModifiedEvent, TPointerEvent, FabricObject } from 'fabric';
import { TimelineCanvas } from '../canvas';
import { Track } from '../track';
import { TIMELINE_CONSTANTS } from '../controls/constants';

export function onObjectResizeModified(
  this: TimelineCanvas,
  e: ModifiedEvent<TPointerEvent>
) {
  const target = e.target;
  const transform = e.transform;

  if (transform?.action !== 'resizing') return;

  const canvas = this;
  const allClips = (canvas as any).getClips();
  const targetId = (target as any).clipId || (target as any).id;

  const getAbsTop = (obj: FabricObject) => {
    if (obj.group) {
      const matrix = obj.calcTransformMatrix();
      return matrix[5] - obj.getScaledHeight() / 2;
    }
    return obj.top;
  };

  const targetTop = getAbsTop(target);
  const targetLeft = target.group
    ? target.calcTransformMatrix()[4] - target.getScaledWidth() / 2
    : target.left;
  const targetRight = targetLeft + target.getScaledWidth();

  const currentTrack = canvas
    .getObjects()
    .find(
      (obj) => obj instanceof Track && Math.abs(obj.top - targetTop) < 2
    ) as Track;

  if (!currentTrack) return;

  const clipsOnSameTrack = allClips.filter((clip: any) => {
    const id = clip.clipId || clip.id;
    if (id === targetId) return false;
    return Math.abs(getAbsTop(clip) - targetTop) < 2;
  });

  const hoveringClips = clipsOnSameTrack.filter((clip: any) => {
    const clipLeft = clip.left;
    const clipRight = clip.left + clip.getScaledWidth();
    return targetLeft < clipRight - 1 && targetRight > clipLeft + 1;
  });

  if (hoveringClips.length > 0) {
    const hoveringIds = hoveringClips.map((c: any) => c.clipId || c.id);

    // 1. LIMPIEZA: Eliminar los IDs que se van a mover de la pista actual
    currentTrack.clipIds = currentTrack.clipIds.filter(
      (id) => !hoveringIds.includes(id)
    );

    const trackStep =
      TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;
    const insertionPointIndex = currentTrack.index + 1;
    const insertionPointTop = currentTrack.top + trackStep;

    const allTracks = canvas
      .getObjects()
      .filter((obj): obj is Track => obj instanceof Track);

    allTracks.forEach((t) => {
      if (t.index >= insertionPointIndex) {
        const clipsToPush = allClips.filter((c: any) => {
          const id = c.clipId || c.id;
          return t.clipIds.includes(id) || Math.abs(getAbsTop(c) - t.top) < 2;
        });

        clipsToPush.forEach((c: any) => {
          c.set({ top: c.top + trackStep });
          c.setCoords();
        });

        t.index += 1;
        t.set({ top: t.top + trackStep });
        t.setCoords();
      }
    });

    const newTrack = new Track({
      id: `track-${Math.random().toString(36).slice(2, 9)}`,
      name: 'New Track (Conflict)',
      type: 'video',
      width: 1000000,
      height: TIMELINE_CONSTANTS.CLIP_HEIGHT,
      top: insertionPointTop,
      index: insertionPointIndex,
      clipIds: hoveringIds,
    });

    canvas.add(newTrack);
    canvas.sendObjectToBack(newTrack);

    hoveringClips.forEach((c: any) => {
      c.set({ top: c.top + trackStep });
      c.setCoords();
    });
  }
  (canvas as any).detectConsecutiveClips();
  (canvas as any).synchronizeTracksWithClips();
  (canvas as any).fire('clip:resize');
  (canvas as any).fire('update:track');
  canvas.requestRenderAll();
}

export function addResizeEvents(timeline: TimelineCanvas) {
  timeline.on('object:modified', onObjectResizeModified.bind(timeline));
}

export function removeResizeEvents(timeline: TimelineCanvas) {
  timeline.off('object:modified', onObjectResizeModified.bind(timeline));
}
