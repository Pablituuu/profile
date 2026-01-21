'use client';

import { useEditorStore } from '@/store/use-editor-store';
import { X, Settings, Sparkles, Volume2, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const tabs = [{ id: 'basic', icon: Settings, label: 'Básico' }];

import { TextProperties } from './text-properties';
import { VideoProperties } from './video-properties';
import { AudioProperties } from './audio-properties';
import { ImageProperties } from './image-properties';
import { CaptionProperties } from './caption-properties';

export function PropertiesPanel() {
  const { selectedClips, setSelectedClips } = useEditorStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [, setTick] = useState(0);

  const clip = selectedClips[0] as any;
  const type = clip?.type;

  useEffect(() => {
    if (!clip) return;

    const onPropsChange = () => {
      setTick((t) => t + 1);
    };

    clip.on?.('propsChange', onPropsChange);
    clip.on?.('moving', onPropsChange);
    clip.on?.('scaling', onPropsChange);
    clip.on?.('rotating', onPropsChange);

    return () => {
      clip.off?.('propsChange', onPropsChange);
      clip.off?.('moving', onPropsChange);
      clip.off?.('scaling', onPropsChange);
      clip.off?.('rotating', onPropsChange);
    };
  }, [clip]);

  if (selectedClips.length === 0) return null;

  const renderContent = () => {
    switch (type) {
      case 'Text':
        return <TextProperties clip={clip} />;
      case 'Video':
        return <VideoProperties clip={clip} />;
      case 'Audio':
        return <AudioProperties clip={clip} />;
      case 'Image':
        return <ImageProperties clip={clip} />;
      case 'Caption':
        return <CaptionProperties clip={clip} />;
      default:
        return (
          <div className="space-y-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Propiedades {type}
            </h4>
          </div>
        );
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[360px] flex shadow-2xl z-50 pointer-events-auto">
      {/* 1. Main Content Area */}
      <div className="flex-1 bg-[#1A1A1A] border border-border border-r-0 rounded-l-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border/50 shrink-0">
          <span className="text-sm font-semibold">
            {activeTab === 'basic' ? 'Básico' : activeTab}
          </span>
          <button
            onClick={() => setSelectedClips([])}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Properties Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">{renderContent()}</div>
        </ScrollArea>
      </div>

      {/* 2. Side Tab Bar (Match basic selection style) */}
      <div className="w-[56px] bg-[#1A1A1A] border border-border rounded-r-xl flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'p-2.5 transition-all relative group flex items-center justify-center',
              activeTab === tab.id
                ? 'bg-brand-primary rounded-xl text-white shadow-lg shadow-brand-primary/20'
                : 'text-muted-foreground hover:text-white'
            )}
            title={tab.label}
          >
            <tab.icon className="h-5 w-5" strokeWidth={1.5} />

            {/* Tooltip on hover */}
            <div className="absolute right-full mr-2 px-2 py-1 bg-[#222] text-white text-[10px] rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5 shadow-xl">
              {tab.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
