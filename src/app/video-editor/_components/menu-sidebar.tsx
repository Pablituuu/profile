'use client';

import {
  Clapperboard,
  Type,
  Music,
  Sparkles,
  ArrowRightLeft,
  Image as ImageIcon,
  Scissors,
  Languages,
  Mic,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/store/use-language-store';
import { useGuestStore } from '@/store/use-guest-store';

const menuItems = [
  { id: 'media', icon: Clapperboard, labelKey: 'menu.media', isAI: false },
  { id: 'audio', icon: Music, labelKey: 'menu.audio', isAI: false },
  { id: 'text', icon: Type, labelKey: 'menu.text', isAI: false },
  { id: 'voice-ai', icon: Mic, labelKey: 'menu.voice_ai', isAI: true },
  { id: 'captions', icon: Languages, labelKey: 'menu.captions', isAI: true },
  { id: 'image', icon: ImageIcon, labelKey: 'menu.image', isAI: false },
  { id: 'effects', icon: Sparkles, labelKey: 'menu.effects', isAI: false },
  {
    id: 'transitions',
    icon: ArrowRightLeft,
    labelKey: 'menu.transitions',
    isAI: false,
  },
  { id: 'highlights', icon: Scissors, labelKey: 'menu.highlights', isAI: true },
  { id: 'ai-assets', icon: Sparkles, labelKey: 'menu.ai_assets', isAI: true },
];

interface MenuSidebarProps {
  activeTool: string | null;
  onSelect: (id: string | null) => void;
}

import React from 'react';

export const MenuSidebar = React.memo(function MenuSidebar({
  activeTool,
  onSelect,
}: MenuSidebarProps) {
  const { t } = useLanguageStore();
  const isGuest = useGuestStore((s) => s.isGuest);

  const handleSelect = (id: string, isAI: boolean) => {
    if (isGuest && isAI) return;
    // If clicking the already active tool, collapse it (set to null)
    if (activeTool === id) {
      onSelect(null);
    } else {
      onSelect(id);
    }
  };

  return (
    <aside className="w-[72px] bg-card border-r border-border flex flex-col items-center py-4 gap-6 z-40">
      {menuItems.map((item) => {
        const isDisabled = isGuest && item.isAI;
        return (
          <div
            key={item.id}
            onClick={() => handleSelect(item.id, item.isAI)}
            className={cn(
              'relative flex flex-col items-center gap-1 transition-colors',
              isDisabled
                ? 'text-muted-foreground/30 cursor-not-allowed'
                : 'cursor-pointer hover:text-foreground',
              !isDisabled && activeTool === item.id
                ? 'text-brand-primary'
                : !isDisabled
                  ? 'text-muted-foreground'
                  : ''
            )}
          >
            <div className="relative">
              <item.icon className="h-6 w-6" strokeWidth={1.5} />
              {isDisabled && (
                <Lock className="absolute -right-1.5 -top-1.5 h-3 w-3 text-yellow-500/60" />
              )}
            </div>
            <span className="text-[10px] font-medium">
              {t(item.labelKey as any)}
            </span>
          </div>
        );
      })}
    </aside>
  );
});
