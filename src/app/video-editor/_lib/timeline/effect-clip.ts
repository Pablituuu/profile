import { Control, Rect, type TClassProperties, classRegistry } from 'fabric';
import { TIMELINE_CONSTANTS } from './controls/constants';
import { createResizeControls } from './controls';

export interface EffectClipTimelineOptions
  extends Partial<TClassProperties<Rect>> {
  id: string;
  name?: string;
  effectType: string;
  display: {
    from: number;
    to: number;
  };
  duration: number;
  trackIndex?: number;
  zoom?: number;
}

const EFFECT_ICON_PATH =
  'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.454L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z';

export class EffectClipTimeline extends Rect {
  static type = 'EffectClip';
  public clipId: string = '';
  public label: string = '';
  public effectType: string = '';
  public startUs: number = 0;
  public endUs: number = 0;
  public durationUs: number = 0;
  public trackIndex: number = 0;
  public zoom: number = 1;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  constructor(options: EffectClipTimelineOptions) {
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
      fill: 'rgba(168, 85, 247, 0.4)', // Purple variant for effects
      rx: 4,
      ry: 4,
      stroke: 'rgba(168, 85, 247, 0.8)',
      strokeWidth: 1.5,
      strokeDashArray: [4, 4], // Dashed border for effects
      hasControls: true,
      hasBorders: true,
      objectCaching: false,
    });

    this.clipId = options.id;
    this.type = EffectClipTimeline.type;
    this.label = options.name || options.effectType;
    this.effectType = options.effectType;
    this.startUs = options.display.from;
    this.endUs = options.display.to;
    this.durationUs = options.duration;
    this.trackIndex = options.trackIndex || 0;
    this.zoom = zoom;

    this.controls = EffectClipTimeline.createControls().controls;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderLabel(ctx);
  }

  private renderLabel(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(EFFECT_ICON_PATH);
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Icon
    ctx.save();
    ctx.translate(10, 8);
    ctx.scale(0.6, 0.6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
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

classRegistry.setClass(EffectClipTimeline, 'EffectClip');
