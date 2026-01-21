import { Control } from 'fabric';
import { createResizeControls } from '../controls';
import { TimelineClip, TimelineClipProps } from './base-clip';

import { editorFont } from './objects-constants';

export class ImageClip extends TimelineClip {
  static type = 'ImageClip';
  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }
  private image: HTMLImageElement | null = null;
  private isInitializing = false;
  public isSelected: boolean = false;

  constructor(options: TimelineClipProps) {
    super(options);
    this.set({
      fill: options.fill || '#164e63', // Cyan-900
    });
    // Ensure src is synced if sourceUrl is provided
    if (!this.src && options.sourceUrl) {
      this.src = options.sourceUrl;
    }
    this.initialize();
  }

  public async initialize(): Promise<void> {
    if (!this.src || this.image || this.isInitializing) return;
    this.isInitializing = true;
    try {
      const img = new Image();
      img.src = this.src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      this.image = img;
      this.set({ dirty: true });
      if (this.canvas) this.canvas.requestRenderAll();
    } catch (error) {
      console.error('Failed to load image:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  private renderPreview(ctx: CanvasRenderingContext2D) {
    if (!this.image || !this.canvas) return;
    const img = this.image;
    const width = this.width || 0;
    const height = this.height || 0;

    // Scale image to fit height
    const scale = height / img.height;
    const scaledWidth = img.width * scale;

    // Get viewport boundaries in "infinite" coordinate space
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;
    const worldVisibleStart = -vpt[4] / vpt[0];
    const worldVisibleEnd = (this.canvas.width - vpt[4]) / vpt[0];

    ctx.save();
    // Translate to top-left to work with 0..width
    ctx.translate(-width / 2, -height / 2);

    // Clip to the Rect bounds
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.clip();

    // Draw repeating images only if visible
    let currentX = 0;
    while (currentX < width) {
      const thumbWorldStart = this.left + currentX;
      const thumbWorldEnd = thumbWorldStart + scaledWidth;

      // Visibility check
      const isVisible =
        thumbWorldEnd > worldVisibleStart && thumbWorldStart < worldVisibleEnd;

      if (isVisible) {
        ctx.drawImage(img, currentX, 0, scaledWidth, height);
      }
      currentX += scaledWidth;
    }
    ctx.restore();
  }

  public drawTextIdentity(ctx: CanvasRenderingContext2D) {
    const text = this.label || 'Image';
    ctx.save();
    ctx.font = `400 12px ${editorFont.fontFamily}`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const padding = 8;
    // Align similar to AudioClip: ~top-left relative to untransformed coord
    // But RenderPreview has reset context.
    // Rect draws at 0,0 (center).
    // Text should be relative to center.
    // Top-left is -width/2, -height/2.
    // Padding 8 -> -width/2 + 8.
    // Vertical: Top + something. -height/2 + 10 ?
    // Snippet had 1, but snippet translation context might have been different.
    // Let's assume snippet was correct for its context.
    // If I look at renderPreview, it does ctx.translate(-width / 2, -height / 2); then restores.
    // So context is back at center.
    // ctx.fillText(..., -this.width / 2 + padding, 1). 1 is near center vertically.
    // If height is small (tracks are usually small), center is fine.
    ctx.fillText('🖼 ' + text, -this.width / 2 + padding, 1);
    ctx.restore();
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx); // Background (Rect)
    this.renderPreview(ctx);
    this.drawTextIdentity(ctx);
    this.updateSelected(ctx);
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected
      ? 'rgba(255, 255, 255,1.0)'
      : 'rgba(255, 255, 255,0.05)';
    const borderWidth = 1;
    const radius = 6;

    ctx.save();
    ctx.fillStyle = borderColor;

    // Create a path for the outer rectangle
    ctx.beginPath();
    ctx.roundRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      radius
    );

    // Create a path for the inner rectangle (the hole)
    ctx.roundRect(
      -this.width / 2 + borderWidth,
      -this.height / 2 + borderWidth,
      this.width - borderWidth * 2,
      this.height - borderWidth * 2,
      radius - borderWidth
    );

    // Use even-odd fill rule to create the border effect
    ctx.fill('evenodd');
    ctx.restore();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }
}
