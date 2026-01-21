import { type FabricObject } from 'fabric';
import type TimelineEngine from '../engine';
import {
  getLineGuideStops,
  getObjectSnappingEdges,
  getGuides,
  drawGuides,
  clearAuxiliaryObjects,
} from '../guidelines/utils';

export function handleDragging(timeline: TimelineEngine, options: any) {
  const target = options.target as FabricObject;
  if (!target) return;

  // --- Snapping Guidelines ---
  const allObjects = timeline.getObjects();
  const targetRect = target.getBoundingRect();
  target.setCoords();

  const pointer = timeline.getPointer(options.e);
  const cursorY = pointer.y;

  const skipObjects = [target, ...timeline.getActiveObjects()];
  const lineGuideStops = getLineGuideStops(skipObjects, timeline);
  const itemBounds = getObjectSnappingEdges(target);
  const guides = getGuides(lineGuideStops, itemBounds);

  if (timeline.enableGuideRedraw) {
    clearAuxiliaryObjects(timeline, allObjects);
    if (guides.length > 0) {
      drawGuides(guides, targetRect, timeline);
    }
    timeline.enableGuideRedraw = false;
    setTimeout(() => {
      timeline.enableGuideRedraw = true;
    }, 50);
  }

  guides.forEach((lineGuide) => {
    if (lineGuide.orientation === 'V') {
      target.set('left', lineGuide.lineGuide + lineGuide.offset);
      target.setCoords();
    }
  });
  // ---------------------------

  // --- Helper Highlights ---
  timeline.getObjects().forEach((obj: any) => {
    if (obj.isHelper) {
      // Check if pointer is over the helper (with some tolerance if needed)
      if (pointer.y >= obj.top && pointer.y <= obj.top + obj.height) {
        obj.set('fill', 'rgba(255, 255, 255, 0.5)');
        obj.set('visible', true);
        if (obj.separatorIndex !== undefined) {
          timeline.setActiveSeparatorIndex(obj.separatorIndex);
        }
      } else {
        obj.set('fill', 'transparent');
      }
    }
  });
  // -------------------------

  timeline.requestRenderAll();
}
