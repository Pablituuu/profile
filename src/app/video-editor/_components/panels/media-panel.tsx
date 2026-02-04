'use client';

import { AIAssetsModal } from '../modals/ai-assets-modal';

import { CloudUpload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Placeholder, Video as VideoClip } from 'openvideo';
import { useEditorStore } from '@/store/use-editor-store';
import { useEffect, useRef, useState } from 'react';

const mediaAssets = [
  {
    id: 2,
    title: 'Nature River.mp4',
    type: 'video',
    src: 'https://videos.pexels.com/video-files/3571264/3571264-hd_1920_1080_30fps.mp4',
    duration: '02:11',
    thumbnail:
      'https://images.pexels.com/videos/3571264/free-video-3571264.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  },
  {
    id: 3,
    title: 'City Time Lapse.mp4',
    type: 'video',
    src: 'https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_24fps.mp4',
    duration: '01:01',
    thumbnail:
      'https://images.pexels.com/videos/855564/free-video-855564.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  },
  {
    id: 4,
    title: 'Ocean Waves.mp4',
    type: 'video',
    src: 'https://videos.pexels.com/video-files/1409899/1409899-hd_1920_1080_25fps.mp4',
    duration: '00:04',
    thumbnail:
      'https://images.pexels.com/videos/1409899/free-video-1409899.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  },
  {
    id: 5,
    title: 'Abstract Tech.mp4',
    type: 'video',
    src: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4',
    duration: '00:15',
    thumbnail:
      'https://images.pexels.com/videos/3129671/free-video-3129671.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
  },
  {
    id: 6,
    title: 'Great Quote Shorts.mp4',
    type: 'video',
    src: 'https://ik.imagekit.io/pablituuu/YTDown.com_Shorts_Such-a-great-quote-shorts_Media_Q0BOH_s9gSU_001_1080p.mp4?updatedAt=1768867623090',
    duration: '00:00', // Will be calculated dynamically
    thumbnail: '', // Will be generated dynamically
  },
];

interface VideoAsset {
  id: string | number;
  title: string;
  type: string;
  src: string;
  duration: string;
  thumbnail?: string;
}

interface VideoAssetPreviewProps {
  asset: VideoAsset;
  onClick: (
    asset: VideoAsset,
    realDuration?: number,
    dimensions?: { width: number; height: number }
  ) => void;
}

function VideoAssetPreview({ asset, onClick }: VideoAssetPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState(asset.thumbnail);
  const [durationStr, setDurationStr] = useState(asset.duration);
  const [localDurationSec, setLocalDurationSec] = useState(0);
  const [dimensions, setDimensions] = useState<
    { width: number; height: number } | undefined
  >(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      // Calculate duration string
      const seconds = Math.floor(video.duration);
      setLocalDurationSec(video.duration);
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      setDurationStr(
        `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      );

      // Set dimensions
      setDimensions({ width: video.videoWidth, height: video.videoHeight });

      // Seek to first frame if needed
      if (!asset.thumbnail) {
        video.currentTime = 0.1;
      }
    };

    const onSeeked = () => {
      if (!canvasRef.current || !video || asset.thumbnail) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setThumbnail(dataUrl);
      } catch (e) {
        console.error('Failed to generate thumbnail', e);
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.src = asset.src;
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
    };
  }, [asset.src, asset.thumbnail, asset.duration]);

  return (
    <div
      className="group flex flex-col gap-1.5 cursor-pointer"
      onClick={() => onClick(asset, localDurationSec, dimensions)}
    >
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-transparent group-hover:border-brand-primary/50">
        <img
          src={thumbnail || '/placeholder-image.jpg'}
          alt={asset.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 text-[10px] font-mono text-white">
          {durationStr}
        </div>
        <div className="absolute top-1 left-1 bg-brand-primary/90 rounded px-1 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
          +
        </div>

        {/* Hidden elements for generation */}
        <video
          ref={videoRef}
          className="hidden"
          crossOrigin="anonymous"
          preload="metadata"
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <span className="text-[11px] text-muted-foreground truncate group-hover:text-white transition-colors">
        {asset.title}
      </span>
    </div>
  );
}

import { useLanguageStore } from '@/store/use-language-store';

export function MediaPanel() {
  const { studio } = useEditorStore();
  const { t } = useLanguageStore();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [assets, setAssets] = useState<VideoAsset[]>(() =>
    mediaAssets.map((a) => ({ ...a, id: String(a.id) }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAssets: VideoAsset[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: file.name,
      type: 'video',
      src: URL.createObjectURL(file), // This is the blob URL
      duration: '00:00', // Will be updated by VideoAssetPreview
      thumbnail: '',
    }));

    setAssets((prev) => [...newAssets, ...prev]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseDurationToSeconds = (duration: string) => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const addItemToCanvas = async (
    asset: VideoAsset,
    realDurationSec?: number,
    dimensions?: { width: number; height: number }
  ) => {
    if (!studio) return;

    const durationInSeconds =
      realDurationSec || parseDurationToSeconds(asset.duration);

    // Use real dimensions or fallback to 1920x1080 (horizontal default)
    const width = dimensions?.width || 1920;
    const height = dimensions?.height || 1080;

    try {
      // 1. Create and add placeholder immediately
      const placeholder = new Placeholder(
        asset.src,
        {
          width: width,
          height: height,
          duration: durationInSeconds * 1e6, // microseconds
        },
        'Video'
      );

      // Scale to fit and center in scene (1080x1920)
      await placeholder.scaleToFit(1080, 1920);
      placeholder.centerInScene(1080, 1920);

      await studio.addClip(placeholder);

      // 2. Load the real clip in the background
      VideoClip.fromUrl(asset.src)
        .then(async (videoClip) => {
          // 3. Replace all placeholders with this source once loaded
          await studio.timeline.replaceClipsBySource(
            asset.src,
            async (oldClip) => {
              const clone = await videoClip.clone();
              // Copy state from placeholder
              clone.id = oldClip.id;
              clone.left = oldClip.left;
              clone.top = oldClip.top;
              clone.width = oldClip.width;
              clone.height = oldClip.height;

              const realDuration = videoClip.meta.duration; // milliseconds from designcombo
              // Logic to preserve trim/cut if user edited it while loading (simplified here)
              const newTrim = { ...oldClip.trim };

              clone.display = { ...oldClip.display };
              clone.trim = newTrim; // logic to sync trim
              clone.duration = oldClip.duration;
              clone.zIndex = oldClip.zIndex;
              return clone;
            }
          );
        })
        .catch((err) => {
          console.error('Failed to load video in background:', err);
        });
    } catch (error) {
      console.error(`Failed to add video:`, error);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Upload Actions */}
      <div className="p-4 flex flex-col gap-3 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="video/*"
          onChange={handleUpload}
          multiple
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#3F3F3F] hover:bg-[#4F4F4F] text-white flex items-center gap-2 h-10 border-none shadow-none rounded-md"
        >
          <CloudUpload className="h-4 w-4" />
          <span>{t('media.upload')}</span>
        </Button>
      </div>

      {/* Promo Banner */}
      <div
        onClick={() => setIsAIModalOpen(true)}
        className="mx-4 mb-4 p-3 bg-linear-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-white/5 flex items-center gap-3 shrink-0 cursor-pointer hover:border-indigo-500/30 transition-colors"
      >
        <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center">
          <Plus className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-indigo-100">
            {t('media.create_ai')}
          </div>
          <div className="text-[10px] text-indigo-200/70">
            {t('media.generate_unique')}
          </div>
        </div>
      </div>

      <AIAssetsModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        title={t('modal.ai_assets')}
      />

      {/* Assets Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <VideoAssetPreview
              key={asset.id}
              asset={asset}
              onClick={addItemToCanvas}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
