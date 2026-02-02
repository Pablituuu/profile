import { Canvas, FabricObject, Line, TBBox } from 'fabric';
import { isHelperTrack } from './canvas';

const GUIDELINE_OFFSET = 10;

export const clearAuxiliaryObjects = (
  canvas: Canvas,
  allObjects: FabricObject[]
) => {
  allObjects.forEach(
    (obj) => (obj as any).isAlignmentAuxiliary && canvas.remove(obj)
  );
};

interface LineGuide {
  val: number;
  start: number;
  end: number;
}

export interface Guide {
  lineGuide: number;
  offset: number;
  orientation: 'V' | 'H';
  snap: string;
  targetDim: {
    start: number;
    end: number;
  };
}

export const getLineGuideStops = (
  skipShapes: FabricObject[],
  canvas: Canvas
): { vertical: LineGuide[]; horizontal: LineGuide[] } => {
  const vertical: LineGuide[] = [];
  const horizontal: LineGuide[] = [];

  canvas
    .getObjects()
    .filter((o) => o.visible)
    .forEach((guideObject) => {
      const type = (guideObject as any).type;
      const isForbidden =
        type === 'Track' ||
        type === 'Placeholder' ||
        isHelperTrack(guideObject) ||
        (guideObject as any).isAlignmentAuxiliary ||
        (guideObject as any).draggedObject ||
        (guideObject as any).id?.includes('-placeholder');

      if (isForbidden || skipShapes.some((obj) => obj === guideObject)) {
        return;
      }
      const box = guideObject.getBoundingRect();

      // Vertical stops (for X axis alignment)
      vertical.push({
        val: box.left,
        start: box.top,
        end: box.top + box.height,
      });
      vertical.push({
        val: box.left + box.width,
        start: box.top,
        end: box.top + box.height,
      });

      // Horizontal stops (for Y axis alignment)
      horizontal.push({
        val: box.top,
        start: box.left,
        end: box.left + box.width,
      });
      horizontal.push({
        val: box.top + box.height,
        start: box.left,
        end: box.left + box.width,
      });
    });

  return {
    vertical: vertical,
    horizontal: [], // Keeping it disabled as per current kit implementation analysis
  };
};

export const getGuides = (
  lineGuideStops: { vertical: LineGuide[]; horizontal: LineGuide[] },
  itemBounds: {
    vertical: { guide: number; offset: number; snap: string }[];
    horizontal: { guide: number; offset: number; snap: string }[];
  }
): Guide[] => {
  const guides: Guide[] = [];

  // Vertical snapping
  const resultV: any[] = [];
  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      const diff = Math.abs(lineGuide.val - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide.val,
          diff: diff,
          orientation: 'V',
          snap: itemBound.snap,
          offset: itemBound.offset,
          targetDim: { start: lineGuide.start, end: lineGuide.end },
        });
      }
    });
  });

  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  if (minV) guides.push(minV);

  return guides;
};

export const drawGuides = (guides: Guide[], canvas: Canvas) => {
  guides.forEach((lineGuide) => {
    const strokeWidth = 2 / canvas.getZoom();
    const options = {
      stroke: 'rgba(255, 255, 255, 0.8)', // White for guidelines
      strokeWidth: strokeWidth,
      strokeLineCap: 'square',
      excludeFromExport: true,
      isAlignmentAuxiliary: true,
      selectable: false,
      evented: false,
      objectCaching: false,
    } as any;

    if (lineGuide.orientation === 'V') {
      canvas.add(
        new Line(
          [
            lineGuide.lineGuide - strokeWidth / 2,
            -5000,
            lineGuide.lineGuide - strokeWidth / 2,
            5000,
          ],
          options
        )
      );
    }
  });
};

export const getObjectSnappingEdges = (
  target: FabricObject
): {
  vertical: { guide: number; offset: number; snap: string }[];
  horizontal: { guide: number; offset: number; snap: string }[];
} => {
  const rect = target.getBoundingRect();
  return {
    vertical: [
      {
        guide: Math.round(rect.left),
        offset: Math.round(target.left - rect.left),
        snap: 'start',
      },
      {
        guide: Math.round(rect.left + rect.width),
        offset: Math.round(target.left - rect.left - rect.width),
        snap: 'end',
      },
    ],
    horizontal: [
      {
        guide: Math.round(rect.top),
        offset: Math.round(target.top - rect.top),
        snap: 'start',
      },
      {
        guide: Math.round(rect.top + rect.height),
        offset: Math.round(target.top - rect.top - rect.height),
        snap: 'end',
      },
    ],
  };
};
