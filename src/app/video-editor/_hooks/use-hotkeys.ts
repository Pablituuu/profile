'use client';

import { useEffect } from 'react';
import hotkeys from 'hotkeys-js';
import { useEditorStore } from '@/store/use-editor-store';

// Module-level clipboard for copy/paste (stores clip IDs)
let copiedClipIds: string[] = [];

/**
 * Hook to register all keyboard shortcuts for the video editor.
 * Uses hotkeys-js for cross-platform key binding.
 */
export function useHotkeys() {
  const {
    studio,
    timeline,
    isPlaying,
    zoomLevel,
    setZoomLevel,
    setIsExportModalOpen,
  } = useEditorStore();

  useEffect(() => {
    // Allow hotkeys to work even inside inputs/textareas for some keys
    hotkeys.filter = (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName;
      // Block most shortcuts inside input/textarea/contenteditable
      if (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // But STILL allow Escape
        if (event.key === 'Escape') return true;
        return false;
      }
      return true;
    };

    // ─── GLOBAL ─────────────────────────────────────────────

    // Undo
    hotkeys('ctrl+z,command+z', (e) => {
      e.preventDefault();
      studio?.undo();
    });

    // Redo
    hotkeys('ctrl+shift+z,command+shift+z', (e) => {
      e.preventDefault();
      studio?.redo();
    });

    // Play / Pause
    hotkeys('space', (e) => {
      e.preventDefault();
      if (isPlaying) {
        studio?.pause();
      } else {
        studio?.play();
      }
    });

    // Delete selected
    hotkeys('delete,backspace', (e) => {
      e.preventDefault();
      const activeObjects = timeline?.getActiveObjects();
      studio?.deleteSelected();
      if (activeObjects) {
        timeline?.remove(...activeObjects);
        timeline?.requestRenderAll();
      }
    });

    // Duplicate selected
    hotkeys('ctrl+d,command+d', (e) => {
      e.preventDefault();
      studio?.duplicateSelected();
    });

    // Select all (on canvas)
    hotkeys('ctrl+a,command+a', (e) => {
      e.preventDefault();
      // Select all clips on the Studio canvas
      const clips = studio?.clips || [];
      if (clips.length > 0) {
        studio?.selectClipsByIds(clips.map((c: any) => c.id));
      }
    });

    // Copy — store the IDs of currently selected clips
    hotkeys('ctrl+c,command+c', (e) => {
      e.preventDefault();
      if (!studio) return;
      const selected = studio.getSelectedClips?.() || [];
      if (selected.length === 0) return;
      copiedClipIds = selected.map((clip: any) => clip.id);
    });

    // Paste — re-select the copied clips and duplicate them
    hotkeys('ctrl+v,command+v', (e) => {
      e.preventDefault();
      if (!studio || copiedClipIds.length === 0) return;
      // Verify the copied clips still exist in the project
      const allClips = studio.clips || [];
      const validIds = copiedClipIds.filter((id) =>
        allClips.some((c: any) => c.id === id)
      );
      if (validIds.length === 0) return;
      // Select the copied clips, then duplicate
      studio.selectClipsByIds(validIds);
      studio.duplicateSelected();
    });

    // Save (Export JSON)
    hotkeys('ctrl+s,command+s', (e) => {
      e.preventDefault();
      if (!studio) return;
      try {
        const json = studio.exportToJSON();
        const blob = new Blob([JSON.stringify(json, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pablituuu-project-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export to JSON:', error);
      }
    });

    // Export video
    hotkeys('ctrl+e,command+e', (e) => {
      e.preventDefault();
      setIsExportModalOpen(true);
    });

    // Escape — deselect
    hotkeys('escape', (e) => {
      e.preventDefault();
      studio?.selectClipsByIds([]);
      timeline?.discardActiveObject();
      timeline?.requestRenderAll();
    });

    // ─── TIMELINE ───────────────────────────────────────────

    // Split at playhead
    hotkeys('ctrl+b,command+b', (e) => {
      e.preventDefault();
      if (!studio) return;
      const currentTime = useEditorStore.getState().currentTime;
      const splitTime = currentTime * 1_000_000;
      (studio as any).splitSelected?.(splitTime);
      if (timeline) {
        (timeline as any).splitClips?.(splitTime);
      }
    });

    // Timeline Zoom In
    hotkeys('ctrl+=,command+=,ctrl+plus,command+plus', (e) => {
      e.preventDefault();
      const current = useEditorStore.getState().zoomLevel;
      setZoomLevel(Math.min(2, Math.round((current + 0.1) * 10) / 10));
    });

    // Timeline Zoom Out
    hotkeys('ctrl+-,command+-,ctrl+minus,command+minus', (e) => {
      e.preventDefault();
      const current = useEditorStore.getState().zoomLevel;
      setZoomLevel(Math.max(0.2, Math.round((current - 0.1) * 10) / 10));
    });

    // Go to start
    hotkeys('home', (e) => {
      e.preventDefault();
      studio?.seek(0);
    });

    // Go to end
    hotkeys('end', (e) => {
      e.preventDefault();
      const clips = studio?.clips || [];
      const maxTime = clips.reduce(
        (max, clip) => Math.max(max, clip.display.to),
        0
      );
      studio?.seek(maxTime);
    });

    // Previous frame ( , key)
    hotkeys(',', (e) => {
      e.preventDefault();
      const currentTime = useEditorStore.getState().currentTime;
      const frameTime = 1 / 30; // 30fps
      const newTime = Math.max(0, currentTime - frameTime);
      studio?.seek(Math.round(newTime * 1_000_000));
    });

    // Next frame ( . key)
    hotkeys('.', (e) => {
      e.preventDefault();
      const currentTime = useEditorStore.getState().currentTime;
      const frameTime = 1 / 30; // 30fps
      const newTime = currentTime + frameTime;
      studio?.seek(Math.round(newTime * 1_000_000));
    });

    // ─── CANVAS (Move selected objects) ─────────────────────

    // Move Up 1px
    hotkeys('up', (e) => {
      e.preventDefault();
      moveSelected(0, -1);
    });

    // Move Down 1px
    hotkeys('down', (e) => {
      e.preventDefault();
      moveSelected(0, 1);
    });

    // Move Left 1px
    hotkeys('left', (e) => {
      e.preventDefault();
      moveSelected(-1, 0);
    });

    // Move Right 1px
    hotkeys('right', (e) => {
      e.preventDefault();
      moveSelected(1, 0);
    });

    // Move Up 5px (Shift)
    hotkeys('shift+up', (e) => {
      e.preventDefault();
      moveSelected(0, -5);
    });

    // Move Down 5px (Shift)
    hotkeys('shift+down', (e) => {
      e.preventDefault();
      moveSelected(0, 5);
    });

    // Move Left 5px (Shift)
    hotkeys('shift+left', (e) => {
      e.preventDefault();
      moveSelected(-5, 0);
    });

    // Move Right 5px (Shift)
    hotkeys('shift+right', (e) => {
      e.preventDefault();
      moveSelected(5, 0);
    });

    function moveSelected(dx: number, dy: number) {
      if (!studio) return;
      const selectedClips = useEditorStore.getState().selectedClips;
      if (selectedClips.length === 0) return;

      selectedClips.forEach((clip: any) => {
        const obj = clip.fabricObject || clip._fabricObject || clip;
        if (obj && typeof obj.set === 'function') {
          obj.set({
            left: (obj.left || 0) + dx,
            top: (obj.top || 0) + dy,
          });
          obj.setCoords?.();
        }
      });

      // Render the Studio canvas
      (studio as any).canvas?.requestRenderAll?.();
    }

    return () => {
      hotkeys.unbind();
    };
  }, [
    studio,
    timeline,
    isPlaying,
    zoomLevel,
    setZoomLevel,
    setIsExportModalOpen,
  ]);
}
