'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExportModal } from './export-modal';
import { LanguageSwitcher } from './language-switcher';
import {
  Undo2,
  Redo2,
  FileJson,
  Upload,
  Download,
  ChevronDown,
} from 'lucide-react';
import { useEditorStore } from '@/store/use-editor-store';
import { useLanguageStore } from '@/store/use-language-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { studio } = useEditorStore();
  const { t } = useLanguageStore();
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

  const handleImportToJSON = () => {
    if (!studio) return;
    try {
      const json = studio.exportToJSON();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pablituuu-project-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export to JSON:', error);
    }
  };

  const handleImportFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (studio) {
            // @ts-ignore
            await studio.loadFromJSON(json);
          }
        } catch (error) {
          console.error('Failed to import JSON:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

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
            title={t('header.undo')}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => studio?.redo()}
            disabled={!canRedo}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={t('header.redo')}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 px-3 text-xs border border-border/50 hover:bg-zinc-800/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileJson className="h-4 w-4" />
              {t('header.json_menu')}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-border bg-background/95 backdrop-blur-xl"
          >
            <DropdownMenuItem
              onClick={handleImportFromJSON}
              className="gap-2 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>{t('header.import_json')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleImportToJSON}
              className="gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-brand-primary" />
              <span>{t('header.export_json')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          className="h-8 bg-brand-primary hover:bg-brand-primary/90 text-white"
          onClick={() => setIsExportModalOpen(true)}
        >
          {t('header.export')}
        </Button>
      </div>
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </header>
  );
}
