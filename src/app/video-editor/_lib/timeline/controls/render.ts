import { Canvas, Control, FabricObject, util } from 'fabric';

export function drawVerticalLine(
  this: Control,
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  styleOverride: any,
  fabricObject: FabricObject
) {
  const canvas = fabricObject.canvas as Canvas;
  if (!canvas) return;

  // Adopting the direct translation logic the user noted as working
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(util.degreesToRadians(fabricObject.angle));

  // Style: Restore the original subtle white vertical line
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineCap = 'round';

  // Vertical line 12px height
  const height = 12;
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(0, height / 2);
  ctx.stroke();

  ctx.restore();
}
