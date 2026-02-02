import { type TMat2D, type TPointerEventInfo, util } from 'fabric';
import { TimelineCanvas } from '../canvas';
import { Track } from '../track';
import { Helper } from '../helper';
import { Placeholder } from '../placeholder';

type SizeProps = {
  min: number;
  max: number;
};

export const getObjectsBoundingRect = (canvas: TimelineCanvas) => {
  const objects = canvas.getObjects().filter((obj) => {
    // Solo incluimos clips reales (Video, Audio, Imagen, Texto)
    // Se identifican por tener un clipId y no ser de fondo/auxiliares
    const isClip = (obj as any).clipId !== undefined;
    const isTrack = obj instanceof Track || (obj as any).type === 'Track';
    const isHelper =
      obj instanceof Helper ||
      (obj as any).type === 'Helper' ||
      (obj as any).kind;
    const isPlaceholder =
      obj instanceof Placeholder || (obj as any).type === 'Placeholder';

    return (
      isClip &&
      !isTrack &&
      !isHelper &&
      !isPlaceholder &&
      !(obj as any).isAlignmentAuxiliary
    );
  });

  if (objects.length === 0) {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  const { left, top, width, height } = util.makeBoundingBoxFromPoints(
    objects.map((x) => x.getCoords()).flat(1)
  );
  return { left, top, right: left + width, bottom: top + height };
};

export const limitViewport = (
  canvas: TimelineCanvas,
  vpt: TMat2D,
  offsetX = 0,
  offsetY = 0,
  extraMarginX = 50,
  extraMarginY = 50
): TMat2D => {
  const zoom = vpt[0];
  const objectRect = getObjectsBoundingRect(canvas);

  // Forzamos que el inicio legal sea siempre 0 o mayor (nunca negativo)
  const minContentX = Math.max(Math.min(objectRect.left, -offsetX), 0);
  const minContentY = Math.max(Math.min(objectRect.top, -offsetY), 0);
  const maxContentX = objectRect.right + extraMarginX;
  const maxContentY = objectRect.bottom + extraMarginY;

  const canvasWidth = canvas.width / zoom;
  const canvasHeight = canvas.height / zoom;

  // 1. LÍMITE IZQUIERDO Y SUPERIOR (No permitir ver espacio < 0)
  if (vpt[4] > 0) vpt[4] = 0;
  if (vpt[5] > 0) vpt[5] = 0;

  // 2. LÍMITE VERTICAL INFERIOR (Estricto)
  const totalHeight = maxContentY - minContentY;
  if (totalHeight <= canvasHeight) {
    vpt[5] = 0;
  } else {
    const minVptBottom = -(maxContentY * zoom - canvas.height);
    if (vpt[5] < minVptBottom) vpt[5] = minVptBottom;
  }

  // 3. LÍMITE HORIZONTAL DERECHO (Limitado al contenido + margen)
  const totalWidth = maxContentX;
  if (totalWidth <= canvasWidth) {
    vpt[4] = 0;
  } else {
    const minVptRight = -(maxContentX * zoom - canvas.width);
    if (vpt[4] < minVptRight) vpt[4] = minVptRight;
  }

  return vpt;
};

type MouseWheelOptions = {
  offsetX?: number;
  offsetY?: number;
  extraMarginX?: number;
  extraMarginY?: number;
} & Partial<SizeProps>;

export const makeMouseWheel =
  (canvas: TimelineCanvas, options: MouseWheelOptions = {}) =>
  (wheelEvent: TPointerEventInfo<WheelEvent>) => {
    const e = wheelEvent.e;
    if (e.target == canvas.upperCanvasEl) e.preventDefault();

    const isTouchScale = Math.floor(e.deltaY) != Math.ceil(e.deltaY);

    if (e.ctrlKey || e.metaKey) {
      const speed = isTouchScale ? 0.99 : 0.998;
      let zoom = canvas.getZoom();
      zoom *= speed ** e.deltaY;

      if (options.max != undefined && zoom > options.max) zoom = options.max;
      if (options.min != undefined && zoom < options.min) zoom = options.min;
      canvas.zoomToPoint(wheelEvent.viewportPoint, zoom);
      canvas.requestRenderAll();
      return;
    }

    const vpt = canvas.viewportTransform.slice(0) as TMat2D;

    // Map vertical wheel to horizontal scroll in timeline by default
    // If Shift is pressed, we could keep it as is or do something else,
    // but usually in timelines: Wheel = Horizontal Scroll, Shift+Wheel = Vertical Scroll (or vice versa)
    // We'll do: Wheel = Horizontal Scroll (deltaY -> vpt[4]), Shift+Wheel = Vertical Scroll (deltaY -> vpt[5])
    if (e.shiftKey) {
      vpt[4] -= e.deltaY;
    } else {
      vpt[4] -= e.deltaX;
      vpt[5] -= e.deltaY;
    }

    const scrollbars = (canvas as any).scrollbars;

    const limitedVpt = limitViewport(
      canvas,
      vpt,
      options.offsetX ?? scrollbars?.offsetX ?? 0,
      options.offsetY ?? scrollbars?.offsetY ?? 0,
      options.extraMarginX ?? scrollbars?.extraMarginX ?? 50,
      options.extraMarginY ?? scrollbars?.extraMarginY ?? 50
    );
    canvas.setViewportTransform(limitedVpt);
    canvas.requestRenderAll();
  };
