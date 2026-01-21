'use client';

import { useEffect, useRef } from 'react';
import { Player } from './player';
import { Studio, Compositor } from '@designcombo/video';
import { useEditorStore } from '@/store/use-editor-store';

const defaultSize = {
  width: 1080,
  height: 1920,
};

export function PlayerPreview() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<Studio | null>(null);
  const { setStudio, setSelectedClips } = useEditorStore();

  useEffect(() => {
    if (!previewCanvasRef.current) return;

    // Check support
    (async () => {
      // @ts-ignore
      if (!(await Compositor.isSupported())) {
        alert('Your browser does not support WebCodecs');
      }
    })();

    // Initialize Studio
    previewRef.current = new Studio({
      width: defaultSize.width,
      height: defaultSize.height,
      fps: 30,
      bgColor: '#1A1A1A',
      canvas: previewCanvasRef.current,
      interactivity: true,
      spacing: 20,
    });

    const studio = previewRef.current;

    const handleSelection = (data: any) => {
      const clips =
        data?.selected || data?.clips || (Array.isArray(data) ? data : []);
      setSelectedClips(clips);
    };

    const handleClear = () => {
      setSelectedClips([]);
    };

    // Listen to all possible selection events to be safe
    studio.on('selection:created', handleSelection);
    studio.on('selection:updated', handleSelection);
    studio.on('selection:change', handleSelection);
    studio.on('selection:cleared', handleClear);

    const init = async () => {
      await studio.ready;
    };

    init();
    // Set store
    setStudio(studio);

    return () => {
      studio.off('selection:created', handleSelection);
      studio.off('selection:updated', handleSelection);
      studio.off('selection:change', handleSelection);
      studio.off('selection:cleared', handleClear);
      studio.destroy();
      previewRef.current = null;
      setStudio(null);
      setSelectedClips([]);
    };
  }, []); // dependencies are stable

  return (
    <div className="h-full w-full flex flex-col min-h-0 min-w-0 bg-[#1A1A1A]  rounded-sm relative">
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
