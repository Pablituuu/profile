'use client';

import { useRef, useState, useEffect } from 'react';
import { TIMELINE_CONSTANTS } from '../_lib/timeline/constants';
import { useTimelinePlayhead } from '../_hooks/use-timeline-playhead';
import { useEditorStore } from '@/store/use-editor-store';

interface TimelinePlayheadProps {
  duration: number;
  zoomLevel: number;
  seek: (time: number) => void;
  rulerRef: React.RefObject<HTMLDivElement | null>;
  rulerScrollRef: React.RefObject<HTMLDivElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  playheadRef?: React.RefObject<HTMLDivElement | null>;
}

export function TimelinePlayhead({
  duration,
  zoomLevel,
  seek,
  rulerRef,
  rulerScrollRef,
  timelineRef,
  playheadRef: externalPlayheadRef,
}: TimelinePlayheadProps) {
  const currentTime = useEditorStore((state) => state.currentTime);

  const internalPlayheadRef = useRef<HTMLDivElement>(null);
  const playheadRef = externalPlayheadRef || internalPlayheadRef;
  const [scrollLeft, setScrollLeft] = useState(0);

  const { playheadPosition, handlePlayheadMouseDown } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    playheadRef,
  });

  // Track scroll position
  useEffect(() => {
    const scrollViewport = rulerScrollRef.current;
    if (!scrollViewport) return;

    const handleScroll = () => {
      setScrollLeft(scrollViewport.scrollLeft);
    };

    setScrollLeft(scrollViewport.scrollLeft);
    scrollViewport.addEventListener('scroll', handleScroll);
    return () => scrollViewport.removeEventListener('scroll', handleScroll);
  }, [rulerScrollRef]);

  // Use timeline container height
  const timelineContainerHeight = timelineRef.current?.offsetHeight || 300;
  const totalHeight = timelineContainerHeight;

  // Calculate position
  const timelinePosition =
    playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

  // In pablituuu, there's a 48px offset (ID column) usually?
  // Wait, let's check Timeline.tsx L308: <div className="w-12 shrink-0 ...">
  // 12 * 4 = 48px.
  const trackLabelsWidth = 48;

  const rawLeftPosition = trackLabelsWidth + timelinePosition - scrollLeft;

  // Constrain
  const timelineContentWidth =
    duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const viewportWidth = rulerScrollRef.current?.clientWidth || 1000;

  const leftBoundary = trackLabelsWidth;
  const rightBoundary = Math.min(
    trackLabelsWidth + timelineContentWidth - scrollLeft,
    trackLabelsWidth + viewportWidth
  );

  const leftPosition = Math.max(
    leftBoundary,
    Math.min(rightBoundary, rawLeftPosition)
  );

  return (
    <div
      ref={playheadRef}
      className="absolute pointer-events-auto z-100 group cursor-col-resize"
      style={{
        left: `${leftPosition}px`,
        transform: 'translateX(-50%)',
        top: 0,
        height: `${totalHeight}px`,
        width: '20px',
        opacity: duration === 0 ? 0 : 1,
      }}
      onMouseDown={handlePlayheadMouseDown}
    >
      {/* The playhead line */}
      <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-full bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]" />

      {/* Playhead indicator at the top */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 cursor-col-resize bg-white shadow-lg"
        style={{
          top: '0',
          width: '14px',
          height: '18px',
          borderRadius: '2px 2px 1px 1px',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)',
        }}
      />
    </div>
  );
}
