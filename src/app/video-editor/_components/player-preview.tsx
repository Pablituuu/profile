'use client';

import { useEffect, useRef } from 'react';
import { Player } from './player';
import { Studio, Compositor, fontManager } from 'openvideo';
import { useEditorStore } from '@/store/use-editor-store';

// Canvas configuration constants
const DEFAULT_CANVAS_SIZE = {
  width: 1080,
  height: 1920,
} as const;

const STUDIO_CONFIG = {
  fps: 30,
  bgColor: '#1A1A1A',
  interactivity: true,
  spacing: 20,
} as const;

export function PlayerPreview() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<Studio | null>(null);
  const { setStudio, setSelectedClips, timeline } = useEditorStore();

  useEffect(() => {
    if (!previewCanvasRef.current) return;

    (async () => {
      // @ts-ignore
      if (!(await Compositor.isSupported())) {
        alert('Your browser does not support WebCodecs');
      }
    })();

    // Create studio instance
    const studioInstance = new Studio({
      ...DEFAULT_CANVAS_SIZE,
      ...STUDIO_CONFIG,
      canvas: previewCanvasRef.current,
    });

    studioRef.current = studioInstance;
    setStudio(studioInstance);

    // Initialize fonts and notify when ready
    const initializeStudio = async () => {
      try {
        await Promise.all([
          // fontManager.loadFonts([]), // Add specific fonts if needed
          studioInstance.ready,
        ]);
      } catch (error) {
        console.error('Failed to initialize studio:', error);
      }
    };

    initializeStudio();

    // Setup ResizeObserver for responsive layout
    const canvas = previewCanvasRef.current;
    const parentElement = canvas.parentElement;
    let resizeObserver: ResizeObserver | null = null;

    if (parentElement) {
      resizeObserver = new ResizeObserver(() => {
        if (
          studioRef.current &&
          (studioRef.current as any).updateArtboardLayout
        ) {
          (studioRef.current as any).updateArtboardLayout();
        }
      });
      resizeObserver.observe(parentElement);
    }

    return () => {
      if (resizeObserver && parentElement) {
        resizeObserver.unobserve(parentElement);
        resizeObserver.disconnect();
      }
      studioInstance.destroy();
      studioRef.current = null;
      setStudio(null);
    };
  }, []);

  useEffect(() => {
    const studio = studioRef.current;
    if (!studio) return;

    const handleSelection = (data: any) => {
      const clips =
        data?.selected || data?.clips || (Array.isArray(data) ? data : []);
      setSelectedClips(clips);
      const clipIds = clips.map((clip: any) => clip.id);
      timeline?.selectedClips(clipIds);
    };

    const handleClear = () => {
      setSelectedClips([]);
      timeline?.selectedClips([]);
    };

    studio.on('selection:created', handleSelection);
    studio.on('selection:updated', handleSelection);
    studio.on('selection:change', handleSelection);
    studio.on('selection:cleared', handleClear);

    return () => {
      studio.off('selection:created', handleSelection);
      studio.off('selection:updated', handleSelection);
      studio.off('selection:change', handleSelection);
      studio.off('selection:cleared', handleClear);
    };
  }, [timeline, setSelectedClips]);

  return (
    <div className="h-full w-full flex flex-col min-h-0 min-w-0 bg-[#1A1A1A] rounded-sm relative">
      {/* Player Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <Player canvasRef={previewCanvasRef} />
      </div>
    </div>
  );
}
