"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/store/use-editor-store";
import { TIMELINE_CONSTANTS } from "../_lib/timeline/controls/constants";
import { Track } from "../_lib/timeline/track";

export function useTimelineListener() {
  const { studio, timeline, zoomLevel } = useEditorStore();

  useEffect(() => {
    if (!studio || !timeline) return;

    const syncTimelineToStudio = async () => {
      const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

      // 1. Collect and Format Tracks
      const canvasTracks = timeline
        .getObjects()
        .filter((obj): obj is Track => obj instanceof Track);

      const sortedTracks = [...canvasTracks].sort(
        (a, b) => (a as any).index - (b as any).index,
      );

      const trackData = sortedTracks.map((t) => ({
        id: t.id,
        name: t.name,
        type: (t as any).trackType || "video",
        clipIds: t.clipIds || [],
      }));

      // 2. Collect and Format Clips
      const canvasClips = timeline.getClips();

      const clipUpdates = canvasClips
        .map((clip: any) => {
          const id = clip.clipId || clip.id;
          const left = clip.left;
          // Use content width only, ignoring strokeWidth for duration calculation
          const width = clip.width * Math.abs(clip.scaleX);

          const currentClip = studio.clips?.find((c: any) => c.id === id);

          const fromUs = Math.round((left / pixelsPerSec) * 1_000_000);
          const durationUs = Math.round((width / pixelsPerSec) * 1_000_000);
          const toUs = fromUs + durationUs;
          const updates: any = {};

          // Check for display changes (start or end time)
          const hasFromChange =
            !currentClip || Math.abs(currentClip.display.from - fromUs) > 1;
          const hasToChange =
            !currentClip || Math.abs(currentClip.display.to - toUs) > 1;

          if (hasFromChange || hasToChange) {
            updates.display = { from: fromUs, to: toUs };
          }

          // Check for duration change
          const hasDurationChange =
            !currentClip || Math.abs(currentClip.duration - durationUs) > 1;

          if (hasDurationChange) {
            updates.duration = durationUs;
          }

          // Sync trim for video/audio if changed on the timeline object
          if (clip.trim) {
            const currentTrimFrom = Math.round(clip.trim.from);
            const currentTrimTo = Math.round(clip.trim.to);

            const hasTrimChange =
              !currentClip ||
              !currentClip.trim ||
              Math.abs(currentClip.trim.from - currentTrimFrom) > 1 ||
              Math.abs(currentClip.trim.to - currentTrimTo) > 1;

            if (hasTrimChange) {
              updates.trim = {
                from: currentTrimFrom,
                to: currentTrimTo,
              };
            }
          } else if (
            clip.trimFromUs !== undefined &&
            clip.trimToUs !== undefined
          ) {
            const currentTrimFrom = Math.round(clip.trimFromUs);
            const currentTrimTo = Math.round(clip.trimToUs);

            const hasTrimChange =
              !currentClip ||
              !currentClip.trim ||
              Math.abs(currentClip.trim.from - currentTrimFrom) > 1 ||
              Math.abs(currentClip.trim.to - currentTrimTo) > 1;

            if (hasTrimChange) {
              updates.trim = {
                from: currentTrimFrom,
                to: currentTrimTo,
              };
            }
          }

          if (Object.keys(updates).length === 0) return null;

          return { id, updates };
        })
        .filter(Boolean);

      // 3. Update Studio
      try {
        const validUpdates = clipUpdates as { id: string; updates: any }[];
        const hasClipChanges = validUpdates.length > 0;

        // Group history updates if methods are available
        const hasHistoryGrouping =
          typeof (studio as any).beginHistoryGroup === "function" &&
          typeof (studio as any).endHistoryGroup === "function";

        if (hasHistoryGrouping) {
          (studio as any).beginHistoryGroup();
        }

        try {
          // 1. Update Clips
          if (hasClipChanges) {
            if ((studio as any).updateClips) {
              await (studio as any).updateClips(
                validUpdates.map((u) => ({ id: u.id, updates: u.updates })),
              );
            } else {
              console.log(validUpdates);
              await Promise.all(
                validUpdates.map((u) => studio.updateClip(u.id, u.updates)),
              );
            }
          }

          await studio.setTracks(trackData as any);
        } finally {
          if (hasHistoryGrouping) {
            (studio as any).endHistoryGroup();
          }
        }
      } catch (error) {
        console.error("Failed to sync timeline to studio:", error);
      }
    };

    const syncSelectionToStudio = () => {
      const selectedClips = timeline?.getActiveObjects() || [];
      const clipIds = selectedClips.map((clip: any) => clip.clipId || clip.id);
      studio.selectClipsByIds(clipIds);
    };

    // Subscriptions to custom Fabric events
    // We use granular listeners to match the logic where possible
    (timeline as any).on("update:track", syncTimelineToStudio);
    (timeline as any).on("clip:move", syncTimelineToStudio);
    (timeline as any).on("clip:resize", syncTimelineToStudio);
    (timeline as any).on("selection:created", syncSelectionToStudio);
    (timeline as any).on("selection:updated", syncSelectionToStudio);
    (timeline as any).on("selection:change", syncSelectionToStudio);
    (timeline as any).on("selection:cleared", syncSelectionToStudio);

    return () => {
      (timeline as any).off("update:track", syncTimelineToStudio);
      (timeline as any).off("clip:move", syncTimelineToStudio);
      (timeline as any).off("clip:resize", syncTimelineToStudio);
      (timeline as any).off("selection:created", syncSelectionToStudio);
      (timeline as any).off("selection:updated", syncSelectionToStudio);
      (timeline as any).off("selection:change", syncSelectionToStudio);
      (timeline as any).off("selection:cleared", syncSelectionToStudio);
    };
  }, [studio, timeline, zoomLevel]);
}
