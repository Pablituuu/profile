'use client';

import React, { useState } from 'react';
import { Effect, GL_EFFECT_OPTIONS } from 'openvideo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/store/use-editor-store';
import { useLanguageStore } from '@/store/use-language-store';

export function EffectsPanel() {
  const { studio } = useEditorStore();
  const { t } = useLanguageStore();
  const EFFECT_DURATION_DEFAULT = 5000000;

  const [hovered, setHovered] = useState<Record<string, boolean>>({});

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground select-none">
      <div className="p-4 shrink-0">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t('effects.title')}
        </h3>
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {GL_EFFECT_OPTIONS.map((effect) => {
            const isHovered = hovered[effect.key];

            return (
              <div
                key={effect.key}
                className="flex w-full items-center gap-2 flex-col group cursor-pointer"
                onMouseEnter={() =>
                  setHovered((prev) => ({ ...prev, [effect.key]: true }))
                }
                onMouseLeave={() =>
                  setHovered((prev) => ({ ...prev, [effect.key]: false }))
                }
                onClick={() => {
                  if (!studio) return;
                  const clip = new Effect(effect.key);
                  clip.duration = EFFECT_DURATION_DEFAULT;
                  studio.addClip(clip);
                }}
              >
                <div className="relative w-full aspect-video rounded-md bg-muted border border-border/50 overflow-hidden group-hover:border-brand-primary/50 transition-colors">
                  <img
                    src={effect.previewStatic}
                    loading="lazy"
                    className="
                      absolute inset-0 w-full h-full object-cover rounded-sm
                      transition-opacity duration-150
                      opacity-100 group-hover:opacity-0
                    "
                    alt={effect.label}
                  />

                  {isHovered && (
                    <img
                      src={effect.previewDynamic}
                      className="
                        absolute inset-0 w-full h-full object-cover rounded-sm
                        transition-opacity duration-150
                        opacity-0 group-hover:opacity-100
                      "
                      alt={effect.label}
                    />
                  )}
                  <div className="absolute bottom-0 left-0 w-full p-2 bg-linear-to-t from-black/80 to-transparent text-white text-[10px] font-medium truncate text-center transition-opacity duration-150 group-hover:opacity-0">
                    {effect.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
