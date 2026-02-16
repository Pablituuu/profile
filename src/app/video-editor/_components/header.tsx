'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExportModal } from './export-modal';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Undo2,
  Redo2,
  FileJson,
  Upload,
  Download,
  ChevronDown,
  LogOut,
  LogIn,
  Sparkles,
  Keyboard,
} from 'lucide-react';
import { signOut } from '@/app/login/actions';
import { useEditorStore } from '@/store/use-editor-store';
import { useLanguageStore } from '@/store/use-language-store';
import { useGuestStore } from '@/store/use-guest-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShortcutsModal } from './shortcuts-modal';

export function Header() {
  const { studio } = useEditorStore();
  const { t } = useLanguageStore();
  const isGuest = useGuestStore((s) => s.isGuest);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isGuest) return;
    const fetchUser = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, [isGuest]);

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

        {/* Guest mode banner */}
        {isGuest && (
          <div className="hidden md:flex items-center gap-2 ml-4 border-l border-border pl-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-[11px] font-semibold text-yellow-300/90">
                {t('header.guest_banner')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title={t('header.shortcuts')}
          onClick={() => setIsShortcutsOpen(true)}
        >
          <Keyboard className="h-4 w-4" />
        </Button>

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

        {isGuest ? (
          <a href="/login">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 px-3 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              {t('header.sign_in')}
            </Button>
          </a>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full border border-border/50 hover:bg-zinc-800/50 p-0 overflow-hidden"
              >
                {user?.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="User Avatar"
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-linear-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-border bg-background/95 backdrop-blur-xl p-2"
            >
              <div className="px-2 py-2 mb-2 border-b border-white/5">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none mb-1.5">
                  Usuario
                </p>
                <p className="text-xs font-medium text-white truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-red-00 hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 hover:text-red-300 focus:text-red-300 rounded-lg"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">{t('header.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
      <ShortcutsModal
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />
    </header>
  );
}
