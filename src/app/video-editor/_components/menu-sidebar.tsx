'use client';

import {
  Clapperboard,
  Type,
  Music,
  Sparkles,
  ArrowRightLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { id: 'media', icon: Clapperboard, label: 'Media' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: ImageIcon, label: 'Image' },
  { id: 'effects', icon: Sparkles, label: 'Effects' },
  { id: 'transitions', icon: ArrowRightLeft, label: 'Transitions' },
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
  const handleSelect = (id: string) => {
    // If clicking the already active tool, collapse it (set to null)
    if (activeTool === id) {
      onSelect(null);
    } else {
      onSelect(id);
    }
  };

  return (
    <aside className="w-[72px] bg-card border-r border-border flex flex-col items-center py-4 gap-6 z-40">
      {menuItems.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item.id)}
          className={cn(
            'flex flex-col items-center gap-1 cursor-pointer transition-colors hover:text-foreground',
            activeTool === item.id
              ? 'text-brand-primary'
              : 'text-muted-foreground'
          )}
        >
          <item.icon className="h-6 w-6" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </div>
      ))}
    </aside>
  );
});
