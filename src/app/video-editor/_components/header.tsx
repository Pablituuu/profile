'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExportModal } from './export-modal';
import { LanguageSwitcher } from './language-switcher';
import { Undo2, Redo2 } from 'lucide-react';
import { useEditorStore } from '@/store/use-editor-store';

export function Header() {
  const { studio } = useEditorStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!studio) return;

    setCanUndo(studio.history.canUndo());
    setCanRedo(studio.history.canRedo());

    const handleHistoryChange = ({
      canUndo,
      canRedo,
    }: {
      canUndo: boolean;
      canRedo: boolean;
    }) => {
      setCanUndo(canUndo);
      setCanRedo(canRedo);
    };

    studio.on('history:changed', handleHistoryChange);

    return () => {
      studio.off('history:changed', handleHistoryChange);
    };
  }, [studio]);

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between shrink-0 z-50">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Pablituuu Logo"
          width={32}
          height={32}
          className="rounded-md"
        />
        <span className="font-bold text-lg hidden md:block">Pablituuu</span>

        <div className="flex items-center gap-1 ml-4 border-l border-border pl-4">
          <Button
            onClick={() => studio?.undo()}
            disabled={!canUndo}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => studio?.redo()}
            disabled={!canRedo}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button
          size="sm"
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          onClick={() => setIsExportModalOpen(true)}
        >
          Export
        </Button>
      </div>
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </header>
  );
}
