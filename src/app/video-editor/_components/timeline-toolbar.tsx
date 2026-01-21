'use client';

import { useEditorStore } from '@/store/use-editor-store';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Pause,
  Play,
  SkipBack,
  Magnet,
  ZoomOut,
  ZoomIn,
  Copy,
  Trash2,
  Scissors,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { TIMELINE_CONSTANTS } from '../_lib/timeline/constants';
import { formatTimeCode } from '@/lib/time';
import { EditableTimecode } from '@/components/ui/editable-timecode';

import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from '@tabler/icons-react';

interface TimelineToolbarProps {
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  duration: number;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSplit?: () => void;
}

export function TimelineToolbar({
  zoomLevel,
  setZoomLevel,
  duration,
  onDelete,
  onDuplicate,
  onSplit,
}: TimelineToolbarProps) {
  const { studio, currentTime, isPlaying, setIsPlaying } = useEditorStore();

  const handleZoomIn = () => {
    setZoomLevel(Math.min(3.5, zoomLevel + 0.15));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(0.15, zoomLevel - 0.15));
  };

  const handleZoomSliderChange = (values: number[]) => {
    setZoomLevel(values[0]);
  };

  const togglePlayback = () => {
    console.log('Toggle playback', studio);
    if (!studio) return;
    if (isPlaying) {
      studio.pause();
    } else {
      studio.play();
    }
  };

  const seek = (time: number) => {
    if (!studio) return;
    studio.seek(time * 1_000_000);
  };

  return (
    <div className="flex items-center justify-between px-2 py-1 bg-[#0a0a0a] border-b border-white/5 h-10 select-none">
      {/* Left Area: Edit Tools */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSplit}
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <Scissors className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Split element (S)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate element (Ctrl+D)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete element (Delete)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <Magnet className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Auto snapping</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Center Area: Playback & Time */}
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => seek(0)}
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <IconPlayerSkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Return to Start (Home)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayback}
                className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90"
              >
                {isPlaying ? (
                  <IconPlayerPauseFilled className="h-5 w-5" />
                ) : (
                  <IconPlayerPlayFilled className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => seek(duration)}
                className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
              >
                <IconPlayerSkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>End (End)</TooltipContent>
          </Tooltip>

          {/* Time Display */}
          <div className="flex items-center font-mono text-sm tracking-tight px-2 h-8 rounded bg-white/5 ml-2 border border-white/5">
            <EditableTimecode
              time={currentTime}
              duration={duration}
              format="MM:SS"
              fps={TIMELINE_CONSTANTS.DEFAULT_FPS}
              onTimeChange={seek}
              className="text-white font-bold"
            />
            <div className="text-white/20 px-2 select-none">/</div>
            <div className="text-white/40">
              {formatTimeCode(duration, 'MM:SS')}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Right Area: Zoom & View */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 px-3 border-r border-white/5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            className="h-7 w-7 text-white/50 hover:text-white"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            className="w-24"
            value={[zoomLevel]}
            onValueChange={handleZoomSliderChange}
            min={0.15}
            max={3.5}
            step={0.15}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            className="h-7 w-7 text-white/50 hover:text-white"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-white/50 hover:text-white hover:bg-white/10 ml-1"
        >
          <Download className="h-4 w-4" />
          <span className="text-xs font-medium">Export</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
