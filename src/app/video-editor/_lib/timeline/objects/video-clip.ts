import { Control } from 'fabric';
import { TimelineClip, TimelineClipProps } from './base-clip';
import { createTrimControls } from '../controls';

import { editorFont } from './objects-constants';

export class VideoClip extends TimelineClip {
  static type = 'VideoClip';
  public isSelected: boolean = false;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTrimControls() };
  }

  constructor(options: TimelineClipProps) {
    super(options);
    this.set({
      fill: options.fill || '#4338ca', // Indigo-700
    });
    this.initialize();
  }

  public async initialize() {
    if (this.src) {
      const video = document.createElement('video');
      video.src = this.src;
      video.crossOrigin = 'anonymous';
      video.onloadedmetadata = () => {
        this.sourceDuration = video.duration * 1_000_000;
        this.set({ dirty: true });
      };
    }
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawIdentity(ctx);
    this.updateSelected(ctx);
  }

  public drawIdentity(ctx: CanvasRenderingContext2D) {
    const text = this.label || 'Video';
    ctx.save();
    ctx.font = `400 12px ${editorFont.fontFamily}`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Simple icon placeholder (e.g. "Video")
    const padding = 8;
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.fillText('🎥 ' + text, padding, 12);
    ctx.restore();
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected
      ? '#a5b4fc'
      : 'rgba(255, 255, 255, 0.1)';
    const borderWidth = 2;
    const radius = 5;

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
