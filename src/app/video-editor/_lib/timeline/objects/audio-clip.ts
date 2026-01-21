import { TimelineClip, TimelineClipProps } from './base-clip';

const AUDIO_ICON_PATH =
  'M13.9326 0C14.264 0 14.5332 0.268239 14.5332 0.599609V11.4326L14.5293 11.5869C14.4912 12.353 14.17 13.08 13.625 13.625C13.0436 14.2064 12.2548 14.5332 11.4326 14.5332C10.6106 14.5331 9.82248 14.2062 9.24121 13.625C8.65985 13.0436 8.33301 12.2548 8.33301 11.4326C8.33309 10.6106 8.65992 9.8225 9.24121 9.24121C9.8225 8.65992 10.6106 8.33309 11.4326 8.33301C12.125 8.33301 12.792 8.56695 13.333 8.9873V4.5332H6.19922V11.4326C6.19922 12.2547 5.87325 13.0437 5.29199 13.625C4.71063 14.2064 3.92178 14.5332 3.09961 14.5332C2.27744 14.5332 1.48859 14.2064 0.907227 13.625C0.325965 13.0437 0 12.2547 0 11.4326C8.61069e-05 10.6107 0.326144 9.82247 0.907227 9.24121C1.48859 8.65985 2.27744 8.33301 3.09961 8.33301C3.79208 8.33301 4.45894 8.56685 5 8.9873V0.599609C5 0.268239 5.26824 0 5.59961 0H13.9326ZM3.09961 9.5332C2.5957 9.5332 2.11218 9.73352 1.75586 10.0898C1.39982 10.4461 1.1993 10.929 1.19922 11.4326C1.19922 11.9365 1.39964 12.4201 1.75586 12.7764C2.11218 13.1327 2.5957 13.333 3.09961 13.333C3.60352 13.333 4.08704 13.1327 4.44336 12.7764C4.79958 12.4201 5 11.9365 5 11.4326C4.99991 10.929 4.7994 10.4461 4.44336 10.0898C4.08704 9.73352 3.60352 9.5332 3.09961 9.5332ZM11.4326 9.5332C10.9288 9.53329 10.4461 9.7336 10.0898 10.0898C9.7336 10.4461 9.53329 10.9288 9.5332 11.4326C9.5332 11.9365 9.73352 12.42 10.0898 12.7764C10.4461 13.1325 10.9289 13.3329 11.4326 13.333C11.9365 13.333 12.42 13.1327 12.7764 12.7764C13.1327 12.42 13.333 11.9365 13.333 11.4326C13.3329 10.9289 13.1325 10.4461 12.7764 10.0898C12.42 9.73352 11.9365 9.5332 11.4326 9.5332ZM6.19922 3.33301H13.333V1.19922H6.19922V3.33301Z';

export class AudioClip extends TimelineClip {
  static type = 'AudioClip';

  constructor(options: TimelineClipProps) {
    super(options);
    this.set({
      fill: options.fill || '#1e3a8a', // Blue-900
    });
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.renderInfo(ctx);
    this.renderSelection(ctx);
  }

  private renderInfo(ctx: CanvasRenderingContext2D) {
    const icon = new Path2D(AUDIO_ICON_PATH);
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Icon
    ctx.save();
    ctx.translate(10, 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill(icon);
    ctx.restore();

    // Text Label (Filename)
    ctx.font = '400 11px system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(this.label || 'Audio', 32, 18);

    ctx.restore();
  }

  private renderSelection(ctx: CanvasRenderingContext2D) {
    if (!this.isActive) return;
    ctx.save();
    ctx.strokeStyle = '#60a5fa'; // Blue-400
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      5
    );
    ctx.stroke();
    ctx.restore();
  }
}
