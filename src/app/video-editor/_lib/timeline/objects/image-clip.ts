import { util } from 'fabric';
import { TimelineClip, TimelineClipProps } from './base-clip';

export class ImageClip extends TimelineClip {
  static type = 'ImageClip';
  private imageElement: HTMLImageElement | null = null;

  constructor(options: TimelineClipProps) {
    super(options);
    this.set({
      fill: options.fill || '#164e63', // Cyan-900
    });
    if (this.sourceUrl) {
      this.preloadImage();
    }
  }

  private async preloadImage() {
    if (!this.sourceUrl) return;
    try {
      this.imageElement = await util.loadImage(this.sourceUrl);
      this.set({ dirty: true });
      this.canvas?.requestRenderAll();
    } catch (err) {
      console.warn('Timeline: Failed to load preview image', err);
    }
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Clip to rounded rect
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 5);
    ctx.clip();

    if (this.imageElement) {
      this.renderFilmstrip(ctx);
    }

    this.renderOverlay(ctx);
    ctx.restore();

    if (this.isActive) {
      this.renderSelection(ctx);
    }
  }

  private renderFilmstrip(ctx: CanvasRenderingContext2D) {
    if (!this.imageElement) return;
    const h = this.height;
    const aspect = this.imageElement.width / this.imageElement.height;
    const thumbW = h * aspect;
    const tiles = Math.ceil(this.width / thumbW);

    for (let i = 0; i < tiles; i++) {
      ctx.drawImage(this.imageElement, i * thumbW, 0, thumbW, h);
    }
  }

  private renderOverlay(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, this.width, 20);

    ctx.font = '600 11px system-ui';
    ctx.fillStyle = 'white';
    ctx.fillText(this.label, 8, 14);
  }

  private renderSelection(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      5
    );
    ctx.stroke();
    ctx.restore();
  }
}
