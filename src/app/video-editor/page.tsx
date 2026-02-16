'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MenuSidebar } from './_components/menu-sidebar';
import { ToolboxPanel } from './_components/toolbox-panel';
import { PlayerPreview } from './_components/player-preview';
import { Header } from './_components/header';
import { PropertiesPanel } from './_components/properties-panel';
import { Timeline } from './_components/timeline/timeline';
import { AIChat } from './_components/ai-chat';
import { UpdatesModal } from './_components/updates-modal';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/use-editor-store';
import { useGuestStore } from '@/store/use-guest-store';
import { useHotkeys } from './_hooks/use-hotkeys';

export default function VideoEditorPage() {
  const { activeTool, setActiveTool } = useEditorStore();
  const searchParams = useSearchParams();
  const setIsGuest = useGuestStore((s) => s.setIsGuest);
  const isGuest = useGuestStore((s) => s.isGuest);

  useEffect(() => {
    const guest = searchParams.get('guest') === 'true';
    setIsGuest(guest);
  }, [searchParams, setIsGuest]);

  // Register keyboard shortcuts
  useHotkeys();

  return (
    <div className="h-screen w-screen flex bg-background text-foreground overflow-hidden">
      <UpdatesModal />
      <MenuSidebar activeTool={activeTool} onSelect={setActiveTool} />

      <div
        className={cn(
          'bg-background border-r border-border transition-all duration-300 ease-in-out overflow-hidden relative z-30',
          activeTool ? 'w-[320px] opacity-100' : 'w-0 opacity-0 border-none'
        )}
      >
        <ToolboxPanel activeTool={activeTool} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Seccion Superior: Player + Properties */}
          <div className="flex-1 relative overflow-hidden">
            <PlayerPreview />
            <PropertiesPanel />
          </div>

          {/* Seccion Inferior: Timeline */}
          <Timeline />
        </div>
      </div>

      {!isGuest && <AIChat />}
    </div>
  );
}
