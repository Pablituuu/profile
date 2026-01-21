import { Rect, RectProps, classRegistry } from 'fabric';

export interface HelperProps extends Partial<RectProps> {
  id: string;
  kind?: 'top' | 'center' | 'bottom';
  separatorIndex: number;
}

export class Helper extends Rect {
  static type = 'Helper';
  public id: string;
  public kind: 'top' | 'center' | 'bottom';
  public separatorIndex: number;
  public isHelper = true;

  static ownDefaults = {
    rx: 0,
    ry: 0,
    objectCaching: false,
    strokeWidth: 0,
    fill: 'transparent', // Invisible by default
    selectable: false,
    evented: false, // We might need to manually check for intersection
    visible: true,
  };

  constructor(options: HelperProps) {
    super({ ...Helper.ownDefaults, ...options });
    this.id = options.id;
    this.kind = options.kind || 'center';
    this.separatorIndex = options.separatorIndex;
    (this as any).type = Helper.type;
  }
}

classRegistry.setClass(Helper, Helper.type);
