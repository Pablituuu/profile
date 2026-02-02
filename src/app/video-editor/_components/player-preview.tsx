'use client';

import { useEffect, useRef } from 'react';
import { Player } from './player';
import { Studio, Compositor, Text } from '@designcombo/video';
import { useEditorStore } from '@/store/use-editor-store';

const defaultSize = {
  width: 1080,
  height: 1920,
};

export function PlayerPreview() {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<Studio | null>(null);
  const { setStudio, setSelectedClips, timeline, studio } = useEditorStore();

  useEffect(() => {
    if (!previewCanvasRef.current) return;

    (async () => {
      // @ts-ignore
      if (!(await Compositor.isSupported())) {
        alert('Your browser does not support WebCodecs');
      }
    })();

    const studioInstance = new Studio({
      width: defaultSize.width,
      height: defaultSize.height,
      fps: 30,
      bgColor: '#1A1A1A',
      canvas: previewCanvasRef.current,
      interactivity: true,
      spacing: 20,
    });

    previewRef.current = studioInstance;
    setStudio(studioInstance);

    const init = async () => {
      await studioInstance.ready;
    };
    init();

    return () => {
      studioInstance.destroy();
      previewRef.current = null;
      setStudio(null);
    };
  }, []);

  useEffect(() => {
    const studio = previewRef.current;
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
  }, [studio, timeline, setSelectedClips]);

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
