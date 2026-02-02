import { Rect, type TClassProperties, classRegistry } from 'fabric';

export interface TrackOptions extends Partial<TClassProperties<Rect>> {
  id: string;
  name: string;
  type: string;
  clipIds: string[];
  index?: number;
}

export class Track extends Rect {
  static type = 'Track';
  public id: string = '';
  public name: string = '';
  public trackType: string = '';
  public clipIds: string[] = [];
  public index: number = 0;

  constructor(options: TrackOptions) {
    // Basic lane styling
    super({
      ...options,
      fill: '#4F4F4F', // Requested color
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      hoverCursor: 'default',
    });

    this.type = 'Track';
    this.id = options.id;
    this.name = options.name;
    this.trackType = options.type;
    this.clipIds = options.clipIds || [];
    this.index = options.index || 0;
  }
}

classRegistry.setClass(Track, 'Track');
