'use client';

import {
  Scissors,
  Trash2,
  Download,
  ChevronDown,
  Play,
  Mic,
  Layers,
  Magnet,
  Plus,
  Minus,
  Maximize2,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface TimelineToolbarProps {
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
}

export function TimelineToolbar({
  zoomLevel,
  setZoomLevel,
}: TimelineToolbarProps) {
  const handleZoomIn = () => setZoomLevel(Math.min(10, zoomLevel + 0.1));
  const handleZoomOut = () => setZoomLevel(Math.max(0.1, zoomLevel - 0.1));

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] border-b border-white/5 h-12 select-none">
      {/* Left: Edit Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Scissors className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="flex items-center px-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 text-white/50 hover:text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Center: Playback */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90"
        >
          <Play className="h-4 w-4 fill-current ml-0.5" />
        </Button>
        <div className="flex items-center gap-2 font-mono text-sm tracking-tight text-white/90">
          <span>00:02:20</span>
          <span className="text-white/20">|</span>
          <span className="text-white/40">00:08:06</span>
        </div>
      </div>

      {/* Right: View & Settings */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Layers className="h-4 w-4 text-brand-primary" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Magnet className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 px-3 mx-1 border-l border-r border-white/5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/50 hover:text-white shrink-0"
            onClick={handleZoomOut}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Slider
            value={[zoomLevel * 10]} // Scaling zoom for slider 0-100
            max={100}
            step={1}
            onValueChange={(val) => setZoomLevel(val[0] / 10)}
            className="w-24"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/50 hover:text-white shrink-0"
            onClick={handleZoomIn}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
        >
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
