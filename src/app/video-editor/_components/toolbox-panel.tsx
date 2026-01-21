'use client';

import { ChevronDown, ListFilter } from 'lucide-react';
import { MediaPanel } from './panels/media-panel';
import { AudioPanel } from './panels/audio-panel';
import { TextPanel } from './panels/text-panel';
import { ImagePanel } from './panels/image-panel';
import { EffectsPanel } from './panels/effects-panel';
import { TransitionsPanel } from './panels/transitions-panel';

interface ToolboxPanelProps {
  activeTool: string | null;
}

export function ToolboxPanel({ activeTool }: ToolboxPanelProps) {
  return (
    <div className="w-full h-full flex flex-col z-30 select-none bg-background">
      {/* 1. Panel Header (Space Selector) - Common for all panels */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
          <span className="text-sm font-semibold truncate max-w-[140px]">
            Pablito Project
          </span>
          <ChevronDown className="h-4 w-4" />
        </div>
        <ListFilter className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-white" />
      </div>

      {/* 2. Switch between specific panels */}
      {activeTool === 'media' && <MediaPanel />}
      {activeTool === 'audio' && <AudioPanel />}
      {activeTool === 'text' && <TextPanel />}
      {activeTool === 'image' && <ImagePanel />}
      {activeTool === 'effects' && <EffectsPanel />}
      {activeTool === 'transitions' && <TransitionsPanel />}

      {/* Placeholder for other tools */}
      {activeTool !== 'media' &&
        activeTool !== 'audio' &&
        activeTool !== 'text' &&
        activeTool !== 'image' &&
        activeTool !== 'effects' &&
        activeTool !== 'transitions' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-sm font-medium mb-2 capitalize">
              {activeTool} Panel
            </h3>
            <p className="text-xs text-muted-foreground">Coming soon...</p>
          </div>
        )}
    </div>
  );
}
