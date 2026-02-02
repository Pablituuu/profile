'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { useEditorStore } from '@/store/use-editor-store';
import { formatTimelineUnit } from '../../_lib/timeline/utils/format';
import { TIMELINE_CONSTANTS } from '../../_lib/timeline/controls/constants';

interface TimelineRulerProps {
  height?: number;
  longLineSize?: number;
  shortLineSize?: number;
  textOffsetY?: number;
}

export function TimelineRuler({
  height = 35,
  longLineSize = 10,
  shortLineSize = 6,
  textOffsetY = 12,
}: TimelineRulerProps) {
  const { timeline, zoomLevel, studio } = useEditorStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [width, setWidth] = useState(0);
  const isDraggingRef = useRef(false);

  // Seek function
  const handleSeek = useCallback(
    (clientX: number) => {
      if (!studio || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const actualPixelsPerSecond =
        TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

      const timeSec = (x + scrollLeft) / actualPixelsPerSecond;
      const timeUs = Math.max(0, Math.round(timeSec * 1_000_000));

      studio.seek(timeUs);
    },
    [studio, zoomLevel, scrollLeft]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleSeek(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        handleSeek(moveEvent.clientX);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Sync scroll from timeline canvas
  useEffect(() => {
    if (!timeline) return;

    const handleViewportChange = (left: number) => {
      setScrollLeft(left);
    };

    timeline.scrollbars.addViewportChangeListener(handleViewportChange);

    return () => {
      timeline.scrollbars.removeViewportChangeListener(handleViewportChange);
    };
  }, [timeline]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND;
    // We use zoomLevel from store to adjust scale
    const actualPixelsPerSecond = pixelsPerSecond * zoomLevel;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    ctx.strokeStyle = '#4b5563'; // Gray-600
    ctx.fillStyle = '#9ca3af'; // Gray-400
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';

    const startSecond = Math.floor(scrollLeft / actualPixelsPerSecond);
    const endSecond = Math.ceil((scrollLeft + width) / actualPixelsPerSecond);

    for (let sec = startSecond; sec <= endSecond; sec++) {
      if (sec < 0) continue;

      const x = sec * actualPixelsPerSecond - scrollLeft;

      // Draw time text every 5 seconds or if it's the first one
      if (sec % 5 === 0) {
        const text = formatTimelineUnit(sec);
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, x - textWidth / 2, textOffsetY);
      }

      // Draw lines
      const isLong = sec % 1 === 0; // In this basic version, every second is long
      const lineSize = isLong ? longLineSize : shortLineSize;
      const yOrigin = height - lineSize;

      ctx.beginPath();
      ctx.moveTo(x, yOrigin);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Sub-second markers (if zoom is high enough)
      if (zoomLevel > 0.5) {
        const subSteps = 5;
        for (let i = 1; i < subSteps; i++) {
          const subX = x + (i / subSteps) * actualPixelsPerSecond;
          if (subX > width) break;
          ctx.beginPath();
          ctx.moveTo(subX, height - shortLineSize);
          ctx.lineTo(subX, height);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [
    scrollLeft,
    width,
    zoomLevel,
    height,
    longLineSize,
    shortLineSize,
    textOffsetY,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const updateWidth = () => {
      if (canvasRef.current?.parentElement) {
        setWidth(canvasRef.current.parentElement.clientWidth);
      }
    };

    updateWidth();
    const debouncedResize = debounce(updateWidth, 100);
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  return (
    <div
      className="w-full h-[35px] bg-[#0a0a0a] border-b border-white/5 relative cursor-pointer"
      onMouseDown={onMouseDown}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  );
}
