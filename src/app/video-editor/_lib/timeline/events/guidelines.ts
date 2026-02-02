import {
  ActiveSelection,
  BasicTransformEvent,
  FabricObject,
  FabricObjectProps,
  ModifiedEvent,
  ObjectEvents,
  SerializedObjectProps,
  TPointerEvent,
} from 'fabric';
import { getState, setState } from './internal';
import {
  clearAuxiliaryObjects,
  drawGuides,
  getGuides,
  getLineGuideStops,
  getObjectSnappingEdges,
} from '../utils/guideline';
import {
  clearPlaceholderObjects,
  clearTrackHelperGuides,
  isHelperTrack,
} from '../utils/canvas';
import { TIMELINE_CONSTANTS } from '../controls/constants';
import { TimelineCanvas } from '../canvas';
import { Track } from '../track';
import { Helper } from '../helper';
import { cloneDeep } from 'lodash';

export function onObjectMoving(
  this: TimelineCanvas,
  e: ModifiedEvent<TPointerEvent>
) {
  e.e?.preventDefault();
  const canvas = this;
  if (!canvas) return;
  const state = getState();
  const enableGuideRedraw = state.enableGuideRedraw;
  const pointer = canvas.getScenePoint(e.e!);

  const overTracks = canvas
    .getObjects()
    .filter((obj) => obj instanceof Track || isHelperTrack(obj));

  const draggingOverTrack = overTracks.find((obj) => {
    const objRect = obj.getBoundingRect();
    return (
      pointer.x >= objRect.left &&
      pointer.x <= objRect.left + objRect.width &&
      pointer.y >= objRect.top &&
      pointer.y <= objRect.top + objRect.height
    );
  }) as Track | Helper;

  setState({ draggingOverTrack });

  overTracks.forEach((obj) => {
    if (isHelperTrack(obj)) {
      if (obj === draggingOverTrack) {
        (obj as Helper).setSelected(true);
      } else {
        (obj as Helper).setSelected(false);
      }
    }
  });

  if (isHelperTrack(draggingOverTrack)) {
    setState({ isPointerOverHelperTrack: true });
  } else {
    setState({ isPointerOverHelperTrack: false });
  }

  const allObjects = canvas.getObjects();
  const target = e.target;

  target.setCoords();

  const skipObjects = [
    target,
    ...canvas.getActiveObjects(),
    ...allObjects.filter(
      (obj) =>
        obj instanceof Track ||
        isHelperTrack(obj) ||
        (obj as any).type === 'Placeholder' ||
        (obj as any).isAlignmentAuxiliary
    ),
  ];

  const lineGuideStops = getLineGuideStops(skipObjects, canvas);
  const itemBounds = getObjectSnappingEdges(target);
  const guides = getGuides(lineGuideStops, itemBounds);

  if (enableGuideRedraw) {
    clearAuxiliaryObjects(canvas, allObjects);
    if (guides.length) {
      drawGuides(guides, canvas);
    }
    setState({ enableGuideRedraw: false });
    setTimeout(() => setState({ enableGuideRedraw: true }), 50);
  }

  guides.forEach((lineGuide) => {
    if (lineGuide.orientation === 'V') {
      target.left = lineGuide.lineGuide + lineGuide.offset;
    } else {
      target.top = lineGuide.lineGuide + lineGuide.offset;
    }
  });

  if (target.left <= 0) target.left = 0;
  if (target.top <= 0) target.top = 0;
}

function onObjectModified(
  this: TimelineCanvas,
  e: ModifiedEvent<TPointerEvent>
) {
  const canvas = this;
  if (!canvas) return;
  const state = getState();
  const activeObject = canvas.getActiveObject();
  const activeObjects = canvas.getActiveObjects();
  const isSingleSelection = activeObjects.length === 1;

  const visiblePlaceholders = state.placeholderMovingObjects.filter(
    (p) =>
      p.visible ||
      (isSingleSelection &&
        state.draggingOverTrack &&
        isHelperTrack(state.draggingOverTrack))
  );

  if (visiblePlaceholders.length > 0 && activeObject) {
    const p = visiblePlaceholders[0];
    const leader = p.draggedObject;

    if (leader) {
      const matrix = leader.calcTransformMatrix();
      const currentAbsLeft = matrix[4] - leader.getScaledWidth() / 2;
      const currentAbsTop = matrix[5] - leader.getScaledHeight() / 2;

      const dx = p.left - currentAbsLeft;
      const dy = p.top - currentAbsTop;

      if (activeObject instanceof ActiveSelection) {
        activeObject.set({
          left: activeObject.left + dx,
          top: activeObject.top + dy,
        });
        activeObject.setCoords();
        activeObject.getObjects().forEach((obj) => obj.setCoords());
      } else {
        activeObject.set({
          left: p.left,
          top: p.top,
        });
        activeObject.setCoords();
      }
    }
  }

  clearAuxiliaryObjects(canvas, canvas.getObjects());
  clearTrackHelperGuides(canvas.getObjects());

  const droppedTarget = state.draggingOverTrack;
  const protectedTrackIds: string[] = [];

  const getAbsTop = (obj: FabricObject) => {
    if (obj.group) {
      const matrix = obj.calcTransformMatrix();
      return matrix[5] - obj.getScaledHeight() / 2;
    }
    return obj.top;
  };

  const isMultiTrackSelection =
    activeObject instanceof ActiveSelection &&
    new Set(activeObjects.map((obj) => Math.round(getAbsTop(obj)))).size > 1;

  if (activeObject && droppedTarget) {
    const targetTop = droppedTarget.top;
    const trackStep =
      TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;

    const currentTop = activeObject.getBoundingRect().top;
    const dy = targetTop - currentTop;
    activeObject.set({ top: activeObject.top + dy });
    activeObject.setCoords();
    if (activeObject instanceof ActiveSelection) {
      activeObject.getObjects().forEach((o) => o.setCoords());
    }

    if (isHelperTrack(droppedTarget)) {
      const baseIndex = (droppedTarget as any).index ?? 0;

      if (isMultiTrackSelection) {
        const uniqueTops = Array.from(
          new Set(activeObjects.map((obj) => Math.round(getAbsTop(obj))))
        ).sort((a, b) => a - b);

        const allTracks = canvas
          .getObjects()
          .filter((obj): obj is Track => obj instanceof Track);
        allTracks.forEach((track) => {
          if (track.index >= baseIndex) {
            track.index += uniqueTops.length;
          }
        });

        uniqueTops.forEach((originalTop, index) => {
          const newTrackTop = targetTop + index * trackStep;
          const clipsForThisTrack = activeObjects.filter(
            (obj) => Math.round(getAbsTop(obj)) === originalTop
          );

          clipsForThisTrack.forEach((obj) => {
            const currentAbsTop = getAbsTop(obj);
            const diff = newTrackTop - currentAbsTop;
            if (Math.abs(diff) > 0.1) {
              obj.set({ top: obj.top + diff });
              obj.setCoords();
            }
          });

          const trackId = `track-${Math.random().toString(36).slice(2, 9)}`;
          const newTrack = new Track({
            id: trackId,
            name: 'New Track',
            type: 'video',
            width: 1000000,
            height: TIMELINE_CONSTANTS.CLIP_HEIGHT,
            top: newTrackTop,
            index: baseIndex + index,
            clipIds: clipsForThisTrack.map(
              (obj) => (obj as any).clipId || (obj as any).id
            ),
          });

          protectedTrackIds.push(newTrack.id);
          canvas.add(newTrack);
          canvas.sendObjectToBack(newTrack);
        });

        if (activeObject instanceof ActiveSelection) {
          const objects = activeObject.getObjects();
          activeObject.remove(...objects);
          activeObject.add(...objects);
          activeObject.setCoords();
        }
      } else {
        const allTracks = canvas
          .getObjects()
          .filter((obj): obj is Track => obj instanceof Track);
        allTracks.forEach((track) => {
          if (track.index >= baseIndex) {
            track.index += 1;
          }
        });

        const newTrack = new Track({
          id: `track-${Math.random().toString(36).slice(2, 9)}`,
          name: 'New Track',
          type: 'video',
          width: 1000000,
          height: TIMELINE_CONSTANTS.CLIP_HEIGHT,
          top: targetTop,
          index: baseIndex,
          clipIds: activeObjects.map(
            (obj) => (obj as any).clipId || (obj as any).id
          ),
        });

        protectedTrackIds.push(newTrack.id);
        canvas.add(newTrack);
        canvas.sendObjectToBack(newTrack);
      }
    } else {
      protectedTrackIds.push((droppedTarget as any).id);

      const uniqueTops = Array.from(
        new Set(activeObjects.map((obj) => Math.round(getAbsTop(obj))))
      ).sort((a, b) => a - b);

      const baseIndex = (droppedTarget as any).index ?? 0;
      const allClipsOnCanvas = (this as any).getClips();
      const selectionIds = new Set(
        activeObjects.map((obj) => (obj as any).clipId || (obj as any).id)
      );
      const placeholderTargetMap = new Map(
        state.placeholderMovingObjects.map((p) => [
          (p.draggedObject as any)?.clipId || (p.draggedObject as any)?.id,
          p,
        ])
      );

      let cumulativeShift = 0;
      const topMostSelectionTop = uniqueTops[0];

      uniqueTops.forEach((originalTop) => {
        const relativeTrackOffset = Math.round(
          (originalTop - topMostSelectionTop) / trackStep
        );
        const newTrackTop =
          targetTop + (relativeTrackOffset + cumulativeShift) * trackStep;
        const currentLogicalIndex =
          baseIndex + relativeTrackOffset + cumulativeShift;

        const clipsInThisLevel = activeObjects.filter(
          (obj) => Math.round(getAbsTop(obj)) === originalTop
        );

        let existingTrack = canvas
          .getObjects()
          .find(
            (obj) => obj instanceof Track && Math.abs(obj.top - newTrackTop) < 2
          ) as Track;

        let hasConflict = false;

        if (existingTrack) {
          const clipsOnThisTrack = allClipsOnCanvas.filter((c: any) => {
            const id = c.clipId || c.id;
            if (selectionIds.has(id)) return false;
            return (
              existingTrack.clipIds.includes(id) ||
              Math.abs(getAbsTop(c) - existingTrack.top) < 2
            );
          });

          hasConflict = clipsInThisLevel.some((movingClip) => {
            const clipId = (movingClip as any).clipId || (movingClip as any).id;
            const placeholder = placeholderTargetMap.get(clipId);

            const mMatrix = movingClip.calcTransformMatrix();
            const mLeft = placeholder
              ? placeholder.left
              : mMatrix[4] - movingClip.getScaledWidth() / 2;
            const mRight = mLeft + movingClip.getScaledWidth();

            const conflict = clipsOnThisTrack.find((fixedClip: any) => {
              const fLeft = fixedClip.left;
              const fRight = fixedClip.left + fixedClip.getScaledWidth();
              return mLeft < fRight - 1 && mRight > fLeft + 1;
            });

            return !!conflict;
          });
        }

        if (hasConflict) {
          const allTracksOnCanvas = canvas
            .getObjects()
            .filter((obj): obj is Track => obj instanceof Track);

          allTracksOnCanvas.forEach((t) => {
            if (t.index >= currentLogicalIndex) {
              const clipsToPush = allClipsOnCanvas.filter((c: any) => {
                const id = c.clipId || c.id;
                if (selectionIds.has(id)) return false;
                return (
                  t.clipIds.includes(id) || Math.abs(getAbsTop(c) - t.top) < 2
                );
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

          const trackClipIds = clipsInThisLevel.map(
            (obj) => (obj as any).clipId || (obj as any).id
          );

          const newTrack = new Track({
            id: `track-${Math.random().toString(36).slice(2, 9)}`,
            name: 'New Track (Conflict)',
            type: 'video',
            width: 1000000,
            height: TIMELINE_CONSTANTS.CLIP_HEIGHT,
            top: newTrackTop,
            index: currentLogicalIndex,
            clipIds: trackClipIds,
          });
          protectedTrackIds.push(newTrack.id);
          canvas.add(newTrack);
          canvas.sendObjectToBack(newTrack);

          cumulativeShift++;
          existingTrack = newTrack;
        } else if (!existingTrack) {
          const trackClipIds = clipsInThisLevel.map(
            (obj) => (obj as any).clipId || (obj as any).id
          );
          const newTrack = new Track({
            id: `track-${Math.random().toString(36).slice(2, 9)}`,
            name: 'New Track (Expansion)',
            type: 'video',
            width: 1000000,
            height: TIMELINE_CONSTANTS.CLIP_HEIGHT,
            top: newTrackTop,
            index: currentLogicalIndex,
            clipIds: trackClipIds,
          });
          protectedTrackIds.push(newTrack.id);
          canvas.add(newTrack);
          canvas.sendObjectToBack(newTrack);
          existingTrack = newTrack;
        } else {
          protectedTrackIds.push(existingTrack.id);
        }

        clipsInThisLevel.forEach((obj) => {
          const clipId = (obj as any).clipId || (obj as any).id;
          const placeholder = placeholderTargetMap.get(clipId);

          const currentAbsTop = getAbsTop(obj);
          const diffTop = newTrackTop - currentAbsTop;

          const updates: any = {};
          if (Math.abs(diffTop) > 0.1) updates.top = obj.top + diffTop;

          if (placeholder) {
            if (obj.group) {
              const objAbsLeft =
                obj.calcTransformMatrix()[4] - obj.getScaledWidth() / 2;
              const diffLeft = placeholder.left - objAbsLeft;
              updates.left = obj.left + diffLeft;
            } else {
              updates.left = placeholder.left;
            }
          }

          obj.set(updates);
          obj.setCoords();

          const currentMatrix = obj.calcTransformMatrix();
          const currentAbsLeft = currentMatrix[4] - obj.getScaledWidth() / 2;

          if (currentAbsLeft < -0.1) {
            const groupScaleX = obj.group ? obj.group.scaleX : 1;
            obj.set({ left: obj.left - currentAbsLeft / groupScaleX });
            obj.setCoords();
          }
        });
      });
      activeObject.setCoords();
      if (activeObject.type.toLocaleLowerCase() === 'activeselection') {
        (activeObject as any)
          .getObjects()
          .forEach((obj: any) => obj.setCoords());
      }
    }
  }

  const allClips = (this as any).getClips();
  const allTracks = canvas
    .getObjects()
    .filter((obj): obj is Track => obj instanceof Track);

  allTracks.forEach((t) => ((t as any).clipIds = []));

  allClips.forEach((clip: any) => {
    const clipTop = getAbsTop(clip);
    let nearestTrack: any = null;
    let minDistance = Infinity;

    allTracks.forEach((track) => {
      const dist = Math.abs(track.top - clipTop);
      if (dist < minDistance) {
        minDistance = dist;
        nearestTrack = track;
      }
    });

    if (nearestTrack && minDistance < TIMELINE_CONSTANTS.CLIP_HEIGHT / 2 + 5) {
      const clipId = clip.clipId || clip.id;
      if (clipId && !nearestTrack.clipIds.includes(clipId)) {
        nearestTrack.clipIds.push(clipId);
      }
    }
  });

  this.synchronizeTracksWithClips({ protectedTrackIds });

  clearPlaceholderObjects(canvas, state.placeholderMovingObjects);

  setState({
    draggingOverTrack: null,
    isPointerOverHelperTrack: false,
    placeholderMovingObjects: [],
  });

  (this as any).fire('clip:move');
  (this as any).fire('update:track');
  this.requestRenderAll();
}

function onObjectResizing(
  this: TimelineCanvas,
  e: BasicTransformEvent<TPointerEvent> & {
    target: FabricObject<
      Partial<FabricObjectProps>,
      SerializedObjectProps,
      ObjectEvents
    >;
  }
) {
  const canvas = this;
  const allObjects = canvas.getObjects();
  const target = e.target;
  const transform = e.transform;
  const corner = (canvas as any)._currentTransform?.corner;
  const targetRect = target.getBoundingRect();

  if (transform.action === 'resizing') {
    const skipObjects = [
      target,
      ...canvas.getActiveObjects(),
      ...allObjects.filter(
        (obj) =>
          obj instanceof Track ||
          isHelperTrack(obj) ||
          (obj as any).type === 'Placeholder' ||
          (obj as any).isAlignmentAuxiliary
      ),
    ];

    const lineGuideStops = getLineGuideStops(skipObjects, canvas);
    const validatelineGuideStopsVertical = lineGuideStops.vertical.filter(
      (dataV) => {
        const val = dataV.val;
        if (corner === 'ml') {
          return val <= targetRect.left;
        } else if (corner === 'mr') {
          return val >= targetRect.left + targetRect.width;
        }
      }
    );
    lineGuideStops.vertical = validatelineGuideStopsVertical;
    const itemBounds = getObjectSnappingEdges(target);
    const guides = getGuides(lineGuideStops, itemBounds);
    clearAuxiliaryObjects(canvas, allObjects);
    if (guides.length) {
      drawGuides(guides, canvas);
    }
  }
}
export function addGuidelineEvents(timeline: TimelineCanvas) {
  timeline.on('object:moving', onObjectMoving.bind(timeline));
  timeline.on('object:modified', onObjectModified.bind(timeline));
  timeline.on('object:resizing', onObjectResizing.bind(timeline));
}

export function removeGuidelineEvents(timeline: TimelineCanvas) {
  timeline.off('object:moving', onObjectMoving.bind(timeline));
  timeline.off('object:modified', onObjectModified.bind(timeline));
  timeline.off('object:resizing', onObjectResizing.bind(timeline));
}
