import { create } from 'zustand';
import { Studio, IClip } from '@designcombo/video';
import TimelineCanvas from '@/app/video-editor/_lib/timeline/canvas';

interface EditorState {
  studio: Studio | null;
  setStudio: (studio: Studio | null) => void;
  timeline: TimelineCanvas | null;
  setTimeline: (timeline: TimelineCanvas | null) => void;
  selectedClips: IClip[];
  setSelectedClips: (clips: IClip[]) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  isSnapping: boolean;
  setIsSnapping: (snapping: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  studio: null,
  setStudio: (studio) => set({ studio }),
  timeline: null,
  setTimeline: (timeline) => set({ timeline }),
  selectedClips: [],
  setSelectedClips: (clips) => set({ selectedClips: clips }),
  currentTime: 0,
  setCurrentTime: (time) => set({ currentTime: time }),
  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  isSnapping: true,
  setIsSnapping: (isSnapping) => set({ isSnapping }),
  isExportModalOpen: false,
  setIsExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  zoomLevel: 1,
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
}));
