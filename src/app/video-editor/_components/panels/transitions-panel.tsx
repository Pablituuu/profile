'use client';

import { useEffect, useState } from 'react';
import { GL_TRANSITION_OPTIONS, Transition } from 'openvideo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/store/use-editor-store';
import { Track } from '../../_lib/timeline/track';
import { Check } from 'lucide-react';
import { useLanguageStore } from '@/store/use-language-store';

export function TransitionsPanel() {
  // Selectores específicos: Esta es la solución para eliminar las alertas de "Violation"
  const studio = useEditorStore((state) => state.studio);
  const timeline = useEditorStore((state) => state.timeline);
  const selectedTransitionObject = useEditorStore(
    (state) => state.selectedTransitionObject
  );
  const { t } = useLanguageStore();
  const TRANSITION_DURATION_DEFAULT = 2000000;
  const [selectedTransition, setSelectedTransition] = useState<boolean>(false);

  useEffect(() => {
    if (selectedTransition) {
      studio?.clips.forEach((clip) => {
        if (clip.type.toLowerCase() !== 'transition') return;
        const transitionClip = clip as Transition;
        if (
          transitionClip.fromClipId === selectedTransitionObject?.clipIdFrom &&
          transitionClip.toClipId === selectedTransitionObject?.clipIdTo
        ) {
          selectedTransitionObject.set({
            id: transitionClip.id,
            clipId: transitionClip.id, // Sincronizamos ambos para getClips()
            type: transitionClip.type,
            clipIdFrom: transitionClip.fromClipId,
            clipIdTo: transitionClip.toClipId,
            duration: transitionClip.duration,
            transitionType:
              (transitionClip as any).transitionEffect?.name || '',
            fill: '#8A40FA', // Púrpura cuando tiene efecto
            stroke: '#FFFFFF', // Borde blanco para destacar
            strokeWidth: 3, // Resaltado por estar seleccionado para edición
          });
          // Forzar actualización visual y de coordenadas
          selectedTransitionObject.setCoords();

          // Asegurar que el ID se añada al track correspondiente
          const tracks = (timeline?.getObjects() || []).filter(
            (obj): obj is Track => obj instanceof Track
          );
          const transitionTop = selectedTransitionObject.top;
          let nearestTrack: Track | null = null;
          let minDist = Infinity;

          tracks.forEach((track) => {
            const dist = Math.abs(track.top - transitionTop);
            if (dist < minDist) {
              minDist = dist;
              nearestTrack = track;
            }
          });

          if (
            nearestTrack &&
            !(nearestTrack as any).clipIds.includes(transitionClip.id)
          ) {
            (nearestTrack as any).clipIds.push(transitionClip.id);
          }

          (timeline as any).synchronizeTracksWithClips();
          (timeline as any).fire('update:track');
          timeline?.renderAll();
        }
      });
      setSelectedTransition(false);
    }

    // Efecto visual para la unión que se está editando actualmente
    if (selectedTransitionObject) {
      // Guardar colores originales pero aplicar el resaltado de "Editando"
      selectedTransitionObject.set({
        stroke: '#FFFFFF',
        strokeWidth: 3,
      });
      timeline?.requestRenderAll();

      return () => {
        if (selectedTransitionObject) {
          const stillActive = selectedTransitionObject.fill === '#8A40FA';
          selectedTransitionObject.set({
            stroke: stillActive ? '#FFFFFF' : '#d97706',
            strokeWidth: 1.5,
          });
          timeline?.requestRenderAll();
        }
      };
    }
  }, [selectedTransition, selectedTransitionObject, timeline]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground select-none">
      <div className="p-4 shrink-0 flex items-center justify-between border-b border-border/10">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-tight">
          {t('transitions.title')}
        </h3>
        {selectedTransitionObject && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none">
              {t('transitions.editing_union')}
            </span>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 px-4">
        <div className="grid grid-cols-2 gap-3 py-4">
          {GL_TRANSITION_OPTIONS.map((effect) => {
            const isSelected =
              (selectedTransitionObject as any)?.transitionType ===
              effect.label;

            console.log();

            return (
              <div
                key={effect.key}
                className="flex w-full items-center gap-2 flex-col group cursor-pointer"
                onClick={async () => {
                  if (selectedTransitionObject && studio && timeline) {
                    (selectedTransitionObject as any).transitionType =
                      effect.label;
                    await studio.addTransition(
                      effect.key,
                      TRANSITION_DURATION_DEFAULT,
                      selectedTransitionObject.clipIdFrom,
                      selectedTransitionObject.clipIdTo
                    );
                  }
                  setSelectedTransition(true);
                }}
              >
                <div
                  className={`relative w-full aspect-video rounded-xl bg-muted border transition-all duration-300 ease-out ${
                    isSelected
                      ? 'border-brand-primary ring-4 ring-brand-primary/15 shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)] scale-[1.02] z-10'
                      : 'border-border/40 group-hover:border-brand-primary/40 group-hover:scale-[1.01]'
                  }`}
                >
                  {/* Imagen Estática */}
                  <img
                    src={effect.previewStatic}
                    loading="lazy"
                    className={`
                        absolute inset-0 w-full h-full object-cover rounded-[10px]
                        transition-opacity duration-500
                        ${isSelected ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}
                      `}
                    alt={effect.label}
                  />

                  {/* Imagen Dinámica (Preview) */}
                  <img
                    src={effect.previewDynamic}
                    className={`
                        absolute inset-0 w-full h-full object-cover rounded-[10px]
                        transition-opacity duration-500
                        ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                      `}
                    alt={effect.label}
                  />

                  {/* Overlay Gradiente */}
                  <div
                    className={`absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                      isSelected
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />

                  {/* Distintivo de Selección (Check Icon) */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shadow-xl border-2 border-background animate-in zoom-in duration-300">
                      <Check className="w-4 h-4 text-white stroke-[3px]" />
                    </div>
                  )}

                  {/* Etiqueta de Texto */}
                  <div
                    className={`absolute bottom-3 left-0 w-full px-3 text-white text-[11px] font-bold truncate text-center transition-all duration-300 ${
                      isSelected
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
                    }`}
                  >
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
