"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/store/use-editor-store";
import { TextClipTimeline } from "../_lib/timeline/text-clip";
import { VideoClipTimeline } from "../_lib/timeline/video-clip";
import { ImageClipTimeline } from "../_lib/timeline/image-clip";
import { AudioClipTimeline } from "../_lib/timeline/audio-clip";
import { Track } from "../_lib/timeline/track";
import { ITrack, IStudioEventData } from "@/types/editor";
import { IClip, Text } from "@designcombo/video";
import { TIMELINE_CONSTANTS } from "../_lib/timeline/controls/constants";
import { cloneDeep } from "lodash";

/**
 * Hook to listen to Studio events and synchronize the timeline canvas.
 * Adheres to TypeScript Quality & Safety standards.
 */
export function useStudioListener() {
  const { studio, timeline, setCurrentTime, setIsPlaying, zoomLevel } =
    useEditorStore();

  useEffect(() => {
    if (!studio || !timeline) return;

    const syncTracks = (e?: IStudioEventData) => {
      const currentStudioTracks = cloneDeep(studio.tracks || []);
      const studioTracks = currentStudioTracks.reverse() || [];
      const trackList: ITrack[] = Array.isArray(studioTracks)
        ? studioTracks
        : Object.values(studioTracks);

      // If e.track is provided in the event, ensure it's in the list to check
      if (e?.track && !trackList.some((t) => t.id === e.track?.id)) {
        trackList.push(e.track);
      }

      timeline.renderTracks(trackList.reverse());
      timeline.alignClipsToTrack();
    };

    const handleClipAdded = (data: IStudioEventData | IClip) => {
      // Normalize clip data from event object or raw clip
      const clip = (data as IStudioEventData).clip || (data as IClip);
      if (!clip) return;

      if (clip.type === "Text") {
        const studioTracks = studio.tracks || [];
        const trackList: ITrack[] = Array.isArray(studioTracks)
          ? studioTracks
          : Object.values(studioTracks);

        const trackIndex = trackList.findIndex((t) =>
          t.clipIds?.includes(clip.id),
        );

        const textValue = (clip as Text).text || "";
        const trackStep =
          TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;

        const visualIndex = trackIndex >= 0 ? trackIndex : 0;

        const textClip = new TextClipTimeline({
          id: clip.id,
          text: textValue,
          display: clip.display,
          duration: clip.duration,
          trackIndex: trackIndex >= 0 ? trackIndex : 0,
          top: TIMELINE_CONSTANTS.INITIAL_Y_OFFSET + visualIndex * trackStep,
          zoom: zoomLevel,
        });
        timeline.add(textClip);
        timeline.alignClipsToTrack();
        timeline.renderAll();
      } else if (clip.type === "Video") {
        const studioTracks = studio.tracks || [];
        const trackList: ITrack[] = Array.isArray(studioTracks)
          ? studioTracks
          : Object.values(studioTracks);

        const trackIndex = trackList.findIndex((t) =>
          t.clipIds?.includes(clip.id),
        );

        const trackStep =
          TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;
        const visualIndex = trackIndex >= 0 ? trackIndex : 0;

        const videoClip = new VideoClipTimeline({
          id: clip.id,
          name: (clip as any).name || clip.type,
          src: (clip as any).src || "",
          display: clip.display,
          trim: (clip as any).trim || { from: 0, to: clip.duration },
          duration: clip.duration,
          trackIndex: trackIndex >= 0 ? trackIndex : 0,
          top: TIMELINE_CONSTANTS.INITIAL_Y_OFFSET + visualIndex * trackStep,
          zoom: zoomLevel,
        });
        timeline.add(videoClip);
        timeline.alignClipsToTrack();
        timeline.renderAll();
      } else if (clip.type === "Image") {
        const studioTracks = studio.tracks || [];
        const trackList: ITrack[] = Array.isArray(studioTracks)
          ? studioTracks
          : Object.values(studioTracks);

        const trackIndex = trackList.findIndex((t) =>
          t.clipIds?.includes(clip.id),
        );

        const trackStep =
          TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;
        const visualIndex = trackIndex >= 0 ? trackIndex : 0;

        const imageClip = new ImageClipTimeline({
          id: clip.id,
          name: (clip as any).name || clip.type,
          src: (clip as any).src || "",
          display: clip.display,
          duration: clip.duration,
          trackIndex: trackIndex >= 0 ? trackIndex : 0,
          top: TIMELINE_CONSTANTS.INITIAL_Y_OFFSET + visualIndex * trackStep,
          zoom: zoomLevel,
        });
        timeline.add(imageClip);
        timeline.alignClipsToTrack();
        timeline.renderAll();
      } else if (clip.type === "Audio") {
        const studioTracks = studio.tracks || [];
        const trackList: ITrack[] = Array.isArray(studioTracks)
          ? studioTracks
          : Object.values(studioTracks);

        const trackIndex = trackList.findIndex((t) =>
          t.clipIds?.includes(clip.id),
        );

        const trackStep =
          TIMELINE_CONSTANTS.CLIP_HEIGHT + TIMELINE_CONSTANTS.TRACK_SPACING;
        const visualIndex = trackIndex >= 0 ? trackIndex : 0;

        const audioClip = new AudioClipTimeline({
          id: clip.id,
          name: (clip as any).name || clip.type,
          src: (clip as any).src || "",
          display: clip.display,
          duration: clip.duration,
          trackIndex: trackIndex >= 0 ? trackIndex : 0,
          top: TIMELINE_CONSTANTS.INITIAL_Y_OFFSET + visualIndex * trackStep,
          zoom: zoomLevel,
        });
        timeline.add(audioClip);
        timeline.alignClipsToTrack();
        timeline.renderAll();
      }
    };

    const handleClipUpdated = (data: IStudioEventData | IClip) => {
      const clip = (data as IStudioEventData).clip || (data as IClip);
      if (!clip) return;

      const objects = timeline.getClips();
      const clipObject = objects.find(
        (obj) => (obj as any).clipId === clip.id || obj.id === clip.id,
      );

      if (clipObject) {
        const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
        const newLeft = (clip.display.from * pixelsPerSec) / 1_000_000;
        const newWidth = (clip.duration * pixelsPerSec) / 1_000_000;

        // If the object is in a group (multi-selection), we must update its relative position
        if (clipObject.group) {
          const matrix = clipObject.calcTransformMatrix();
          const currentAbsLeft = matrix[4] - clipObject.getScaledWidth() / 2;
          const diffX = newLeft - currentAbsLeft;

          clipObject.set({
            left: clipObject.left + diffX,
            width: newWidth,
          });
          clipObject.setCoords();
          clipObject.group.setCoords();
        } else {
          clipObject.set({
            left: newLeft,
            width: newWidth,
          });
          clipObject.setCoords();
        }

        // Sync internal metadata used for zoom and other calculations
        if ("startUs" in clipObject)
          (clipObject as any).startUs = clip.display.from;
        if ("durationUs" in clipObject)
          (clipObject as any).durationUs = clip.duration;
        if ("endUs" in clipObject) (clipObject as any).endUs = clip.display.to;

        // Sync trim if applicable
        if (clip.trim && "trim" in clipObject) {
          (clipObject as any).trim = { ...clip.trim };
        }

        timeline.renderAll();
      }
    };

    const syncClips = () => {
      if (!studio.clips) return;

      const timelineObjects = timeline.getObjects();
      const existingClipIds = new Set(
        timelineObjects
          .filter((obj) => !(obj instanceof Track))
          .map((c) => (c as any).clipId || (c as any).id),
      );

      studio.clips.forEach((clip) => {
        if (!existingClipIds.has(clip.id)) {
          handleClipAdded(clip);
        } else {
          handleClipUpdated(clip);
        }
      });
    };

    const handleClipRemoved = (data: any) => {
      const clipId = data.clipId || data.id || (data.clip && data.clip.id);
      if (!clipId) return;

      // 1. Find and remove the clip object from the canvas
      const objects = timeline.getObjects();
      const clipObject = objects.find(
        (obj) => (obj as any).clipId === clipId || (obj as any).id === clipId,
      );
      if (clipObject && !(clipObject instanceof Track)) {
        timeline.remove(clipObject);
      }

      // 2. Sync track clipIds from studio before cleaning up
      const tracks = objects.filter(
        (obj): obj is Track => obj instanceof Track,
      );
      const studioTracks = studio.tracks || [];
      const trackList: ITrack[] = Array.isArray(studioTracks)
        ? studioTracks
        : Object.values(studioTracks);

      tracks.forEach((track) => {
        const studioTrack = trackList.find((t) => t.id === track.id);
        if (studioTrack) {
          track.clipIds = studioTrack.clipIds || [];
        }
      });

      // 3. Remove tracks that are now empty
      timeline.cleanupEmptyTracks();
      timeline.renderAll();
    };

    const handleSyncHistory = (e: {
      clips: IClip[];
      tracks: ITrack[];
      settings: any;
    }) => {
      console.log(e.clips);
      const clipIds = e.tracks.reduce((acc: string[], track) => {
        acc.push(...track.clipIds);
        return acc;
      }, []);
      const clipsToRemove = timeline
        .getClips()
        .filter((clip) => !clipIds.includes(clip.id));
      clipsToRemove.forEach((clip) => timeline.remove(clip));
      timeline.getClips().forEach((clip) => {
        if (clipIds.includes(clip.id)) {
          const clipStudio = e.clips.find((c) => c.id === clip.id);
          const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
          const newLeft =
            ((clipStudio?.display.from || 0) * pixelsPerSec) / 1_000_000;
          const newWidth =
            ((clipStudio?.duration || 0) * pixelsPerSec) / 1_000_000;
          clip.set({
            left: newLeft,
            width: newWidth,
          });
          clip.setCoords();
        }
      });
      timeline.renderTracks(e.tracks || []);
      if (e.clips) {
        e.clips.forEach((clip) => {
          if (!clipIds.includes(clip.id)) handleClipAdded(clip);
        });
      }
      timeline.alignClipsToTrack();
      timeline.renderAll();
    };

    const handleTimeUpdate = ({ currentTime }: { currentTime: number }) => {
      setCurrentTime(currentTime / 1_000_000);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleTrackAdded = (e: any) => syncTracks(e);
    const handleTrackRemoved = () => syncTracks();
    const handleTrackOrderChanged = () => syncTracks();

    // Subscribe to Studio events
    studio.on("clip:added", handleClipAdded);
    studio.on("clip:updated", handleClipUpdated);
    studio.on("clip:removed", handleClipRemoved);
    studio.on("track:added", handleTrackAdded);
    studio.on("track:removed", handleTrackRemoved);
    studio.on("track:order-changed", handleTrackOrderChanged);
    studio.on("studio:restored", handleSyncHistory);

    syncTracks();
    syncClips();

    studio.on("currentTime", handleTimeUpdate);
    studio.on("play", handlePlay);
    studio.on("pause", handlePause);

    return () => {
      // Clean up subscriptions
      studio.off("clip:added", handleClipAdded);
      studio.off("clip:updated", handleClipUpdated);
      studio.off("clip:removed", handleClipRemoved);
      studio.off("track:added", handleTrackAdded);
      studio.off("track:removed", handleTrackRemoved);
      studio.off("track:order-changed", handleTrackOrderChanged);
      studio.off("studio:restored", handleSyncHistory);

      studio.off("currentTime", handleTimeUpdate);
      studio.off("play", handlePlay);
      studio.off("pause", handlePause);
    };
  }, [studio, timeline, setCurrentTime, setIsPlaying, zoomLevel]);
}
