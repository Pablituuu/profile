import { useRef, useEffect } from 'react';
import { TimelineCanvas } from '../../_lib/timeline/canvas';
import { TimelineControl } from './timeline-control';
import { TimelineRuler } from './timeline-ruler';
import { TimelinePlayhead } from './timeline-playhead';
import { useEditorStore } from '@/store/use-editor-store';
import { useStudioListener } from '../../_hooks/use-studio-listener';
import { useTimelineListener } from '../../_hooks/use-timeline-listener';

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setTimeline, zoomLevel, timeline } = useEditorStore();

  useStudioListener();
  useTimelineListener();

  useEffect(() => {
    if (timeline) {
      timeline.setZoom(zoomLevel);
    }
  }, [timeline, zoomLevel]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const instance = new TimelineCanvas(canvasRef.current);
    setTimeline(instance);
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        instance.resize(width, height);
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
      instance.dispose();
      setTimeline(null);
    };
  }, [setTimeline]);

  return (
    <div className="h-[300px] bg-[#0a0a0a] border-t border-white/5 flex flex-col shrink-0 z-40 relative overflow-hidden">
      {/* 1. Control Area (Top) */}
      <TimelineControl />

      <div
        id="timeline-container"
        className="flex-1 flex flex-col relative overflow-hidden"
      >
        <TimelineRuler />
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          <canvas ref={canvasRef} id="timeline-canvas" />
        </div>
        <TimelinePlayhead />
      </div>
    </div>
  );
}
