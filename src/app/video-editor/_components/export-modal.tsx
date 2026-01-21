'use client';

import { useState, useEffect, useCallback } from 'react';
import { Compositor, Log, type IClip } from '@designcombo/video';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useEditorStore } from '@/store/use-editor-store';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { studio } = useEditorStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportBlobUrl, setExportBlobUrl] = useState<string | null>(null);
  const [exportCombinator, setExportCombinator] = useState<Compositor | null>(
    null
  );

  const maxDuration = studio?.getMaxDuration() || 0;

  const resetState = useCallback(() => {
    if (exportCombinator) {
      exportCombinator.destroy();
      setExportCombinator(null);
    }
    if (exportBlobUrl) {
      URL.revokeObjectURL(exportBlobUrl);
      setExportBlobUrl(null);
    }
    setIsExporting(false);
    setExportProgress(0);
  }, [exportCombinator, exportBlobUrl]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetState();
  }, [onOpenChange, resetState]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleDownload = useCallback(
    (url?: string) => {
      const downloadUrl = url || exportBlobUrl;
      if (!downloadUrl) return;
      const aEl = document.createElement('a');
      document.body.appendChild(aEl);
      aEl.setAttribute('href', downloadUrl);
      aEl.setAttribute('download', `pablituuu-export-${Date.now()}.mp4`);
      aEl.setAttribute('target', '_self');
      aEl.click();
      setTimeout(() => {
        if (document.body.contains(aEl)) {
          document.body.removeChild(aEl);
        }
      }, 100);
    },
    [exportBlobUrl]
  );

  const startExport = useCallback(async () => {
    if (!studio) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportBlobUrl(null);

      // Export current studio to JSON
      const json = studio.exportToJSON();

      if (!json.clips || json.clips.length === 0) {
        throw new Error('No clips to export');
      }

      // Filter out clips with empty sources (except Text, Caption, and Effect)
      const validClips = json.clips.filter((clipJSON: any) => {
        if (
          clipJSON.type === 'Text' ||
          clipJSON.type === 'Caption' ||
          clipJSON.type === 'Effect' ||
          clipJSON.type === 'Transition'
        ) {
          return true;
        }
        return clipJSON.src && clipJSON.src.trim() !== '';
      });

      if (validClips.length === 0) {
        throw new Error('No valid clips to export');
      }

      // Use default settings
      const settings = json.settings || {};
      const combinatorOpts: any = {
        width: (settings.width as number) || 1280,
        height: (settings.height as number) || 720,
        fps: (settings.fps as number) || 30,
        bgColor: (settings.bgColor as string) || '#000000',
        videoCodec: 'avc1.42E032',
        bitrate: 5e6,
        audio: true,
      };

      const com = new Compositor(combinatorOpts);
      await com.initPixiApp();
      setExportCombinator(com);

      com.on('OutputProgress', (v: number) => {
        setExportProgress(v);
      });

      const validJson = { ...json, clips: validClips };
      await com.loadFromJSON(validJson);

      const stream = com.output();
      const blob = await new Response(stream).blob();
      const blobUrl = URL.createObjectURL(blob);
      setExportBlobUrl(blobUrl);
      setIsExporting(false);

      // Automated completion flow
      setTimeout(() => {
        handleDownload(blobUrl);
        console.log('Rendering complete! Your download has started.');
        setTimeout(() => {
          handleClose();
        }, 1500);
      }, 500);
    } catch (error) {
      Log.error('Export error:', error);
      alert('Failed to export: ' + (error as Error).message);
      setIsExporting(false);
    }
  }, [studio, handleClose, handleDownload]);

  // Auto-start export when modal opens
  useEffect(() => {
    if (open && !isExporting && !exportBlobUrl) {
      startExport();
    }
  }, [open, isExporting, exportBlobUrl, startExport]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="max-w-[480px] border-zinc-800 bg-[#0c0c0e]/95 p-0 text-white backdrop-blur-xl"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center p-8 pt-10">
          <DialogTitle className="mb-8 text-xl font-medium tracking-tight">
            Exporting Video
          </DialogTitle>

          <div className="mb-8 w-full rounded-2xl border border-white/5 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Duration</span>
                <span className="font-medium">
                  {(maxDuration / 1e6).toFixed(2)}s
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Video Codec</span>
                <span className="font-medium">avc</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Resolution</span>
                <span className="font-medium">
                  {studio?.getOptions().width} x {studio?.getOptions().height}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Container</span>
                <span className="font-medium">MP4</span>
              </div>
            </div>
          </div>

          <div className="w-full px-1">
            <div className="mb-3 flex items-center justify-between text-[13px]">
              <span className="font-medium text-zinc-300">Progress</span>
              <span className="font-mono text-zinc-400">
                {Math.round(exportProgress * 100)}%
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="absolute bottom-0 left-0 top-0 bg-white transition-all duration-300 ease-out"
                style={{ width: `${exportProgress * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-8 flex w-full justify-center">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex h-11 items-center gap-2.5 rounded-xl border-zinc-800 bg-zinc-900/50 px-8 text-[13px] font-medium text-white transition-all hover:bg-zinc-800 hover:text-white"
            >
              {isExporting && (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              )}
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
