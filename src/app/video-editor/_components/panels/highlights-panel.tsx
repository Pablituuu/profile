'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CloudUpload,
  Scissors,
  Sparkles,
  Plus,
  Loader2,
  Clock,
  Link as LinkIcon,
  Youtube,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
  Bot,
  Lock,
} from 'lucide-react';
import { checkGeminiApiKey } from '@/app/actions/check-api-key';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  videoUrl: string | null;
  onAdd: (clip: SuggestedClip) => void;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HighlightCard({ clip, videoUrl, onAdd }: HighlightCardProps) {
  const { t } = useLanguageStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnail, setThumbnail] = useState<string>('');

  useEffect(() => {
    if (!videoUrl || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    video.src = videoUrl;
    video.currentTime = clip.start;

    const handleSeeked = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 320;
        canvas.height = 180;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setThumbnail(dataUrl);
        } catch (e) {
          console.warn('Error generating thumbnail:', e);
        }
      }
    };

    video.addEventListener('seeked', handleSeeked);
    return () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeAttribute('src');
      video.load();
    };
  }, [videoUrl, clip.start]);

  return (
    <div className="group bg-[#222] border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all duration-300">
      <video
        ref={videoRef}
        className="hidden"
        crossOrigin="anonymous"
        muted
        preload="auto"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview Area */}
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

      {/* Content Area */}
      <div className="p-4 bg-linear-to-b from-transparent to-black/20">
        <h4 className="text-[13px] font-bold text-white mb-1.5 leading-snug group-hover:text-indigo-300 transition-colors">
          {clip.title}
        </h4>
        <p className="text-[11px] text-white/50 leading-relaxed mb-4 line-clamp-2 italic font-medium">
          {clip.description}
        </p>

        <Button
          onClick={() => onAdd(clip)}
          size="sm"
          className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold border-none shadow-[0_4px_10px_rgba(79,70,229,0.3)] hover:shadow-indigo-500/50 transition-all rounded-lg active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('highlights.add_to_timeline')}
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
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [suggestedClips, setSuggestedClips] = useState<SuggestedClip[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeMethod, setActiveMethod] = useState<'upload' | 'url'>('upload');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check API Key on mount
  useEffect(() => {
    checkGeminiApiKey().then((configured) => {
      setHasKey(configured);
    });
  }, []);

  // Manage video URL creation/cleanup
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [videoFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setSuggestedClips([]);
    }
  };

  /* New state for streaming performance */
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [processedChunks, setProcessedChunks] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [targetDuration, setTargetDuration] = useState('30-60');

  const processWithIA = async () => {
    if (activeMethod === 'upload' && !videoFile) return;
    if (activeMethod === 'url' && !youtubeUrl) return;

    setIsProcessing(true);
    setProgress(0);
    setSuggestedClips([]);
    setProcessedChunks(0);
    setTotalChunks(0);
    setCurrentMessage(t('highlights.status_init'));

    try {
      const formData = new FormData();
      if (activeMethod === 'upload' && videoFile) {
        formData.append('video', videoFile);
      } else {
        formData.append('youtubeUrl', youtubeUrl);
      }
      formData.append('targetDuration', targetDuration);

      const response = await fetch('/api/ai/highlights', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error en la conexión con el servidor');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta del servidor');

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

            switch (data.status) {
              case 'upload_complete':
                setCurrentMessage(t('highlights.status_init'));
                setProgress(10);
                if (data.videoUrl) setVideoUrl(data.videoUrl);
                break;
              case 'processing':
                setTotalChunks(data.totalChunks);
                setCurrentMessage(
                  `${t('highlights.status_split')} (${data.totalChunks})`
                );
                break;
              case 'chunk_optimizing':
                setCurrentMessage(
                  `${t('highlights.status_optimizing')} ${data.chunkIndex + 1}/${data.totalChunks}`
                );
                setProcessedChunks(data.chunkIndex);
                break;
              case 'chunk_uploading':
                setCurrentMessage(
                  `${t('highlights.status_uploading')} ${data.chunkIndex + 1}/${totalChunks}`
                );
                break;
              case 'chunk_analyzing':
                setCurrentMessage(
                  `${t('highlights.status_analyzing')} ${data.chunkIndex + 1}/${totalChunks}`
                );
                break;
              case 'chunk_done':
                if (data.clips) {
                  setSuggestedClips((prev) => [...prev, ...data.clips]);
                }
                // Use data.totalChunks if available, otherwise fallback to state
                const total = data.totalChunks || totalChunks || 1;
                const newProgress = Math.min(
                  10 + ((data.chunkIndex + 1) / total) * 85,
                  95
                );
                setProgress(newProgress);
                break;
              case 'all_done':
                setCurrentMessage(t('highlights.status_complete'));
                setProgress(100);
                setIsProcessing(false);
                break;
              case 'error':
                throw new Error(data.message);
            }
          } catch (e) {
            console.warn('Error parsing stream line:', e);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to analyze video:', error);
      setCurrentMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const addClipToTimeline = async (clip: SuggestedClip) => {
    if (!studio || !videoFile) return;

    // Use existing videoUrl if available, else create temp (though videoUrl should exist if videoFile exists)
    const src = videoUrl || URL.createObjectURL(videoFile);

    try {
      const videoClip = await VideoClip.fromUrl(src);

      await videoClip.ready;

      // Configurar los tiempos de recorte (trim) y duración en el timeline (display)
      // Los tiempos de la API vienen en segundos, OpenVideo usa microsegundos
      const startMicro = clip.start * 1e6;
      const endMicro = clip.end * 1e6;
      const durationMicro = endMicro - startMicro;

      videoClip.trim.from = startMicro;
      videoClip.trim.to = endMicro;

      // La duración del objeto en el timeline debe coincidir con el recorte
      videoClip.duration = durationMicro;
      videoClip.display.to = durationMicro;
      videoClip.display.from = currentTime;

      // Escalar para ajustar al lienzo (asumiendo formato Shorts 1080x1920)
      // Idealmente deberíamos obtener las dimensiones del proyecto del store o studio
      await videoClip.scaleToFit(1080, 1920);
      videoClip.centerInScene(1080, 1920);

      await studio.addClip(videoClip);
    } catch (error) {
      console.error('Error adding highlight clip:', error);
    }
  };

  const renderContent = () => {
    if (hasKey === false) {
      return (
        <div className="flex flex-col items-center py-6 text-center space-y-6 h-full animate-in fade-in duration-500">
          {/* Lock Icon & Title */}
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
              <Lock className="w-6 h-6 text-indigo-400 relative z-10" />
            </div>
            <div className="space-y-1 px-4">
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('highlights.demo_title')}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {t('highlights.demo_description')}
              </p>
            </div>
          </div>

          {/* Profile Section */}
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
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95 border border-white/5 hover:border-white/10 shadow-sm"
                    title={social.title}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/51922323921"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all group/btn hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-green-200 font-semibold">
                    +51 922 323 921
                  </span>
                </div>
                <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-md group-hover/btn:bg-green-500/30 transition-colors font-bold uppercase tracking-wider">
                  WhatsApp
                </span>
              </a>

              <a
                href="mailto:pablito.silvainca@gmail.com"
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/btn hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-white/70">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-white/70 font-semibold">
                    Request Demo
                  </span>
                </div>
                <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-md group-hover/btn:bg-white/10 transition-colors font-bold uppercase tracking-wider">
                  Email
                </span>
              </a>
            </div>
          </div>

          {/* Overview Section */}
          <div className="space-y-4 w-full pt-4">
            <div className="flex items-center justify-center gap-3 opacity-30">
              <div className="h-px bg-white/50 flex-1" />
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50">
                {t('highlights.overview')}
              </span>
              <div className="h-px bg-white/50 flex-1" />
            </div>

            <div className="w-full bg-white/5 rounded-2xl border border-white/5 p-4 text-left space-y-3">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">
                {t('highlights.current_features')}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  t('updates.ai_highlights'),
                  'YouTube Link Extraction',
                  'Dynamic Overlap Analysis',
                  t('highlights.target_duration'),
                  t('updates.i18n'),
                ].map((feat) => (
                  <div
                    key={feat}
                    className="text-xs text-white/60 flex items-center gap-2.5 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400 group-hover:scale-125 transition-all" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Method Toggle */}
        {!isProcessing && suggestedClips.length === 0 && (
          <div className="flex bg-[#111] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveMethod('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-bold transition-all ${
                activeMethod === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <CloudUpload className="h-4 w-4" />
              {t('media.upload')}
            </button>
            <button
              onClick={() => setActiveMethod('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[11px] font-bold transition-all ${
                activeMethod === 'url'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Youtube className="h-4 w-4" />
              YouTube
            </button>
          </div>
        )}

        {/* Input Area (Upload or URL) */}
        {!isProcessing && suggestedClips.length === 0 && (
          <div className="space-y-6">
            {activeMethod === 'upload' ? (
              !videoFile ? (
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
                <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between animate-in fade-in duration-300">
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
              )
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <LinkIcon className="h-3 w-3" />
                    {t('highlights.url_label')}
                  </label>
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder={t('highlights.url_placeholder')}
                    className="bg-black/20 border-white/5 text-xs h-10 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Common Options and Process Button */}
            {(videoFile || (activeMethod === 'url' && youtubeUrl)) && (
              <div className="space-y-4 animate-in fade-in duration-300">
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
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 h-10 border-none shadow-lg shadow-indigo-600/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{t('highlights.extract_btn')}</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="relative">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-indigo-200 animate-pulse">
                {currentMessage}
              </p>
              <p className="text-[10px] text-indigo-200/50">
                {progress > 90
                  ? t('highlights.status_finalizing')
                  : t('highlights.status_wait')}
              </p>
            </div>

            <div className="w-56 h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 border border-white/5">
              <div
                className="h-full bg-linear-to-r from-indigo-600 to-violet-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-indigo-300/50">
              {Math.round(progress)}%
            </span>
          </div>
        )}

        {/* Results List */}
        {suggestedClips.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('highlights.suggested')}
              </h3>
              <div className="flex items-center gap-2">
                {(videoFile || youtubeUrl) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[9px] text-white/40 hover:text-white"
                    onClick={() => {
                      setSuggestedClips([]);
                      setVideoFile(null);
                      setYoutubeUrl('');
                    }}
                  >
                    {t('highlights.change_video')}
                  </Button>
                )}
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {suggestedClips.length} {t('highlights.clips_count')}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {suggestedClips.map((clip) => (
                <HighlightCard
                  key={clip.id}
                  clip={clip}
                  videoUrl={videoUrl}
                  onAdd={addClipToTimeline}
                />
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs h-10"
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
      <div className="p-4 border-b border-border/50">
        <h2 className="text-sm font-bold flex items-center gap-2">
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
