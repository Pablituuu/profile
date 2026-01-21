import { Rect, RectProps, classRegistry } from 'fabric';

export interface PlaceholderProps extends Partial<RectProps> {
  clipId: string;
}

export class Placeholder extends Rect {
  static type = 'Placeholder';
  public clipId: string;

  static ownDefaults = {
    rx: 6,
    ry: 6,
    objectCaching: false,
    borderColor: 'transparent',
    strokeWidth: 2,
    fill: 'rgba(255, 211, 42, 0.1)',
    stroke: 'rgba(255, 211, 42, 1.0)',
    selectable: false,
    evented: false,
    strokeDashArray: [5, 5],
    visible: false,
  };

  constructor(options: PlaceholderProps) {
    super({ ...Placeholder.ownDefaults, ...options });
    this.clipId = options.clipId || '';
    (this as any).type = Placeholder.type;
  }

  // Use default _render, but we could add custom logic here if needed
}

classRegistry.setClass(Placeholder, Placeholder.type);
