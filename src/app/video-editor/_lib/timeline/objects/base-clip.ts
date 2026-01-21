import { Rect, RectProps } from 'fabric';

export interface TimelineClipProps extends Partial<RectProps> {
  clipId: string;
  label: string;
  sourceUrl?: string;
}

export class TimelineClip extends Rect {
  clipId: string;
  label: string;
  sourceUrl?: string;
  public zoomLevel: number = 1;
  public isActive: boolean = false;

  constructor(options: TimelineClipProps) {
    super(options);
    this.clipId = options.clipId || '';
    this.label = options.label || '';
    this.sourceUrl = options.sourceUrl;

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
