import { type TMat2D, type TPointerEventInfo, util, Point } from 'fabric';
import { TimelineEngine } from '../engine';
import { TIMELINE_CONSTANTS } from '../constants';

const calculateClipBounds = (canvas: TimelineEngine) => {
  const objects = canvas
    .getObjects()
    .filter(
      (obj) =>
        (obj as any).clipId &&
        !(obj as any).clipId.startsWith('track-') &&
        !(obj as any).isHelper &&
        ![
          'Track',
          'Playhead',
          'Ruler',
          'Helper',
          'track-bg',
          'Placeholder',
        ].includes(obj.type || (obj as any).type)
    );

  if (objects.length === 0) {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  const { left, top, width, height } = util.makeBoundingBoxFromPoints(
    objects.map((obj) => obj.getCoords()).flat(1)
  );
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
  };
};

export const constrainViewport = (
  canvas: TimelineEngine,
  vpt: TMat2D,
  config: {
    offsetX: number;
    offsetY: number;
    extraMarginX: number;
    extraMarginY: number;
  }
): TMat2D => {
  const zoom = vpt[0];
  const bounds = calculateClipBounds(canvas);

  const viewLeft = Math.min(bounds.left, -config.offsetX);
  const viewTop = Math.min(bounds.top, -config.offsetY);
  const viewRight = bounds.right + config.extraMarginX;
  const viewBottom = bounds.bottom + config.extraMarginY;

  const totalW = viewRight - viewLeft;
  const totalH = viewBottom - viewTop;

  const viewportW = canvas.width / zoom;
  const viewportH = canvas.height / zoom;

  // Horizontal constraint
  if (totalW <= viewportW) {
    vpt[4] = -viewLeft * zoom;
  } else {
    const maxL = config.offsetX * zoom;
    if (vpt[4] > maxL) vpt[4] = maxL;

    const minR = -(viewRight * zoom - canvas.width);
    if (minR < 0 && vpt[4] < minR) {
      vpt[4] = minR;
    }
  }

  // Vertical constraint
  if (totalH <= viewportH) {
    vpt[5] = -viewTop * zoom;
  } else {
    const maxT = config.offsetY * zoom;
    if (vpt[5] > maxT) vpt[5] = maxT;

    const minB = -(viewBottom * zoom - canvas.height);
    if (minB < 0 && vpt[5] < minB) {
      vpt[5] = minB;
    }
  }

  return vpt;
};

export const setupWheelControl =
  (
    canvas: TimelineEngine,
    options: {
      offsetX?: number;
      offsetY?: number;
      extraMarginX?: number;
      extraMarginY?: number;
      minZoom?: number;
      maxZoom?: number;
      onZoom?: (zoom: number) => void;
    } = {}
  ) =>
  (event: WheelEvent | TPointerEventInfo<WheelEvent>) => {
    const e = 'e' in event ? event.e : event;
    const viewportPoint =
      'viewportPoint' in event
        ? event.viewportPoint
        : new Point(canvas.width / 2, canvas.height / 2);

    if (e.target === canvas.upperCanvasEl) e.preventDefault();

    // Zooming (Alt or Meta)
    if (e.altKey || (e.metaKey && !e.ctrlKey)) {
      const isPrecision = Math.floor(e.deltaY) !== Math.ceil(e.deltaY);
      const zoomFactor = isPrecision ? 0.99 : 0.995;
      let zoom = canvas.getZoom();
      zoom *= zoomFactor ** e.deltaY;

      if (options.maxZoom !== undefined && zoom > options.maxZoom)
        zoom = options.maxZoom;
      if (options.minZoom !== undefined && zoom < options.minZoom)
        zoom = options.minZoom;

      canvas.zoomToPoint(viewportPoint, zoom);

      const vpt = canvas.viewportTransform.slice(0) as TMat2D;
      const limitedVpt = constrainViewport(canvas, vpt, {
        offsetX: options.offsetX ?? 0,
        offsetY: options.offsetY ?? 0,
        extraMarginX: options.extraMarginX ?? 0,
        extraMarginY: options.extraMarginY ?? 0,
      });

      canvas.setViewportTransform(limitedVpt);
      options.onZoom?.(zoom);
      canvas.requestRenderAll();
      return;
    }

    // Panning
    const vpt = canvas.viewportTransform.slice(0) as TMat2D;

    // Ctrl + Wheel = Horizontal Scroll (Requested by user)
    // Shift + Wheel = Horizontal Scroll (Common standard)
    if (e.ctrlKey || e.shiftKey) {
      vpt[4] -= e.deltaY;
    } else {
      vpt[4] -= e.deltaX;
      vpt[5] -= e.deltaY;
    }

    const limitedVpt = constrainViewport(canvas, vpt, {
      offsetX: options.offsetX ?? 0,
      offsetY: options.offsetY ?? 0,
      extraMarginX: options.extraMarginX ?? 0,
      extraMarginY: options.extraMarginY ?? 0,
    });

    canvas.setViewportTransform(limitedVpt);
    canvas.requestRenderAll();
  };
