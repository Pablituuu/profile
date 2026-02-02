import { Control, Rect, type TClassProperties, classRegistry } from 'fabric';
import { TIMELINE_CONSTANTS } from './controls/constants';
import { createResizeControls } from './controls';

export interface TextClipTimelineOptions
  extends Partial<TClassProperties<Rect>> {
  id: string;
  text: string;
  display: {
    from: number;
    to: number;
  };
  duration: number;
  trackIndex?: number;
  zoom?: number;
}

const TEXT_ICON_PATH = 'M5 8V5h10v3M10 5v14m0 0H8m2 0h2'; // Simple "T" icon path

export class TextClipTimeline extends Rect {
  static type = 'TextClip';
  public clipId: string = '';
  public label: string = '';
  public startUs: number = 0;
  public endUs: number = 0;
  public durationUs: number = 0;
  public trackIndex: number = 0;
  public zoom: number = 1;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  constructor(options: TextClipTimelineOptions) {
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
      fill: '#4f46e5', // Indigo color for text clips
      rx: 4,
      ry: 4,
      stroke: '#ffffff', // White border for visibility
      strokeWidth: 1,
      hasControls: true,
      hasBorders: true,
      objectCaching: false,
    });

    this.clipId = options.id;
    this.type = TextClipTimeline.type;
    this.label = options.text;
    this.startUs = options.display.from;
    this.endUs = options.display.to;
    this.durationUs = options.duration;
    this.trackIndex = options.trackIndex || 0;
    this.zoom = zoom;

    this.controls = TextClipTimeline.createControls().controls;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderLabel(ctx);
  }

  private renderLabel(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(TEXT_ICON_PATH);
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Icon
    ctx.save();
    ctx.translate(10, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill(icon);
    ctx.restore();

    // Text label
    ctx.font = '500 12px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, 32, this.height / 2);

    ctx.restore();
  }
}

classRegistry.setClass(TextClipTimeline, 'TextClip');
