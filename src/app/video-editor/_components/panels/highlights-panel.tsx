'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CloudUpload,
  Scissors,
  Sparkles,
  Plus,
  Loader2,
  Clock,
  Github,
  Linkedin,
  Mail,
  Bot,
} from 'lucide-react';
import { checkGeminiApiKey } from '@/app/actions/check-api-key';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguageStore } from '@/store/use-language-store';
import { useEditorStore } from '@/store/use-editor-store';
import { Video as VideoClip } from 'openvideo';

interface SuggestedClip {
  id: string;
  title: string;
  start: number;
  end: number;
  description: string;
}

interface HighlightCardProps {
  clip: SuggestedClip;
  thumbnail: string | null;
  onAdd: (clip: SuggestedClip) => void;
  isProcessing?: boolean;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function HighlightCard({
  clip,
  thumbnail,
  onAdd,
  isProcessing = false,
}: HighlightCardProps) {
  const { t } = useLanguageStore();

  return (
    <div className="group bg-[#222] border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all duration-300">
      <div className="relative aspect-video bg-black w-full overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white font-mono text-[10px] px-2 py-1 rounded-md border border-white/10 shadow-lg flex items-center gap-2">
          <span>
            {formatTime(clip.start)} - {formatTime(clip.end)}
          </span>
          <span className="text-indigo-400 font-bold border-l border-white/20 pl-2">
            {Math.round(clip.end - clip.start)}s
          </span>
        </div>
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4 bg-linear-to-b from-transparent to-black/20">
        <h4 className="text-[13px] font-bold text-white mb-1.5 leading-snug group-hover:text-indigo-300 transition-colors">
          {clip.title}
        </h4>
        <p className="text-[11px] text-white/50 leading-relaxed mb-4 line-clamp-2 italic font-medium">
          {clip.description}
        </p>

        <Button
          onClick={() => onAdd(clip)}
          disabled={isProcessing}
          size="sm"
          className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold border-none shadow-[0_4px_10px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50 transition-all rounded-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {t('highlights.add_to_timeline')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function HighlightsPanel() {
  const { t } = useLanguageStore();
  const { studio, currentTime } = useEditorStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [suggestedClips, setSuggestedClips] = useState<SuggestedClip[]>([]);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [targetDuration, setTargetDuration] = useState('30-60');

  useEffect(() => {
    const checkAccess = async () => {
      const configured = await checkGeminiApiKey();
      setHasKey(configured);
    };
    checkAccess();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setSuggestedClips([]);
    }
  };

  const generateBatchThumbnails = async (
    videoBlob: Blob,
    clips: SuggestedClip[]
  ) => {
    const url = URL.createObjectURL(videoBlob);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');

    const newThumbnails: Record<string, string> = {};

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    for (const clip of clips) {
      await new Promise((resolve) => {
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            newThumbnails[clip.id] = canvas.toDataURL('image/jpeg', 0.7);
          }
          resolve(null);
        };
        video.currentTime = clip.start;
      });
      setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
    }

    URL.revokeObjectURL(url);
    video.remove();
  };

  const processWithIA = async () => {
    if (!videoFile) return;

    setIsProcessing(true);
    setProgress(0);
    setSuggestedClips([]);
    setThumbnails({});
    setCurrentMessage(t('highlights.status_loading_tools'));

    try {
      const { uploadToGCS, getVideoDuration, cutVideoClip } = await import(
        '@/utils/ffmpeg-client'
      );

      const duration = await getVideoDuration(videoFile);
      const CHUNK_SIZE = 600; // 10 minutos
      const numChunks = Math.ceil(duration / CHUNK_SIZE);

      for (let i = 0; i < numChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, duration);

        const baseProgress = (i / numChunks) * 100;
        setProgress(baseProgress);

        let blobToUpload: Blob = videoFile;
        let fileNameToUpload = videoFile.name;

        if (numChunks > 1) {
          setCurrentMessage(
            `${t('highlights.status_trimming')} ${Math.floor(start / 60)} - ${Math.floor(end / 60)}...`
          );
          blobToUpload = await cutVideoClip(videoFile, start, end);
          fileNameToUpload = `chunk_${i}_${videoFile.name}`;
          setProgress(baseProgress + 5 / numChunks);
        }

        setCurrentMessage(
          `${t('highlights.status_uploading')} (${i + 1}/${numChunks})...`
        );
        const uploadResult = await uploadToGCS(blobToUpload, fileNameToUpload);
        setProgress(baseProgress + 10 / numChunks);

        setCurrentMessage(
          `${t('highlights.status_analyzing_range')} ${Math.floor(start / 60)} - ${Math.floor(end / 60)}...`
        );

        const response = await fetch('/api/ai/highlights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadResult.fileName,
            targetDuration,
          }),
        });

        if (!response.ok)
          throw new Error(
            `${t('highlights.status_error')} ${Math.floor(start / 60)}-${Math.floor(end / 60)}`
          );

        const reader = response.body?.getReader();
        if (!reader) continue;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.status === 'chunk_done' && data.clips) {
                const adjustedClips = data.clips.map((c: any) => ({
                  ...c,
                  start: c.start + start,
                  end: c.end + start,
                  id: Math.random().toString(36).substr(2, 9),
                }));
                setSuggestedClips((prev) => [...prev, ...adjustedClips]);
                generateBatchThumbnails(videoFile, adjustedClips);
              }
              if (
                data.status === 'processing' &&
                data.message.includes('429')
              ) {
                // Si es un mensaje de cuota del API, usamos nuestra traducción
                setCurrentMessage(
                  `${t('highlights.status_quota_wait')} 10s...`
                );
              }
            } catch (e) {}
          }
        }

        if (i < numChunks - 1) {
          setCurrentMessage(t('highlights.status_breathing'));
          await delay(15000);
        }
      }

      setCurrentMessage(t('highlights.status_complete'));
      setProgress(100);
      setIsProcessing(false);
    } catch (error: any) {
      console.error('Process Error:', error);
      setCurrentMessage(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const [processingClips, setProcessingClips] = useState<
    Record<string, boolean>
  >({});

  const addClipToTimeline = async (clip: SuggestedClip) => {
    if (!studio || !videoFile) return;

    setProcessingClips((prev) => ({ ...prev, [clip.id]: true }));

    try {
      const src = URL.createObjectURL(videoFile);
      const videoClip = await VideoClip.fromUrl(src);
      await videoClip.ready;

      const startMicro = Math.round(clip.start * 1e6);
      const endMicro = Math.round(clip.end * 1e6);
      const durationMicro = endMicro - startMicro;
      const currentTimeMicro = Math.round(currentTime * 1e6);

      videoClip.trim.from = startMicro;
      videoClip.trim.to = endMicro;
      videoClip.duration = durationMicro;

      videoClip.display.from = currentTimeMicro;
      videoClip.display.to = currentTimeMicro + durationMicro;

      await videoClip.scaleToFit(1080, 1920);
      videoClip.centerInScene(1080, 1920);

      await studio.addClip(videoClip);
    } catch (error) {
      console.error('Error adding clip:', error);
    } finally {
      setProcessingClips((prev) => ({ ...prev, [clip.id]: false }));
    }
  };

  const renderContent = () => {
    if (hasKey === null) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">
            {t('highlights.status_verifying')}
          </p>
        </div>
      );
    }

    if (hasKey === false) {
      return (
        <div className="flex flex-col items-center py-6 text-center space-y-6 h-full animate-in fade-in duration-500">
          <div className="space-y-3 px-4">
            <Bot className="w-12 h-12 text-indigo-400 mx-auto" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {t('highlights.demo_title')}
            </h3>
            <p className="text-xs text-white/40 leading-relaxed">
              {t('highlights.demo_description')}
            </p>
          </div>

          <div className="w-full space-y-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-base font-bold text-white shadow-xl ring-4 ring-white/5">
                PJ
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-white">
                  Pablito Jean Pool Silva Inca
                </h4>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">
                  Full Stack Developer
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {[
                  {
                    icon: Github,
                    href: 'https://github.com/Pablituuu',
                    title: 'GitHub',
                  },
                  {
                    icon: Linkedin,
                    href: 'https://www.linkedin.com/in/pablito-jean-pool-silva-inca-735a03192/',
                    title: 'LinkedIn',
                  },
                  {
                    icon: Mail,
                    href: 'mailto:pablito.silvainca@gmail.com',
                    title: 'Email',
                  },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 border border-white/5 shadow-sm"
                    title={social.title}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {!isProcessing && suggestedClips.length === 0 && (
          <div className="space-y-6">
            {!videoFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="video/*"
                  onChange={handleFileChange}
                />
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudUpload className="h-6 w-6 text-muted-foreground group-hover:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {t('highlights.upload_title')}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t('highlights.upload_subtitle')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Scissors className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-medium truncate">
                    {videoFile.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => setVideoFile(null)}
                >
                  {t('highlights.change_video')}
                </Button>
              </div>
            )}

            {videoFile && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {t('highlights.target_duration')}
                  </label>
                  <Select
                    value={targetDuration}
                    onValueChange={setTargetDuration}
                  >
                    <SelectTrigger className="w-full bg-black/20 border-white/5 h-9 text-xs">
                      <SelectValue
                        placeholder={t('highlights.target_duration')}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#222] border-white/10 text-white">
                      <SelectItem value="5-30">
                        {t('highlights.range_short')}
                      </SelectItem>
                      <SelectItem value="30-60">
                        {t('highlights.range_medium')}
                      </SelectItem>
                      <SelectItem value="60-180">
                        {t('highlights.range_long')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={processWithIA}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 h-10 shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{t('highlights.extract_btn')}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-white/80">
                {currentMessage}
              </p>
              <div className="w-56 h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 border border-white/5">
                <div
                  className="h-full bg-linear-to-r from-indigo-600 to-purple-600 transition-all duration-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-indigo-300/50 uppercase tracking-widest">
                {t('highlights.processing')} • {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        {suggestedClips.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('highlights.suggested')}
              </h3>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-bold">
                {suggestedClips.length} {t('highlights.clips_count')}
              </span>
            </div>

            <div className="space-y-3">
              {suggestedClips.map((clip) => (
                <HighlightCard
                  key={clip.id}
                  clip={clip}
                  thumbnail={thumbnails[clip.id] || null}
                  onAdd={addClipToTimeline}
                  isProcessing={processingClips[clip.id]}
                />
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs h-10 rounded-xl"
              onClick={() => suggestedClips.forEach(addClipToTimeline)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('highlights.add_all')}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="p-4 border-b border-border/50 bg-black/5">
        <h2 className="text-sm font-bold flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          {t('highlights.title')}
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1">
          {t('highlights.description')}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {renderContent()}
      </div>
    </div>
  );
}
