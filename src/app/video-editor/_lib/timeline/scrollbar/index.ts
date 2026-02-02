import type { TMat2D, TPointerEvent } from 'fabric';
import { util } from 'fabric';
import { TimelineCanvas } from '../canvas';
import type {
  ScrollbarProps,
  ScrollbarsProps,
  ScrollbarXProps,
  ScrollbarYProps,
} from './types';
import { getObjectsBoundingRect, limitViewport } from './util';
import { Track } from '../track';
import { Helper } from '../helper';

export class Scrollbars {
  canvas: TimelineCanvas;
  fill = 'rgba(0,0,0,.5)';
  stroke = 'rgba(255,255,255,.8)';
  lineWidth = 1;
  hideX = false;
  hideY = false;
  scrollbarMinWidth = 40;
  scrollbarSize = 8;
  scrollSpace = 2;
  padding = 0;
  extraMarginX = 50;
  extraMarginY = 50;
  offsetX = 0;
  offsetY = 0;
  scrollbarWidth = 8;
  scrollbarColor = 'rgba(0,0,0,.5)';
  private _viewportChangeListeners: ((left: number) => void)[] = [];

  set onViewportChange(callback: ((left: number) => void) | undefined | null) {
    if (callback) {
      this._viewportChangeListeners = [callback];
    } else {
      this._viewportChangeListeners = [];
    }
  }

  addViewportChangeListener(callback: (left: number) => void) {
    this._viewportChangeListeners.push(callback);
  }

  removeViewportChangeListener(callback: (left: number) => void) {
    this._viewportChangeListeners = this._viewportChangeListeners.filter(
      (cb) => cb !== callback
    );
  }

  private _bar?: { type: string; start: number; vpt: TMat2D };
  private _barViewport = {
    left: 1,
    right: -1,
    top: 1,
    bottom: -1,
    sx: 1,
    sy: 1,
  };

  private _originalMouseDown: any;
  private _originalMouseMove: any;
  private _originalMouseUp: any;

  constructor(canvas: TimelineCanvas, props: ScrollbarsProps = {}) {
    this.canvas = canvas;
    Object.assign(this, props);

    if (props.scrollbarWidth !== undefined) {
      this.scrollbarSize = props.scrollbarWidth;
    }
    if (props.scrollbarColor !== undefined) {
      this.fill = props.scrollbarColor;
    }

    // @ts-ignore - access internal handlers
    this._originalMouseDown = this.canvas.__onMouseDown;
    this._originalMouseMove = this.canvas._onMouseMove;
    this._originalMouseUp = this.canvas._onMouseUp;

    this.canvas.__onMouseDown = this.mouseDownHandler.bind(this);
    this.canvas._onMouseMove = this.mouseMoveHandler.bind(this);
    this.canvas._onMouseUp = this.mouseUpHandler.bind(this);

    this.beforeRenderHandler = this.beforeRenderHandler.bind(this);
    this.afterRenderHandler = this.afterRenderHandler.bind(this);

    this.initBehavior();
  }

  initBehavior() {
    this.canvas.on('before:render', this.beforeRenderHandler);
    this.canvas.on('after:render', this.afterRenderHandler);
  }

  getScrollbar(e: TPointerEvent) {
    const p = this.canvas.getViewportPoint(e);
    const vpt = this.canvas.viewportTransform.slice(0) as TMat2D;

    if (!this.hideX) {
      const isOverTrackX =
        p.y >
          this.canvas.height -
            this.scrollbarSize -
            this.scrollSpace -
            this.padding &&
        p.y < this.canvas.height - this.scrollSpace + this.padding;

      if (isOverTrackX) {
        const isOverHandle =
          p.x > this._barViewport.left && p.x < this._barViewport.right;
        if (isOverHandle) return { type: 'x', start: p.x, vpt };
        // If over track but not handle, return a "track" type to swallow event
        return { type: 'x-track', start: p.x, vpt };
      }
    }

    if (!this.hideY) {
      const isOverTrackY =
        p.x >
          this.canvas.width -
            this.scrollbarSize -
            this.scrollSpace -
            this.padding &&
        p.x < this.canvas.width - this.scrollSpace + this.padding;

      if (isOverTrackY) {
        const isOverHandle =
          p.y > this._barViewport.top && p.y < this._barViewport.bottom;
        if (isOverHandle) return { type: 'y', start: p.y, vpt };
        return { type: 'y-track', start: p.y, vpt };
      }
    }
  }

  mouseDownHandler(e: TPointerEvent) {
    this._bar = this.getScrollbar(e);

    // If it's a track click, we swallow it to prevent "drag" (selection)
    // and we could potentially implement "jump to here" logic later
    if (this._bar?.type.endsWith('-track')) {
      return;
    }

    if (!this._bar) {
      // @ts-ignore
      return (this.canvas.constructor.prototype as any).__onMouseDown.call(
        this.canvas,
        e
      );
    }
  }

  mouseMoveHandler(e: TPointerEvent) {
    if (!this._bar || this._bar.type.endsWith('-track')) {
      // @ts-ignore
      return (this.canvas.constructor.prototype as any)._onMouseMove.call(
        this.canvas,
        e
      );
    }
    const p = this.canvas.getViewportPoint(e);
    const s =
      this._bar.type == 'x' ? this._barViewport.sx : this._barViewport.sy;
    const n = this._bar.type == 'x' ? 4 : 5;
    const end = this._bar.type == 'x' ? p.x : p.y;
    const vpt = this._bar.vpt.slice(0) as TMat2D;
    vpt[n] -= (end - this._bar.start) * s;

    limitViewport(
      this.canvas,
      vpt,
      this.offsetX,
      this.offsetY,
      this.extraMarginX,
      this.extraMarginY
    );

    this.canvas.setViewportTransform(vpt);
    this.canvas.requestRenderAll();
  }

  mouseUpHandler(e: TPointerEvent) {
    if (!this._bar) {
      // @ts-ignore
      (this.canvas.constructor.prototype as any)._onMouseUp.call(
        this.canvas,
        e
      );
    }
    delete this._bar;
  }

  beforeRenderHandler() {
    const ctx = this.canvas.contextTop;
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();
  }

  afterRenderHandler() {
    const { tl, br } = (this.canvas as any).vptCoords || {
      tl: { x: 0, y: 0 },
      br: { x: this.canvas.width, y: this.canvas.height },
    };
    const mapRect = { left: tl.x, top: tl.y, right: br.x, bottom: br.y };
    const objectRect = getObjectsBoundingRect(this.canvas);

    const objectRectWithMargin = {
      left: Math.min(objectRect.left, -this.offsetX),
      top: Math.min(objectRect.top, -this.offsetY),
      right: Math.max(
        objectRect.right + this.extraMarginX,
        tl.x + this.canvas.width / this.canvas.getZoom()
      ),
      bottom: objectRect.bottom + this.extraMarginY,
    };

    if (objectRectWithMargin.left > mapRect.left)
      objectRectWithMargin.left = mapRect.left;
    if (objectRectWithMargin.top > mapRect.top)
      objectRectWithMargin.top = mapRect.top;
    if (objectRectWithMargin.bottom < mapRect.bottom)
      objectRectWithMargin.bottom = mapRect.bottom;
    if (objectRectWithMargin.right < mapRect.right)
      objectRectWithMargin.right = mapRect.right;

    // Asegurar que los tracks y helpers cubran todo el área visible a la derecha
    const requiredWidth = br.x + 5000; // Un poco más del margen visible actual
    this.canvas.getObjects().forEach((obj) => {
      if (
        (obj instanceof Track || obj instanceof Helper) &&
        obj.width < requiredWidth
      ) {
        obj.set('width', requiredWidth);
        obj.setCoords();
      }
    });

    this.render(this.canvas.contextTop, mapRect, objectRectWithMargin);

    this._viewportChangeListeners.forEach((listener) => listener(tl.x));
  }

  render(
    ctx: CanvasRenderingContext2D | null,
    mapRect: ScrollbarProps,
    objectRect: ScrollbarProps
  ) {
    if (!ctx) return;
    // Clear only scrollbar areas
    if (!this.hideX) {
      ctx.clearRect(
        0,
        this.canvas.height -
          this.scrollbarSize -
          this.scrollSpace -
          this.lineWidth,
        this.canvas.width,
        this.scrollbarSize + this.scrollSpace + this.lineWidth
      );
    }

    if (!this.hideY) {
      ctx.clearRect(
        this.canvas.width -
          this.scrollbarSize -
          this.scrollSpace -
          this.lineWidth,
        0,
        this.scrollbarSize + this.scrollSpace + this.lineWidth,
        this.canvas.height
      );
    }

    ctx.save();
    ctx.fillStyle = this.fill;
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.lineWidth;

    if (!this.hideX) this.drawScrollbarX(ctx, mapRect, objectRect);
    if (!this.hideY) this.drawScrollbarY(ctx, mapRect, objectRect);

    ctx.restore();
  }

  drawScrollbarX(
    ctx: CanvasRenderingContext2D,
    mapRect: ScrollbarXProps,
    objectRect: ScrollbarXProps
  ) {
    const mapWidth = mapRect.right - mapRect.left;
    const objectWidth = objectRect.right - objectRect.left;
    if (mapWidth >= objectWidth) {
      this._barViewport.left = 1;
      this._barViewport.right = -1;
      this._barViewport.sx = 1;
      return;
    }

    const scaleX = Math.min(mapWidth / objectWidth, 1);
    const w = this.canvas.width - this.scrollbarSize - this.scrollSpace * 2;
    const width = Math.max((w * scaleX) | 0, this.scrollbarMinWidth);
    const left =
      ((mapRect.left - objectRect.left) / (objectWidth - mapWidth)) *
      (w - width);

    const x = this.scrollSpace + left;
    const y = this.canvas.height - this.scrollbarSize - this.scrollSpace;
    this._barViewport.left = x;
    this._barViewport.right = x + width;
    this._barViewport.sx = objectWidth / mapWidth;

    this.drawRect(ctx, {
      x,
      y,
      w: width,
      h: this.scrollbarSize,
    });
  }

  drawScrollbarY(
    ctx: CanvasRenderingContext2D,
    mapRect: ScrollbarYProps,
    objectRect: ScrollbarYProps
  ) {
    const mapHeight = mapRect.bottom - mapRect.top;
    const objectHeight = objectRect.bottom - objectRect.top;
    if (mapHeight >= objectHeight) {
      this._barViewport.top = 1;
      this._barViewport.bottom = -1;
      this._barViewport.sy = 1;
      return;
    }

    const scaleY = Math.min(mapHeight / objectHeight, 1);
    const h = this.canvas.height - this.scrollbarSize - this.scrollSpace * 2;
    const height = Math.max((h * scaleY) | 0, this.scrollbarMinWidth);
    const top =
      ((mapRect.top - objectRect.top) / (objectHeight - mapHeight)) *
      (h - height);

    const x = this.canvas.width - this.scrollbarSize - this.scrollSpace;
    const y = this.scrollSpace + top;
    this._barViewport.top = y;
    this._barViewport.bottom = y + height;
    this._barViewport.sy = objectHeight / mapHeight;
    this.drawRect(ctx, {
      x,
      y,
      w: this.scrollbarSize,
      h: height,
    });
  }

  drawRect(
    ctx: CanvasRenderingContext2D,
    props: { x: number; y: number; w: number; h: number }
  ) {
    const { x, y, w, h } = props;
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  dispose() {
    // @ts-ignore
    this.canvas.__onMouseDown = this._originalMouseDown;
    // @ts-ignore
    this.canvas._onMouseMove = this._originalMouseMove;
    // @ts-ignore
    this.canvas._onMouseUp = this._originalMouseUp;

    this.canvas.off('before:render', this.beforeRenderHandler);
    this.canvas.off('after:render', this.afterRenderHandler);
  }
}
