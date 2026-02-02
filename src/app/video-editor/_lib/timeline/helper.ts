import { Group, Rect, classRegistry, GroupProps } from 'fabric';

export interface HelperProps extends Partial<GroupProps> {
  id: string;
  kind: 'top' | 'center' | 'bottom';
  index: number;
}

interface HelperSize {
  top: number;
  guide: number;
  bottom: number;
}

const sizes: Record<string, HelperSize> = {
  top: {
    top: 35,
    guide: 2,
    bottom: 3,
  },
  center: {
    top: 9,
    guide: 2,
    bottom: 9,
  },
  bottom: {
    top: 3,
    guide: 2,
    bottom: 35,
  },
};

const getSizes = (kind: string, height: number) => {
  const size = sizes[kind];
  if (!size) return { top: 0, guide: 2, bottom: 0 };

  if (kind === 'top') {
    return {
      top: height - (size.guide + size.bottom),
      guide: size.guide,
      bottom: size.bottom,
    };
  }
  if (kind === 'center') {
    return {
      top: size.top,
      guide: size.guide,
      bottom: size.bottom,
    };
  }
  return {
    top: size.top,
    guide: size.guide,
    bottom: height - (size.guide + size.top),
  };
};

export class Helper extends Group {
  static type = 'Helper';
  public id: string;
  public guide: Rect;
  public kind: string;
  public index: number;
  public activeGuideFill: string = 'rgba(255, 255, 255, 0.8)'; // White

  constructor(props: HelperProps) {
    const height = props.height || 8;
    const width = props.width || 2000;
    const size = getSizes(props.kind, height);

    const topRect = new Rect({
      top: 0,
      left: 0,
      strokeWidth: 0,
      fill: 'transparent',
      selectable: false,
      evented: false,
      height: size.top,
      width: width,
    });

    const guideRect = new Rect({
      top: size.top,
      left: 0,
      strokeWidth: 0,
      fill: 'transparent',
      selectable: false,
      evented: false,
      height: size.guide,
      width: width,
    });

    const bottomRect = new Rect({
      top: size.top + size.guide,
      left: 0,
      strokeWidth: 0,
      fill: 'transparent',
      selectable: false,
      evented: false,
      height: size.bottom,
      width: width,
    });

    super([topRect, guideRect, bottomRect], {
      ...props,
      selectable: false,
      evented: false,
    });

    this.type = 'Helper';
    this.guide = guideRect;
    this.id = props.id;
    this.kind = props.kind;
    this.index = props.index;
  }

  public setSelected(selected: boolean) {
    if (selected) {
      this.guide.set('fill', this.activeGuideFill);
    } else {
      this.guide.set('fill', 'transparent');
    }
  }
}

classRegistry.setClass(Helper, 'Helper');
