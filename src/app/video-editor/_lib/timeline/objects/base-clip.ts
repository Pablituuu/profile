import { Rect, RectProps } from 'fabric';

export interface TimelineClipProps extends Partial<RectProps> {
  clipId: string;
  label: string;
  sourceUrl?: string;
  src?: string;
  // Trim properties
  trim?: { from: number; to: number };
  sourceDuration?: number;
  playbackRate?: number;
  timeScale?: number;
}

export class TimelineClip extends Rect {
  clipId: string;
  label: string;
  sourceUrl?: string;
  src?: string;
  public zoomLevel: number = 1;
  public isActive: boolean = false;
  // Trim/Time properties matching combo logic
  public trim: { from: number; to: number } = { from: 0, to: 0 };
  public sourceDuration: number = 0;
  public playbackRate: number = 1;
  public timeScale: number = 1;

  constructor(options: TimelineClipProps) {
    super(options);
    this.clipId = options.clipId || '';
    this.label = options.label || '';
    this.sourceUrl = options.sourceUrl;
    this.sourceUrl = options.sourceUrl;
    this.src = options.src || options.sourceUrl;
    // content time handling
    if (options.trim) this.trim = options.trim;
    if (options.sourceDuration) this.sourceDuration = options.sourceDuration;
    if (options.playbackRate) this.playbackRate = options.playbackRate;
    if (options.timeScale) this.timeScale = options.timeScale;

    const defaults = {
      rx: 5,
      ry: 5,
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#3b82f6',
      cornerSize: 8,
      selectable: true,
      hasControls: true,
      lockRotation: true,
      lockScalingY: true,
    };

    this.set({ ...defaults, ...options });
  }

  public setSelectionActive(active: boolean) {
    this.isActive = active;
    this.set({ dirty: true });
    this.canvas?.requestRenderAll();
  }
}
