import { Rect, RectProps, classRegistry, FabricObject } from 'fabric';

interface PlaceholderProps
  extends Pick<RectProps, 'width' | 'height' | 'top' | 'left'> {
  id: string;
}

export class Placeholder extends Rect {
  static type = 'Placeholder';
  public id: string;
  public draggedObject?: FabricObject;

  constructor(props: PlaceholderProps) {
    super({
      ...props,
      rx: 6,
      ry: 6,
      objectCaching: false,
      fill: 'rgba(255, 255, 255, 0.1)', // White with low opacity
      stroke: 'rgba(255, 255, 255, 0.8)', // White
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      visible: false,
    });
    this.type = Placeholder.type;
    this.id = props.id;
  }
}

classRegistry.setClass(Placeholder, 'Placeholder');
