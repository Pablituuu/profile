import type { TMat2D, TPointerEvent } from 'fabric';
import { util } from 'fabric';
import { TimelineEngine } from '../engine';
import { RectDimensions, ScrollbarOptions } from './types';

export class TimelineScrollbars {
  private canvas: TimelineEngine;
  private barColor = 'rgba(255, 255, 255, 0.25)';
  private outlineColor = 'rgba(0, 0, 0, 0.1)';
  private outlineWidth = 1;
  private showHorizontal = true;
  private showVertical = false;
  private minBarLength = 40;
  private barThickness = 6;
  private barSpacing = 4;
  private contentPadding = 4;
  private marginRight = 200;
  private marginBottom = 200;
  private initialOffsetX = 0;
  private initialOffsetY = 0;
  private onScrollChanged?: (scrollLeft: number) => void;

  private _dragState?: {
    type: 'x' | 'y';
    startPos: number;
    initialVpt: TMat2D;
  };
  private _scrollbarBounds = {
    xStart: 0,
    xEnd: 0,
    yStart: 0,
    yEnd: 0,
    scaleX: 1,
    scaleY: 1,
  };

  private _originalMouseDown?: (e: TPointerEvent) => void;
  private _originalMouseMove?: (e: TPointerEvent) => void;
  private _originalMouseUp?: (e: TPointerEvent) => void;

  constructor(canvas: TimelineEngine, options: ScrollbarOptions = {}) {
    this.canvas = canvas;
    Object.assign(this, options);

    // Save originals to allow restore
    this._originalMouseDown = this.canvas.__onMouseDown;
    this._originalMouseMove = this.canvas._onMouseMove;
    this._originalMouseUp = this.canvas._onMouseUp;

    // Inject handlers
    this.canvas.__onMouseDown = this.handleMouseDown.bind(this);
    this.canvas._onMouseMove = this.handleMouseMove.bind(this);
    this.canvas._onMouseUp = this.handleMouseUp.bind(this);

    this.onBeforeRender = this.onBeforeRender.bind(this);
    this.onAfterRender = this.onAfterRender.bind(this);

    this.attachEvents();
  }

  private attachEvents() {
    this.canvas.on('before:render', this.onBeforeRender);
    this.canvas.on('after:render', this.onAfterRender);
  }

  private detectScrollbarHit(e: TPointerEvent) {
    const p = this.canvas.getViewportPoint(e);

    if (this.showHorizontal) {
      const isOverX =
        p.x > this._scrollbarBounds.xStart &&
        p.x < this._scrollbarBounds.xEnd &&
        p.y >
          this.canvas.height -
            this.barThickness -
            this.barSpacing -
            this.contentPadding &&
        p.y < this.canvas.height - this.barSpacing + this.contentPadding;

      if (isOverX)
        return {
          type: 'x' as const,
          startPos: p.x,
          initialVpt: this.canvas.viewportTransform.slice(0) as TMat2D,
        };
    }

    if (this.showVertical) {
      const isOverY =
        p.y > this._scrollbarBounds.yStart &&
        p.y < this._scrollbarBounds.yEnd &&
        p.x >
          this.canvas.width -
            this.barThickness -
            this.barSpacing -
            this.contentPadding &&
        p.x < this.canvas.width - this.barSpacing + this.contentPadding;

      if (isOverY)
        return {
          type: 'y' as const,
          startPos: p.y,
          initialVpt: this.canvas.viewportTransform.slice(0) as TMat2D,
        };
    }
    return null;
  }

  private handleMouseDown(e: TPointerEvent) {
    this._dragState = this.detectScrollbarHit(e) || undefined;
    if (!this._dragState && this._originalMouseDown) {
      this._originalMouseDown.call(this.canvas, e);
    }
  }

  private handleMouseMove(e: TPointerEvent) {
    if (!this._dragState) {
      if (this._originalMouseMove) this._originalMouseMove.call(this.canvas, e);
      return;
    }

    const p = this.canvas.getViewportPoint(e);
    const scale =
      this._dragState.type === 'x'
        ? this._scrollbarBounds.scaleX
        : this._scrollbarBounds.scaleY;
    const vptIndex = this._dragState.type === 'x' ? 4 : 5;
    const currentPos = this._dragState.type === 'x' ? p.x : p.y;

    const nextVpt = this._dragState.initialVpt.slice(0) as TMat2D;
    nextVpt[vptIndex] -= (currentPos - this._dragState.startPos) * scale;

    this.constrainVpt(nextVpt);
    this.canvas.setViewportTransform(nextVpt);
    this.canvas.requestRenderAll();
  }

  private handleMouseUp(e: TPointerEvent) {
    if (!this._dragState && this._originalMouseUp) {
      this._originalMouseUp.call(this.canvas, e);
    }
    this._dragState = undefined;
  }

  private onBeforeRender() {
    // Sync logic handled after render usually to avoid lag
  }

  private onAfterRender() {
    const { tl, br } = this.canvas.vptCoords;
    const viewportRect = { left: tl.x, top: tl.y, right: br.x, bottom: br.y };
    const contentBounds = this.getContentBounds();

    const worldRect = {
      left: Math.min(contentBounds.left, -this.initialOffsetX),
      top: Math.min(contentBounds.top, -this.initialOffsetY),
      right: contentBounds.right + this.marginRight,
      bottom: contentBounds.bottom + this.marginBottom,
    };

    // Ensure world rect covers visible viewport
    if (worldRect.left > viewportRect.left) worldRect.left = viewportRect.left;
    if (worldRect.top > viewportRect.top) worldRect.top = viewportRect.top;
    if (worldRect.right < viewportRect.right)
      worldRect.right = viewportRect.right;
    if (worldRect.bottom < viewportRect.bottom)
      worldRect.bottom = viewportRect.bottom;

    this.drawBars(this.canvas.contextTop, viewportRect, worldRect);

    if (this.onScrollChanged) {
      this.onScrollChanged(tl.x);
    }
  }

  private drawBars(
    ctx: CanvasRenderingContext2D,
    view: RectDimensions,
    world: RectDimensions
  ) {
    // Clear only gutters
    const clearRegion = this.barThickness + this.barSpacing * 2;
    if (this.showHorizontal) {
      ctx.clearRect(
        0,
        this.canvas.height - clearRegion,
        this.canvas.width,
        clearRegion
      );
    }
    if (this.showVertical) {
      ctx.clearRect(
        this.canvas.width - clearRegion,
        0,
        clearRegion,
        this.canvas.height
      );
    }

    ctx.save();
    ctx.fillStyle = this.barColor;
    ctx.strokeStyle = this.outlineColor;
    ctx.lineWidth = this.outlineWidth;

    if (this.showHorizontal) this.renderBarX(ctx, view, world);
    if (this.showVertical) this.renderBarY(ctx, view, world);

    ctx.restore();
  }

  private renderBarX(
    ctx: CanvasRenderingContext2D,
    view: RectDimensions,
    world: RectDimensions
  ) {
    const viewW = view.right - view.left;
    const worldW = world.right - world.left;

    if (viewW >= worldW) {
      this._scrollbarBounds.xStart = 0;
      this._scrollbarBounds.xEnd = -1;
      return;
    }

    const ratio = viewW / worldW;
    const trackW = this.canvas.width - this.barSpacing * 2;
    const barW = Math.max(trackW * ratio, this.minBarLength);
    const scrollOffset =
      ((view.left - world.left) / (worldW - viewW)) * (trackW - barW);

    const x = this.barSpacing + scrollOffset;
    const y = this.canvas.height - this.barThickness - this.barSpacing;

    this._scrollbarBounds.xStart = x;
    this._scrollbarBounds.xEnd = x + barW;
    this._scrollbarBounds.scaleX = worldW / viewW;

    this.drawRoundedRect(ctx, x, y, barW, this.barThickness);
  }

  private renderBarY(
    ctx: CanvasRenderingContext2D,
    view: RectDimensions,
    world: RectDimensions
  ) {
    const viewH = view.bottom - view.top;
    const worldH = world.bottom - world.top;

    if (viewH >= worldH) {
      this._scrollbarBounds.yStart = 0;
      this._scrollbarBounds.yEnd = -1;
      return;
    }

    const ratio = viewH / worldH;
    const trackH = this.canvas.height - this.barSpacing * 2;
    const barH = Math.max(trackH * ratio, this.minBarLength);
    const scrollOffset =
      ((view.top - world.top) / (worldH - viewH)) * (trackH - barH);

    const x = this.canvas.width - this.barThickness - this.barSpacing;
    const y = this.barSpacing + scrollOffset;

    this._scrollbarBounds.yStart = y;
    this._scrollbarBounds.yEnd = y + barH;
    this._scrollbarBounds.scaleY = worldH / viewH;

    this.drawRoundedRect(ctx, x, y, this.barThickness, barH);
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    if (this.outlineWidth > 0) ctx.stroke();
  }

  private getContentBounds(): RectDimensions {
    const objects = this.canvas
      .getObjects()
      .filter(
        (o) =>
          !['Track', 'Playhead', 'Helper', 'track-bg'].includes(
            o.type || (o as any).type
          )
      );
    if (objects.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 };

    const bounds = util.makeBoundingBoxFromPoints(
      objects.map((o) => o.getCoords()).flat(1)
    );
    return {
      left: bounds.left,
      top: bounds.top,
      right: bounds.left + bounds.width,
      bottom: bounds.top + bounds.height,
    };
  }

  private constrainVpt(vpt: TMat2D) {
    const zoom = vpt[0];
    const bounds = this.getContentBounds();

    const viewL = Math.min(bounds.left, -this.initialOffsetX);
    const viewT = Math.min(bounds.top, -this.initialOffsetY);
    const viewR = bounds.right + this.marginRight;
    const viewB = bounds.bottom + this.marginBottom;

    const canvasW = this.canvas.width / zoom;
    const canvasH = this.canvas.height / zoom;

    // Horizontal
    if (viewR - viewL <= canvasW) {
      vpt[4] = -viewL * zoom;
    } else {
      if (vpt[4] > this.initialOffsetX * zoom)
        vpt[4] = this.initialOffsetX * zoom;
      const minR = -(viewR * zoom - this.canvas.width);
      if (vpt[4] < minR) vpt[4] = minR;
    }

    // Vertical
    if (viewB - viewT <= canvasH) {
      vpt[5] = -viewT * zoom;
    } else {
      if (vpt[5] > this.initialOffsetY * zoom)
        vpt[5] = this.initialOffsetY * zoom;
      const minB = -(viewB * zoom - this.canvas.height);
      if (vpt[5] < minB) vpt[5] = minB;
    }
  }

  public dispose() {
    if (this._originalMouseDown)
      this.canvas.__onMouseDown = this._originalMouseDown;
    if (this._originalMouseMove)
      this.canvas._onMouseMove = this._originalMouseMove;
    if (this._originalMouseUp) this.canvas._onMouseUp = this._originalMouseUp;

    this.canvas.off('before:render', this.onBeforeRender);
    this.canvas.off('after:render', this.onAfterRender);
  }
}
