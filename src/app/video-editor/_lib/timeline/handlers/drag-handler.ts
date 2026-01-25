import { type FabricObject } from "fabric";
import type TimelineEngine from "../engine";
import {
  getLineGuideStops,
  getObjectSnappingEdges,
  getGuides,
  drawGuides,
  clearAuxiliaryObjects,
} from "../guidelines/utils";

export function handleDragging(timeline: TimelineEngine, options: any) {
  const target = options.target as FabricObject;
  if (!target) return;

  const allObjects = timeline.getObjects();
  const targetRect = target.getBoundingRect();
  target.setCoords();

  const pointer = timeline.getPointer(options.e);

  // --- Snapping Guidelines ---
  if (timeline.isSnappingEnabled) {
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
      if (lineGuide.orientation === "V") {
        target.set("left", lineGuide.lineGuide + lineGuide.offset);
        target.setCoords();
      }
    });
  } else {
    // Ensure guides are cleared if snapping is disabled mid-drag (though unlikely)
    clearAuxiliaryObjects(timeline, allObjects);
  }
  // ---------------------------

  // --- Helper Highlights ---
  let highlightedSeparator = false;
  timeline.getObjects().forEach((obj: any) => {
    if (obj.isHelper) {
      // Check if pointer is over the helper
      if (pointer.y >= obj.top && pointer.y <= obj.top + obj.height) {
        obj.set("fill", "rgba(255, 255, 255, 0.5)");
        obj.set("visible", true);
        if (obj.separatorIndex !== undefined) {
          timeline.setActiveSeparatorIndex(obj.separatorIndex);
          highlightedSeparator = true;
        }
      } else {
        obj.set("fill", "transparent");
      }
    }
  });

  if (!highlightedSeparator) {
    // If not over any separator, check if we are over a track to clear highlights
    const track = timeline.getTrackAt(pointer.y);
    if (track) {
      timeline.setActiveSeparatorIndex(null);
    }
  }
  // -------------------------

  timeline.requestRenderAll();
}
