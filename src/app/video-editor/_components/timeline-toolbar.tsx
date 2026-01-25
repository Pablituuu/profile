"use client";

import { useEditorStore } from "@/store/use-editor-store";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TIMELINE_CONSTANTS } from "../_lib/timeline/constants";
import { formatTimeCode } from "@/lib/time";
import { EditableTimecode } from "@/components/ui/editable-timecode";
import { cn } from "@/lib/utils";

import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from "@tabler/icons-react";

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
  const {
    studio,
    currentTime,
    isPlaying,
    isSnapping,
    setIsSnapping,
    setIsExportModalOpen,
  } = useEditorStore();

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
    console.log("Toggle playback", studio);
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
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300"
            >
              Split element (S)
            </TooltipContent>
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
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300"
            >
              Duplicate element (Ctrl+D)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300"
            >
              Delete element (Delete)
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-white/5 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSnapping(!isSnapping)}
                className={cn(
                  "h-8 w-8 transition-colors",
                  isSnapping
                    ? "text-blue-400 bg-blue-400/10 hover:bg-blue-400/20"
                    : "text-white/50 hover:text-white hover:bg-white/10",
                )}
              >
                <Magnet className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300"
            >
              {isSnapping ? "Disable" : "Enable"} snapping (N)
            </TooltipContent>
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
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 font-medium"
            >
              Return to Start (Home)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayback}
                className="h-8 w-8 rounded-full bg-white text-black hover:bg-white/90 active:scale-95 transition-transform shadow-lg shadow-white/5"
              >
                {isPlaying ? (
                  <IconPlayerPauseFilled className="h-4 w-4 text-zinc-900" />
                ) : (
                  <IconPlayerPlayFilled className="h-4 w-4 ml-0.5 text-zinc-900" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 font-medium"
            >
              {isPlaying ? "Pause (Space)" : "Play (Space)"}
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
            <TooltipContent
              side="bottom"
              className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 font-medium"
            >
              End (End)
            </TooltipContent>
          </Tooltip>

          {/* Time Display */}
          <div className="flex items-center font-mono text-sm tracking-tight px-3 h-8 rounded-full bg-white/5 ml-2 border border-white/5 shadow-inner">
            <EditableTimecode
              time={currentTime}
              duration={duration}
              format="MM:SS"
              fps={TIMELINE_CONSTANTS.DEFAULT_FPS}
              onTimeChange={seek}
              className="text-white font-semibold"
            />
            <div className="text-white/20 px-2 select-none">/</div>
            <div className="text-white/40">
              {formatTimeCode(duration, "MM:SS")}
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Right Area: Empty for now */}
      <div className="flex items-center gap-1" />
    </div>
  );
}
