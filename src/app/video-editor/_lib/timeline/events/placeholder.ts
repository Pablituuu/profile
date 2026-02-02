import {
  ActiveSelection,
  FabricObject,
  ModifiedEvent,
  TEvent,
  TPointerEvent,
  Transform,
} from 'fabric';
import { Placeholder } from '../placeholder';
import { TimelineCanvas } from '../canvas';
import { clearPlaceholderObjects, isHelperTrack } from '../utils/canvas';
import { getState, setState } from './internal';
import { Track } from '../track';

function findOverlapObject(
  objects: FabricObject[],
  box: { left: number; top: number; width: number; height: number }
) {
  return objects.find((obj) => {
    const objRect = obj.getBoundingRect();
    // Use a small epsilon to avoid false positives with neighbors
    return (
      box.left < objRect.left + objRect.width - 1 &&
      box.left + box.width - 1 > objRect.left &&
      box.top < objRect.top + objRect.height &&
      box.top + box.height > objRect.top
    );
  });
}

export function onBeforeTransform(
  this: TimelineCanvas,
  e: TEvent<TPointerEvent> & {
    transform: Transform;
  }
) {
  const canvas = this;
  const state = getState();

  // Reset relevant state
  setState({
    primaryMovingObjects: [],
    placeholderMovingObjects: [],
    objectInitialPositions: {},
  });

  const activeSelection = canvas.getActiveObject();
  const activeObjects = (
    activeSelection instanceof ActiveSelection
      ? activeSelection.getObjects()
      : [activeSelection]
  ).filter(
    (obj) => obj && !(obj instanceof Track) && !isHelperTrack(obj)
  ) as FabricObject[];

  // For the ripple effect, we store the initial position of ALL clips on the canvas
  const allClips = canvas.getClips();
  const initialPositions: Record<string, { top: number; left: number }> = {};
  allClips.forEach((clip: any) => {
    initialPositions[clip.clipId || clip.id] = {
      top: clip.top,
      left: clip.left,
    };
  });

  setState({
    primaryMovingObjects: activeObjects,
    objectInitialPositions: initialPositions,
  });

  if (e.transform.action !== 'drag') return;

  const pointer = canvas.getScenePoint(e.e!);
  let objectsForPlaceholders = activeObjects;

  if (activeSelection instanceof ActiveSelection) {
    // Multi-selection: Find the specific object under the pointer to act as anchor
    const clickedObject = activeObjects.find((obj) => {
      const matrix = obj.calcTransformMatrix();
      const absPos = { x: matrix[4], y: matrix[5] };
      const halfWidth = obj.getScaledWidth() / 2;
      const halfHeight = obj.getScaledHeight() / 2;
      return (
        pointer.x >= absPos.x - halfWidth &&
        pointer.x <= absPos.x + halfWidth &&
        pointer.y >= absPos.y - halfHeight &&
        pointer.y <= absPos.y + halfHeight
      );
    });

    if (clickedObject) {
      objectsForPlaceholders = [clickedObject];
    } else if (activeObjects.length > 0) {
      // Fallback: only show placeholder for the first item
      objectsForPlaceholders = [activeObjects[0]];
    }
  }

  const placeholders = objectsForPlaceholders.map((target) => {
    const targetBounds = target.getBoundingRect();
    const targetId = (target as any).clipId || (target as any).id;

    state.objectInitialPositions[targetId] = {
      top: targetBounds.top,
      left: targetBounds.left,
    };
    const targetPlaceholder = new Placeholder({
      id: `${targetId}-placeholder`,
      left: target.left,
      top: target.top,
      width: target.width,
      height: target.height,
    });
    targetPlaceholder.draggedObject = target;
    return targetPlaceholder;
  });

  setState({ placeholderMovingObjects: placeholders });
  canvas.add(...placeholders);
}

export function onObjectMovingForPlaceholder(
  this: TimelineCanvas,
  e: ModifiedEvent<TPointerEvent>
) {
  e.e?.preventDefault();
  e.e?.stopPropagation();
  const state = getState();
  const placeholders = state.placeholderMovingObjects;
  const draggingOverTrack = state.draggingOverTrack;

  if (placeholders.length === 0) return;

  const allClips = this.getClips();
  const primaryIds = new Set(
    state.primaryMovingObjects.map((obj: any) => obj.clipId || obj.id)
  );

  // 1. Reset ALL clips (except those being dragged) to their initial positions
  // to ensure tracks we move Away from are properly restored.
  allClips.forEach((clip: any) => {
    const id = clip.clipId || clip.id;
    if (primaryIds.has(id)) return;
    const initialPos = state.objectInitialPositions[id];
    if (initialPos) {
      clip.set({
        left: initialPos.left,
        top: initialPos.top,
      });
      clip.setCoords();
    }
  });

  // 2. Hide placeholders if not over any track/helper
  if (!draggingOverTrack) {
    placeholders.forEach((p) => (p.visible = false));
    return;
  }

  // 3. Process each placeholder
  placeholders.forEach((placeholder: Placeholder) => {
    const draggedObject = placeholder.draggedObject;
    if (!draggedObject) return;

    placeholder.visible = true;
    placeholder.top = draggingOverTrack.top;

    // Get current absolute coordinates of the dragged object
    const matrix = draggedObject.calcTransformMatrix();
    const currentAbsLeft = matrix[4] - draggedObject.getScaledWidth() / 2;
    const currentAbsTop = matrix[5] - draggedObject.getScaledHeight() / 2;

    if (isHelperTrack(draggingOverTrack)) {
      placeholder.visible = false;
      placeholder.left = Math.max(0, currentAbsLeft);
      placeholder.setCoords();
      return;
    }

    const itemWidth = draggedObject.getScaledWidth();
    const pointer = this.getScenePoint(e.e!);

    // Filter clips on target track (excluding the selection itself)
    const clipsOnTrack = allClips
      .filter((clip: any) => {
        const id = clip.clipId || clip.id;
        const initialPos = state.objectInitialPositions[id];
        return (
          !primaryIds.has(id) &&
          initialPos &&
          Math.abs(initialPos.top - draggingOverTrack.top) < 1
        );
      })
      .map((clip: any) => {
        const id = clip.clipId || clip.id;
        const initialPos = state.objectInitialPositions[id];
        return {
          clip,
          initialLeft: initialPos?.left || 0,
          width: clip.getScaledWidth(),
        };
      })
      .sort((a, b) => a.initialLeft - b.initialLeft);

    // Identify if this placeholder interacts with existing clips
    const interactionClip = clipsOnTrack.find(
      (c: any) =>
        (pointer.x >= c.initialLeft - 10 &&
          pointer.x <= c.initialLeft + c.width + 10) ||
        (currentAbsLeft < c.initialLeft + c.width - 0.5 &&
          currentAbsLeft + itemWidth > c.initialLeft + 0.5)
    );

    if (interactionClip) {
      const centerX = interactionClip.initialLeft + interactionClip.width / 2;
      let targetLeft = pointer.x;

      if (pointer.x < centerX) {
        const prev = [...clipsOnTrack]
          .reverse()
          .find(
            (c: any) => c.initialLeft + c.width <= interactionClip.initialLeft
          );
        const gapStart = prev ? prev.initialLeft + prev.width : 0;
        targetLeft = interactionClip.initialLeft - itemWidth;
        if (targetLeft < gapStart) targetLeft = gapStart;
      } else {
        targetLeft = interactionClip.initialLeft + interactionClip.width;
      }

      if (targetLeft < 0) targetLeft = 0;
      placeholder.left = targetLeft;

      // Ripple Effect: shift following clips
      const clipsToShift = clipsOnTrack.filter(
        (c: any) => c.initialLeft >= targetLeft - 0.5
      );

      let neededShift = 0;
      if (clipsToShift.length > 0) {
        const firstClipAfter = clipsToShift[0];
        const availableGap = firstClipAfter.initialLeft - targetLeft;
        neededShift = Math.max(0, itemWidth - availableGap);
      }

      clipsToShift.forEach(({ clip, initialLeft }: any) => {
        clip.set('left', initialLeft + neededShift);
        clip.setCoords();
      });
    } else {
      placeholder.left = Math.max(0, currentAbsLeft);
    }
    placeholder.setCoords();
  });
}

export function addPlaceholderEvents(timeline: TimelineCanvas) {
  timeline.on('before:transform', onBeforeTransform.bind(timeline));
  timeline.on('object:moving', onObjectMovingForPlaceholder.bind(timeline));
}

export function removePlaceholderEvents(timeline: TimelineCanvas) {
  timeline.off('before:transform', onBeforeTransform.bind(timeline));
  timeline.off('object:moving', onObjectMovingForPlaceholder.bind(timeline));
}
