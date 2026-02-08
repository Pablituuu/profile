import { Rect, type TClassProperties, classRegistry } from 'fabric';
import { TIMELINE_CONSTANTS } from './controls/constants';

export interface CaptionClipTimelineOptions
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

// Icon for subtitles (Closed Captions style)
const CAPTION_ICON_PATH = 'M18 7H6v10h12V7zm-2 8H8v-2h8v2zm0-4H8V9h8v2z';

export class CaptionClipTimeline extends Rect {
  static type = 'CaptionClip';
  public clipId: string = '';
  public label: string = '';
  public startUs: number = 0;
  public endUs: number = 0;
  public durationUs: number = 0;
  public trackIndex: number = 0;
  public zoom: number = 1;

  constructor(options: CaptionClipTimelineOptions) {
    const zoom = options.zoom || 1;
    const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoom;
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
      fill: '#f59e0b', // Amber/Yellow color for captions
      rx: 4,
      ry: 4,
      stroke: '#ffffff',
      strokeWidth: 1,
      hasControls: false,
      hasBorders: false,
      objectCaching: false,
    });

    this.clipId = options.id;
    this.type = CaptionClipTimeline.type;
    this.label = options.text;
    this.startUs = options.display.from;
    this.endUs = options.display.to;
    this.durationUs = options.duration;
    this.trackIndex = options.trackIndex || 0;
    this.zoom = zoom;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderLabel(ctx);
  }

  private renderLabel(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(CAPTION_ICON_PATH);
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Icon
    ctx.save();
    ctx.translate(10, 8);
    ctx.scale(0.8, 0.8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill(icon);
    ctx.restore();

    // Text label
    ctx.font = '600 11px Inter, system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const padding = 34; // Icon (10+8*2) + space
    const availableWidth = this.width - padding - 10; // Extra 10px margin at end

    if (availableWidth > 10) {
      let displayLabel = this.label;
      let textWidth = ctx.measureText(displayLabel).width;

      if (textWidth > availableWidth) {
        while (textWidth > availableWidth && displayLabel.length > 0) {
          displayLabel = displayLabel.slice(0, -1);
          textWidth = ctx.measureText(displayLabel + '...').width;
        }
        displayLabel += '...';
      }

      ctx.fillText(displayLabel, padding, this.height / 2); // Corrected vertical position
    }

    ctx.restore();
  }
}

classRegistry.setClass(CaptionClipTimeline, 'CaptionClip');
