import { Rect, type TClassProperties, classRegistry, Shadow } from 'fabric';

export interface TransitionClipTimelineOptions
  extends Partial<TClassProperties<Rect>> {
  id?: string;
  clipId?: string;
  clipIdFrom: string;
  clipIdTo: string;
}

export class TransitionClipTimeline extends Rect {
  static type = 'TransitionClip';

  public id?: string;
  public clipId: string = '';
  public clipIdFrom: string = '';
  public clipIdTo: string = '';
  public transitionType: string = '';

  constructor(options: TransitionClipTimelineOptions) {
    super({
      ...options,
      fill: '#fbbf24', // Amber color for visibility
      width: 24,
      height: 20,
      rx: 8, // Más redondeado
      ry: 8,
      stroke: '#d97706',
      strokeWidth: 1.5,
      shadow: new Shadow({
        color: 'rgba(0,0,0,0.2)',
        blur: 4,
        offsetX: 0,
        offsetY: 2,
      }),
      hasControls: false,
      hasBorders: false,
      selectable: false,
      hoverCursor: 'pointer',
    });

    this.id = options.id;
    this.clipId = options.clipId || '';
    this.clipIdFrom = options.clipIdFrom;
    this.clipIdTo = options.clipIdTo;
  }

  /**
   * Sobreescribimos el renderizado para dibujar el logo personalizado
   */
  _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);

    ctx.save();
    // Fabric centra el contexto en (0,0).
    // El path SVG tiene su caja delimitadora de 3 a 21 (centro 12)
    // y de 4 a 20 aproximadamente (centro 12).
    const scale = 0.75;
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Centrado quirúrgico del path

    const path = new Path2D(
      'M3 5.30359C3 3.93159 4.659 3.24359 5.629 4.21359L11.997 10.5826L10.583 11.9966L5 6.41359V17.5856L10.586 11.9996L10.583 11.9966L11.997 10.5826L12 10.5856L18.371 4.21459C19.341 3.24459 21 3.93159 21 5.30359V18.6956C21 20.0676 19.341 20.7556 18.371 19.7856L12 13.5L13.414 11.9996L19 17.5866V6.41359L13.414 11.9996L13.421 12.0056L12.006 13.4206L12 13.4136L5.629 19.7846C4.659 20.7546 3 18.6956V5.30359Z'
    );

    ctx.fillStyle = 'black';
    ctx.fill(path);
    ctx.restore();
  }
}

classRegistry.setClass(TransitionClipTimeline, 'TransitionClip');
