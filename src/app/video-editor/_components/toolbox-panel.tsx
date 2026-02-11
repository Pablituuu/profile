'use client';

import { ChevronDown, ListFilter } from 'lucide-react';
import { MediaPanel } from './panels/media-panel';
import { AudioPanel } from './panels/audio-panel';
import { TextPanel } from './panels/text-panel';
import { ImagePanel } from './panels/image-panel';
import { EffectsPanel } from './panels/effects-panel';
import { TransitionsPanel } from './panels/transitions-panel';
import { HighlightsPanel } from './panels/highlights-panel';
import { CaptionsPanel } from './panels/captions-panel';
import { AIAssetsPanel } from './panels/ai-assets-panel';
import { VoiceAIPanel } from './panels/voice-ai-panel';
import { useLanguageStore } from '@/store/use-language-store';

interface ToolboxPanelProps {
  activeTool: string | null;
}

export function ToolboxPanel({ activeTool }: ToolboxPanelProps) {
  const { t } = useLanguageStore();
  return (
    <div className="w-full h-full flex flex-col z-30 select-none bg-background">
      {/* 1. Panel Header (Space Selector) - Common for all panels */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
          <span className="text-sm font-semibold truncate max-w-[140px]">
            {t('toolbox.project_name')}
          </span>
          <ChevronDown className="h-4 w-4" />
        </div>
        <ListFilter className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-white" />
      </div>

      {/* 2. Switch between specific panels */}
      {activeTool === 'media' && <MediaPanel />}
      {activeTool === 'audio' && <AudioPanel />}
      {activeTool === 'text' && <TextPanel />}
      {activeTool === 'captions' && <CaptionsPanel />}
      {activeTool === 'image' && <ImagePanel />}
      {activeTool === 'effects' && <EffectsPanel />}
      {activeTool === 'transitions' && <TransitionsPanel />}
      {activeTool === 'highlights' && <HighlightsPanel />}
      {activeTool === 'ai-assets' && <AIAssetsPanel />}
      {activeTool === 'voice-ai' && <VoiceAIPanel />}

      {/* Placeholder for other tools */}
      {activeTool !== 'media' &&
        activeTool !== 'audio' &&
        activeTool !== 'text' &&
        activeTool !== 'voice-ai' &&
        activeTool !== 'captions' &&
        activeTool !== 'image' &&
        activeTool !== 'effects' &&
        activeTool !== 'transitions' &&
        activeTool !== 'highlights' &&
        activeTool !== 'ai-assets' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-sm font-medium mb-2 capitalize">
              {activeTool} Panel
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('toolbox.coming_soon')}
            </p>
          </div>
        )}
    </div>
  );
}
