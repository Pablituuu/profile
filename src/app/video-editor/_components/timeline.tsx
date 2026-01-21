'use client';

import { useState, useEffect, useRef } from 'react';
import { TimelineEngine } from '../_lib/timeline/engine';
import { TimelineToolbar } from './timeline-toolbar';
import { TimelineRuler } from './timeline-ruler';
import { TimelinePlayhead } from './timeline-playhead';
import { useTimelinePlayheadRuler } from '../_hooks/use-timeline-playhead';
import { TIMELINE_CONSTANTS } from '../_lib/timeline/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { useEditorStore } from '@/store/use-editor-store';

export function Timeline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<TimelineEngine | null>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);

  const { studio, setCurrentTime, setIsPlaying } = useEditorStore();
  const studioRef = useRef(studio);

  // Keep studioRef synced
  useEffect(() => {
    studioRef.current = studio;
  }, [studio]);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [duration, setDuration] = useState(60);
  const isUpdatingRef = useRef(false);

  const { handleRulerMouseDown } = useTimelinePlayheadRuler({
    duration,
    zoomLevel,
    seek: (time) => {
      const currentStudio = studioRef.current;
      if (currentStudio) {
        currentStudio.seek(time * 1_000_000);
      }
    },
    rulerRef,
    rulerScrollRef,
  });

  const dynamicTimelineWidth = Math.max(
    duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel,
    800
  );

  useEffect(() => {
    if (!canvasRef.current || timelineRef.current) return;

    // Check if the canvas is already initialized (e.g., from a quick re-mount)
    const existingContainer =
      canvasRef.current.parentElement?.classList.contains('canvas-container');
    if (existingContainer) {
      console.warn(
        '[Timeline] Canvas already has a container, skipped re-init'
      );
      return;
    }

    // Initialize the timeline engine
    const engine = new TimelineEngine(canvasRef.current, {
      width: canvasRef.current.parentElement?.clientWidth || 800,
      height: 300,
      renderOnAddRemove: false, // Performance optimization
    });
    timelineRef.current = engine;
    // ...

    engine.initScrollbars({
      initialOffsetX: 0,
      barThickness: 8,
      barColor: 'rgba(255, 255, 255, 0.3)',
    });

    engine.onViewportChange((left) => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      if (rulerScrollRef.current) {
        rulerScrollRef.current.scrollLeft = left;
      }
      isUpdatingRef.current = false;
    });

    engine.onZoomChange((zoom) => {
      setZoomLevel(zoom);
    });

    // Sync selection from Timeline -> Studio
    engine.on('selection:created', (opt) => {
      if (!studio) return;
      const selectedIds = opt.selected
        ?.map((obj: any) => obj.clipId)
        .filter(Boolean) as string[];
      if (selectedIds && selectedIds.length > 0) {
        (studio as any).selectClips?.(selectedIds);
      }
    });

    engine.on('selection:updated', (opt) => {
      if (!studio) return;
      const selectedIds = opt.selected
        ?.map((obj: any) => obj.clipId)
        .filter(Boolean) as string[];
      if (selectedIds && selectedIds.length > 0) {
        (studio as any).selectClips?.(selectedIds);
      }
    });

    engine.on('selection:cleared', () => {
      if (!studio) return;
      (studio as any).deselectClips?.();
    });

    // Debug Logs for Modify Events
    (engine as any).on('track:created', (opt: any) => {
      console.log('[Timeline] track:created', opt);
    });
    (engine as any).on('clip:movedToTrack', (opt: any) => {
      console.log('[Timeline] clip:movedToTrack', opt);
    });
    (engine as any).on(
      'clip:modified',
      async (opt: {
        clipId: string;
        displayFrom?: number;
        duration?: number;
        trim?: any;
      }) => {
        console.log('[Timeline] clip:modified', opt);
        const currentStudio = studioRef.current;
        if (!currentStudio) return;

        const updates: any = {};

        if (opt.displayFrom !== undefined) {
          // Get current state
          const currentClip =
            (currentStudio as any).clips?.[opt.clipId] ||
            (currentStudio as any).getClip?.(opt.clipId);
          const currentDuration = opt.duration ?? currentClip?.duration ?? 0;
          const displayToUs = opt.displayFrom + currentDuration;

          updates.display = {
            from: opt.displayFrom,
            to: displayToUs,
          };
        }

        if (opt.duration !== undefined) {
          updates.duration = opt.duration;
        }

        if (opt.trim !== undefined) {
          updates.trim = opt.trim;
        }
        console.log('[Timeline] clip:modified', updates);
        await currentStudio.updateClip(opt.clipId, updates);
      }
    );
    (engine as any).on('clips:modified', async (opt: { clips: any[] }) => {
      console.log('[Timeline] clips:modified', opt);
      const currentStudio = studioRef.current;
      if (!currentStudio || !opt.clips) return;

      // Update Studio for each clip
      await Promise.all(
        opt.clips.map(async (clip) => {
          const updates: any = {};
          const displayFromUs = clip.displayFrom;
          const durationUs = clip.duration;

          if (displayFromUs !== undefined) {
            // Get current CLIP state from studio/engine to calculate 'to'
            const currentClip =
              (currentStudio as any).clips?.[clip.clipId] ||
              (currentStudio as any).getClip?.(clip.clipId);
            const currentDuration = durationUs ?? currentClip?.duration ?? 0;
            const displayToUs = displayFromUs + currentDuration;

            updates.display = {
              from: displayFromUs,
              to: displayToUs,
            };
          }
          if (durationUs !== undefined) {
            updates.duration = durationUs;
          }
          if (clip.trim !== undefined) {
            updates.trim = clip.trim;
          }

          await currentStudio.updateClip(clip.clipId, updates);
        })
      );
    });

    (engine as any).on('timeline:updated', (opt: { tracks: any[] }) => {
      console.log('[Timeline] timeline:updated', opt);
      const currentStudio = studioRef.current;
      if (!currentStudio || !opt.tracks) return;

      // Update Studio Tracks (Essential for Z-Index / Layering)
      currentStudio.setTracks(opt.tracks);
    });

    // Cleanup on unmount
    return () => {
      if (timelineRef.current) {
        timelineRef.current.disposeScrollbars();
        timelineRef.current.dispose();
        timelineRef.current = null;
      }
    };
  }, []);

  // Synchronize with studio
  useEffect(() => {
    if (!studio || !timelineRef.current) return;

    const syncTimeline = () => {
      try {
        const s = studio as any;

        // 1. Try to get tracks
        let tracks =
          s.getTracks?.() ||
          s.design?.tracks ||
          s.timeline?.getTracks?.() ||
          [];
        if (!Array.isArray(tracks)) {
          tracks =
            tracks instanceof Map
              ? Array.from(tracks.values())
              : Object.values(tracks || {});
        }

        // 2. Try to get clips
        let clips =
          s.getClips?.() ||
          s.clips ||
          s.design?.clips ||
          s.timeline?.getClips?.() ||
          [];
        if (!Array.isArray(clips)) {
          clips =
            clips instanceof Map
              ? Array.from(clips.values())
              : Object.values(clips || {});
        }

        console.log('[Timeline] Syncing Data:', {
          foundTracks: tracks.length,
          foundClips: clips.length,
          rawClipsType: typeof (s.getClips?.() || s.clips || s.design?.clips),
        });

        if (
          clips.length === 0 &&
          tracks.length > 0 &&
          tracks[0].clipIds?.length > 0
        ) {
          console.warn(
            '[Timeline] Tracks have clip IDs but no clips found! Checking for alternative properties...'
          );
          // Last resort: check if clips are scattered in the studio
        }

        timelineRef.current?.setTimeline(tracks, clips);

        const maxDuration =
          s.getMaxDuration?.() || s.timeline?.getMaxDuration?.() || 60_000_000;
        setDuration(maxDuration / 1_000_000);
      } catch (err) {
        console.error('Failed to sync timeline:', err);
      }
    };

    // Initial sync
    syncTimeline();

    // Listen for changes
    studio.on('clip:added', syncTimeline);
    studio.on('clip:removed', syncTimeline);
    studio.on('clip:moved', syncTimeline);
    studio.on('clip:updated', syncTimeline);
    studio.on('track:added', syncTimeline);
    studio.on('track:removed', syncTimeline);

    const handleTimeUpdate = ({ currentTime }: { currentTime: number }) => {
      setCurrentTime(currentTime / 1_000_000);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    studio.on('currentTime', handleTimeUpdate);
    studio.on('play', handlePlay);
    studio.on('pause', handlePause);

    // Initial sync
    setCurrentTime(studio.getCurrentTime() / 1_000_000);
    setIsPlaying(studio.getIsPlaying());
    setDuration(studio.getMaxDuration() / 1_000_000);

    return () => {
      studio.off('clip:added', syncTimeline);
      studio.off('clip:removed', syncTimeline);
      studio.off('clip:moved', syncTimeline);
      studio.off('clip:updated', syncTimeline);
      studio.off('track:added', syncTimeline);
      studio.off('track:removed', syncTimeline);
      studio.off('currentTime', handleTimeUpdate);
      studio.off('play', handlePlay);
      studio.off('pause', handlePause);
    };
  }, [studio, setCurrentTime, setIsPlaying]);

  // Sync selection
  const { selectedClips } = useEditorStore();
  useEffect(() => {
    if (!timelineRef.current) return;
    const selectedIds = new Set(selectedClips.map((c) => c.id));

    const objects = timelineRef.current.getObjects();
    objects.forEach((obj) => {
      const clipId = (obj as any).clipId;
      if (clipId) {
        (obj as any).setSelectionActive?.(selectedIds.has(clipId));
      }
    });
  }, [selectedClips]);

  return (
    <div
      ref={timelineContainerRef}
      className="h-[300px] bg-[#0a0a0a] border-t border-white/5 flex flex-col shrink-0 z-40 relative overflow-hidden"
    >
      <TimelineToolbar zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />

      {/* Timeline Content Area (Ruler + Canvas) */}
      <div
        ref={timelineContentRef}
        className="flex-1 flex flex-col relative overflow-hidden"
      >
        {/* Ruler Header */}
        <div className="flex bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-50">
          <div className="w-12 shrink-0 border-r border-white/5 flex items-center justify-center h-6">
            <span className="text-[10px] font-medium text-white/20 select-none">
              ID
            </span>
          </div>

          <div
            className="flex-1 relative overflow-hidden h-6 cursor-crosshair"
            onWheel={(e) => {
              // If shift is pressed, we likely want horizontal scroll,
              // which native wheel on ScrollArea might handle, but
              // we want to sync it with canvas zoom/pan logic.
              if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                return; // Let normal horizontal scroll happen or handle below
              }
              if (timelineRef.current) {
                timelineRef.current.handleWheel(e.nativeEvent);
                // Prevent default to stop page zooming/scrolling
                e.preventDefault();
              }
            }}
            data-ruler-area
          >
            <ScrollArea
              className="w-full h-full scrollbar-hidden"
              ref={rulerScrollRef}
              onScroll={(e) => {
                if (isUpdatingRef.current) return;
                isUpdatingRef.current = true;
                const scrollX = (e.currentTarget as HTMLDivElement).scrollLeft;
                if (timelineRef.current) {
                  const vpt = timelineRef.current.viewportTransform.slice(0);
                  vpt[4] = -scrollX;
                  timelineRef.current.setViewportTransform(vpt as any);
                  timelineRef.current.requestRenderAll();
                }
                isUpdatingRef.current = false;
              }}
            >
              <div
                ref={rulerRef}
                className="relative h-6"
                style={{ width: `${dynamicTimelineWidth}px` }}
                onMouseDown={handleRulerMouseDown}
              >
                <TimelineRuler
                  zoomLevel={zoomLevel}
                  duration={duration}
                  width={dynamicTimelineWidth}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Track Labels/ID column offset */}
          <div className="w-12 shrink-0 border-r border-white/5 bg-[#0a0a0a]" />

          <div className="flex-1 relative overflow-hidden">
            <canvas ref={canvasRef} id="timeline-canvas" />
          </div>
        </div>

        <TimelinePlayhead
          duration={duration}
          zoomLevel={zoomLevel}
          seek={(time) => {
            if (studio) studio.seek(time * 1_000_000);
          }}
          rulerRef={rulerRef}
          rulerScrollRef={rulerScrollRef}
          timelineRef={timelineContentRef}
        />
      </div>
    </div>
  );
}
