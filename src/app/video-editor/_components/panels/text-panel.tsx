'use client';

import { Type, Captions } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/store/use-editor-store';
import { Text } from '@designcombo/video';
import { useCallback } from 'react';

export function TextPanel() {
  const { studio } = useEditorStore();

  const handleAddText = useCallback(async () => {
    if (!studio) return;
    try {
      const textClip = new Text('Add Text pro', {
        fontSize: 124,
        fontFamily: 'Arial',
        align: 'center',
        fontWeight: 'bold',
        fontStyle: 'normal',
        fill: '#ffffff',
        stroke: undefined,
        dropShadow: undefined,
        wordWrap: true,
        wordWrapWidth: 800,
        fontUrl: undefined,
      });
      await textClip.ready;
      textClip.display.from = 0;
      textClip.duration = 5e6;
      textClip.display.to = 5e6;
      await studio.addClip(textClip);
    } catch (error) {}
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 bg-background text-foreground select-none">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground mb-1">
          Básico
        </h3>

        <Button
          variant="secondary"
          className="w-full h-12 justify-start gap-3 bg-[#3F3F3F] hover:bg-[#4F4F4F] text-white border-none"
          onClick={handleAddText}
        >
          <Type className="h-5 w-5" />
          <span>Agregar texto</span>
        </Button>

        <Button
          variant="secondary"
          className="w-full h-12 justify-start gap-3 bg-[#3F3F3F] hover:bg-[#4F4F4F] text-white border-none"
        >
          <Captions className="h-5 w-5" />
          <span>Agregar captions</span>
        </Button>
      </div>
    </div>
  );
}
