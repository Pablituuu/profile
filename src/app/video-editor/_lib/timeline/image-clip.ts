import { Control, Rect, type TClassProperties, classRegistry } from 'fabric';
import { TIMELINE_CONSTANTS } from './controls/constants';
import { createResizeControls } from './controls';

export interface ImageClipTimelineOptions
  extends Partial<TClassProperties<Rect>> {
  id: string;
  name?: string;
  src: string;
  display: {
    from: number;
    to: number;
  };
  duration: number;
  trackIndex?: number;
  zoom?: number;
}

const IMAGE_ICON_PATH =
  'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z';

export class ImageClipTimeline extends Rect {
  static type = 'ImageClip';
  public clipId: string = '';
  public label: string = '';
  public src: string = '';
  public startUs: number = 0;
  public endUs: number = 0;
  public durationUs: number = 0;
  public trackIndex: number = 0;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  constructor(options: ImageClipTimelineOptions) {
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
      fill: '#059669', // Emerald color for image clips
      rx: 4,
      ry: 4,
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 1,
      hasControls: true,
      hasBorders: true,
    });

    this.clipId = options.id;
    this.type = ImageClipTimeline.type;
    this.label = options.name || 'Image Clip';
    this.src = options.src;
    this.startUs = options.display.from;
    this.endUs = options.display.from + options.duration;
    this.durationUs = options.duration;
    this.trackIndex = options.trackIndex || 0;

    this.controls = ImageClipTimeline.createControls().controls;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderLabel(ctx);
  }

  private renderLabel(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(IMAGE_ICON_PATH);
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

classRegistry.setClass(ImageClipTimeline, 'ImageClip');
