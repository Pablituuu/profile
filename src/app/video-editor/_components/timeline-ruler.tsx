'use client';

import { useEffect, useRef } from 'react';
import { TIMELINE_CONSTANTS } from '../_lib/timeline/constants';

interface TimelineRulerProps {
  zoomLevel: number;
  duration: number;
  width: number;
}

export function TimelineRuler({
  zoomLevel,
  duration,
  width,
}: TimelineRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${TIMELINE_CONSTANTS.RULER_HEIGHT}px`;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(TIMELINE_CONSTANTS.RULER_HEIGHT * dpr);

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, TIMELINE_CONSTANTS.RULER_HEIGHT);

    const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

    // Background for duration
    const durationX = duration * pixelsPerSecond;
    if (durationX > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(
        0,
        0,
        Math.min(width, durationX),
        TIMELINE_CONSTANTS.RULER_HEIGHT
      );
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const minTextSpacing = 60;
    const intervalOptions = [0.1, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
    let mainInterval = 300;

    for (const opt of intervalOptions) {
      if (opt * pixelsPerSecond >= minTextSpacing) {
        mainInterval = opt;
        break;
      }
    }

    const formatTime = (seconds: number) => {
      if (mainInterval < 1) return seconds.toFixed(1) + 's';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      if (m > 0 && s === 0) return `${m}m`;
      if (m === 0 && s === 0) return '0s';
      return m > 0
        ? `${m}:${s.toString().padStart(2, '0')}`
        : s.toString().padStart(2, '0');
    };

    let subTickCount = 5;
    if (mainInterval === 0.1) subTickCount = 2;
    if (mainInterval === 1) subTickCount = 5;
    if (mainInterval === 60) subTickCount = 4;

    let subInterval = mainInterval / subTickCount;
    if (subInterval * pixelsPerSecond < 6) subInterval = mainInterval;

    const rangeEnd = Math.max(duration, width / pixelsPerSecond);
    const count = Math.ceil(rangeEnd / subInterval) + 1;

    for (let i = 0; i < count; i++) {
      const time = i * subInterval;
      const x = Math.floor(time * pixelsPerSecond) + 0.5;

      if (x > width) break;

      const isMain =
        Math.abs(time % mainInterval) < 0.001 ||
        Math.abs((time % mainInterval) - mainInterval) < 0.001;

      ctx.beginPath();
      if (isMain) {
        ctx.moveTo(x, 15);
        ctx.lineTo(x, TIMELINE_CONSTANTS.RULER_HEIGHT);
        ctx.fillText(formatTime(time), x, 2);
      } else if (subInterval !== mainInterval) {
        ctx.moveTo(x, 20);
        ctx.lineTo(x, TIMELINE_CONSTANTS.RULER_HEIGHT);
      }
      ctx.stroke();
    }
  }, [zoomLevel, duration, width]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ height: `${TIMELINE_CONSTANTS.RULER_HEIGHT}px` }}
    />
  );
}
