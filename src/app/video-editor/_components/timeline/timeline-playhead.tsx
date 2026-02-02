'use client';

import { useEditorStore } from '@/store/use-editor-store';
import { TIMELINE_CONSTANTS } from '../../_lib/timeline/controls/constants';
import { MouseEvent, TouchEvent, useEffect, useState } from 'react';

export function TimelinePlayhead() {
  const { currentTime, zoomLevel, studio, timeline } = useEditorStore();
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (!timeline) return;
    const handleScroll = (left: number) => setScrollLeft(left);
    timeline.scrollbars.addViewportChangeListener(handleScroll);
    return () => timeline.scrollbars.removeViewportChangeListener(handleScroll);
  }, [timeline]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);

  const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND;
  const actualPixelsPerSecond = pixelsPerSecond * zoomLevel;

  // Position in pixels relative to the START of the timeline
  const playheadX = currentTime * actualPixelsPerSecond;

  // Position relative to the visible viewport
  const position = playheadX - scrollLeft;

  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX =
      'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    setDragStartX(clientX);
    setDragStartPosition(currentTime);
  };

  useEffect(() => {
    if (!isDragging || !studio) return;

    const handleMouseMove = (
      e: globalThis.MouseEvent | globalThis.TouchEvent
    ) => {
      const clientX =
        'touches' in e
          ? e.touches[0].clientX
          : (e as globalThis.MouseEvent).clientX;

      // We need to account for the container's left offset
      const container = document.getElementById('timeline-container');
      const rect = container?.getBoundingClientRect() || { left: 0 };

      const localX = clientX - rect.left + scrollLeft;
      const newTime = localX / actualPixelsPerSecond;

      const clampedTime = Math.max(0, newTime);

      // Seek the studio
      studio.seek(Math.round(clampedTime * 1_000_000));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [
    isDragging,
    dragStartX,
    dragStartPosition,
    actualPixelsPerSecond,
    studio,
  ]);

  // Only show if it's within the visible area (with some padding)
  const isVisible = position >= -10;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position}px`,
        top: 0,
        width: '1px',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // White line
        zIndex: 50,
        pointerEvents: 'none',
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      {/* Draggable Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '12px',
          height: '14px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // White with high opacity
          cursor: 'col-resize',
          pointerEvents: 'auto',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)',
          borderRadius: '2px 2px 0 0',
        }}
      />
    </div>
  );
}
