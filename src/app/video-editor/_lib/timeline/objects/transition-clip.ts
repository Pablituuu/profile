import { Path } from 'fabric';
import { TimelineClip, TimelineClipProps } from './base-clip';

const TRANSITION_ICON_SVG =
  'M 16 7 L 11 12 L 16 17 M 11 12 H 30 M 24 28 L 29 23 L 24 18 M 29 23 H 13';

export class TransitionClip extends TimelineClip {
  static type = 'TransitionClip';
  private icon: Path;

  constructor(options: TimelineClipProps) {
    super(options);
    this.set({
      fill: options.fill || '#ffffff',
    });

    this.icon = new Path(TRANSITION_ICON_SVG, {
      stroke: '#000000',
      strokeWidth: 1.5,
      fill: 'transparent',
      originX: 'center',
      originY: 'center',
      scaleX: 0.5,
      scaleY: 0.5,
    });
  }

  public _render(ctx: CanvasRenderingContext2D) {
    const boxSize = 22;
    const r = 4;

    ctx.save();
    // Background handle
    ctx.fillStyle = this.fill as string;
    ctx.beginPath();
    ctx.roundRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize, r);
    ctx.fill();

    // Icon (Fabric internal render)
    this.icon.render(ctx);
    ctx.restore();

    if (this.isActive) {
      this.renderSelection(ctx, boxSize);
    }
  }

  private renderSelection(ctx: CanvasRenderingContext2D, size: number) {
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-size / 2 - 2, -size / 2 - 2, size + 4, size + 4, 6);
    ctx.stroke();
    ctx.restore();
  }
}
