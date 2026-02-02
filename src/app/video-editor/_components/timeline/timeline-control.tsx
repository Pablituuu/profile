'use client';

import { useEditorStore } from '@/store/use-editor-store';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Scissors, Copy, Trash2, Magnet, ZoomOut, ZoomIn } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { formatTimeCode } from '@/lib/time';
import { EditableTimecode } from '@/components/ui/editable-timecode';
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from '@tabler/icons-react';

export function TimelineControl() {
  const {
    studio,
    currentTime,
    isPlaying,
    isSnapping,
    setIsSnapping,
    zoomLevel,
    setZoomLevel,
    timeline,
  } = useEditorStore();

  // Calculate total duration from clips in microseconds
  // studio.clips might be an array or undefined
  const clips = studio?.clips || [];
  const durationInUs = clips.reduce(
    (max, clip) => Math.max(max, clip.display.to),
    0
  );
  const duration = durationInUs / 1_000_000;

  const handleTogglePlay = () => {
    if (isPlaying) {
      studio?.pause();
    } else {
      studio?.play();
    }
  };

  const handleSeek = (time: number) => {
    studio?.seek(time * 1_000_000);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    setZoomLevel(Math.min(2, zoomLevel + 0.1));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    setZoomLevel(Math.max(0.2, zoomLevel - 0.1));
  };

  const handleSplit = () => {
    if (!studio) return;
    const splitTime = currentTime * 1_000_000;
    (studio as any).splitSelected?.(splitTime);
    if (timeline) {
      (timeline as any).splitClips?.(splitTime);
    }
  };

  const handleDuplicate = () => {
    studio?.duplicateSelected();
  };

  const handleDelete = () => {
    const activeObjects = timeline?.getActiveObjects();
    studio?.deleteSelected();
    if (activeObjects) {
      timeline?.remove(...activeObjects);
      timeline?.requestRenderAll();
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-1 border-b border-white/5 h-10 bg-[#0a0a0a] select-none shrink-0">
      {/* Left section: Tools */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-white/60 hover:text-white"
                onClick={handleSplit}
              >
                <Scissors className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
              Split (S)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-white/60 hover:text-white"
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
              Duplicate (D)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-white/60 hover:text-white"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
              Delete (Del)
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`size-8 ${isSnapping ? 'text-indigo-400' : 'text-white/60 hover:text-white'}`}
                onClick={() => setIsSnapping(!isSnapping)}
              >
                <Magnet className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] py-1 px-2">
              Snapping (N)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Center section: Playback */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-white/60 hover:text-white"
            onClick={() => handleSeek(0)}
          >
            <IconPlayerSkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-white hover:text-white/80"
            onClick={handleTogglePlay}
          >
            {isPlaying ? (
              <IconPlayerPauseFilled className="size-5" />
            ) : (
              <IconPlayerPlayFilled className="size-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-white/60 hover:text-white"
            onClick={() => handleSeek(duration)}
          >
            <IconPlayerSkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-1 min-w-[100px] justify-center">
          <EditableTimecode
            time={currentTime}
            duration={duration}
            onTimeChange={handleSeek}
            className="text-white font-mono text-[11px]"
          />
          <span className="text-white/20 text-[11px]">/</span>
          <span className="text-white/40 font-mono text-[11px]">
            {formatTimeCode(duration, 'MM:SS')}
          </span>
        </div>
      </div>

      {/* Right section: Zoom */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-white/60 hover:text-white"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-24">
          <Slider
            value={[zoomLevel]}
            onValueChange={(vals) => setZoomLevel(vals[0])}
            min={0.2}
            max={2}
            step={0.1}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-white/60 hover:text-white"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
