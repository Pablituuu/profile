import { Control, Rect, type TClassProperties, classRegistry } from 'fabric';
import { TIMELINE_CONSTANTS } from './controls/constants';
import { createAudioControls } from './controls';

export interface AudioClipTimelineOptions
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

const AUDIO_ICON_PATH =
  'M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25a.75.75 0 00-1.003-.704l-11.452 3.27a.75.75 0 00-.545.721v10.985a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163V6.704';

export class AudioClipTimeline extends Rect {
  static type = 'AudioClip';
  public clipId: string = '';
  public label: string = '';
  public src: string = '';
  public startUs: number = 0;
  public endUs: number = 0;
  public durationUs: number = 0;
  public trackIndex: number = 0;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createAudioControls() };
  }

  constructor(options: AudioClipTimelineOptions) {
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
      fill: '#d97706', // Amber color for audio clips
      rx: 4,
      ry: 4,
      stroke: 'rgba(255, 255, 255, 0.2)',
      strokeWidth: 1,
      hasControls: true,
      hasBorders: true,
    });

    this.clipId = options.id;
    this.type = AudioClipTimeline.type;
    this.label = options.name || 'Audio Clip';
    this.src = options.src;
    this.startUs = options.display.from;
    this.endUs = options.display.from + options.duration;
    this.durationUs = options.duration;
    this.trackIndex = options.trackIndex || 0;

    this.controls = AudioClipTimeline.createControls().controls;
  }

  override _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderLabel(ctx);
  }

  private renderLabel(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(AUDIO_ICON_PATH);
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

classRegistry.setClass(AudioClipTimeline, 'AudioClip');
