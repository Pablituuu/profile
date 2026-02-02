import { Control, Rect, type TClassProperties, classRegistry } from 'fabric';
import { TIMELINE_CONSTANTS } from './controls/constants';
import { createTrimControls } from './controls';

export interface VideoClipTimelineOptions
  extends Partial<TClassProperties<Rect>> {
  id: string;
  name?: string;
  src: string;
  display: {
    from: number;
    to: number;
  };
  trim: {
    from: number;
    to: number;
  };
  duration: number;
  trackIndex?: number;
  zoom?: number;
}

const VIDEO_ICON_PATH =
  'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z';

export class VideoClipTimeline extends Rect {
  static type = 'VideoClip';
  public clipId: string = '';
  public label: string = '';
  public src: string = '';
  public startUs: number = 0;
  public endUs: number = 0;
  public durationUs: number = 0;
  public trimFromUs: number = 0;
  public trimToUs: number = 0;
  public trim: { from: number; to: number } = { from: 0, to: 0 };
  public trackIndex: number = 0;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTrimControls() };
  }

  constructor(options: VideoClipTimelineOptions) {
    const zoom = options.zoom || 1;
    const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoom;
    const startSec = options.display.from / 1_000_000;
    const durationSec = options.duration / 1_000_000;
    const trackStep =
      TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;

    super({
      ...options,
      left: (options.display.from * pixelsPerSec) / 1_000_000,
      top:
        options.top ??
        TIMELINE_CONSTANTS.INITIAL_Y_OFFSET +
          (options.trackIndex || 0) * trackStep,
      width: (options.duration * pixelsPerSec) / 1_000_000,
      height: TIMELINE_CONSTANTS.CLIP_HEIGHT,
      fill: '#1e40af', // Deep blue color for video clips
      rx: 4,
      ry: 4,
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 1,
      hasControls: true,
      hasBorders: true,
    });

    this.clipId = options.id;
    this.type = VideoClipTimeline.type;
    this.label = options.name || 'Video Clip';
    this.src = options.src;
    this.startUs = options.display.from;
    this.endUs = options.display.to;
    this.durationUs = options.duration;
    this.trimFromUs = options.trim.from;
    this.trimToUs = options.trim.to;
    this.trim = { ...options.trim };
    this.trackIndex = options.trackIndex || 0;

    this.controls = VideoClipTimeline.createControls().controls;
  }

  onResize() {
    this.trimFromUs = this.trim.from;
    this.trimToUs = this.trim.to;
    this.startUs = Math.round(
      (this.left /
        (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * (this as any).zoom)) *
        1_000_000
    );
    this.durationUs = Math.round(
      ((this.width * Math.abs(this.scaleX)) /
        (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * (this as any).zoom)) *
        1_000_000
    );
    this.endUs = this.startUs + this.durationUs;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderLabel(ctx);
  }

  private renderLabel(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(VIDEO_ICON_PATH);
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Icon
    ctx.save();
    ctx.translate(10, 8);
    ctx.scale(0.6, 0.6); // Scale icon to fit
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill(icon);
    ctx.restore();

    // Text label
    ctx.font = '500 11px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const labelText =
      this.label.length > 20 ? this.label.substring(0, 17) + '...' : this.label;
    ctx.fillText(labelText, 34, this.height / 2);

    ctx.restore();
  }
}

classRegistry.setClass(VideoClipTimeline, 'VideoClip');
