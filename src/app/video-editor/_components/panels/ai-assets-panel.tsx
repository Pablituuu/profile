'use client';

import { useState, useRef, useEffect } from 'react';
import {
  CloudUpload,
  Sparkles,
  Plus,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  Trash2,
  RefreshCw,
  Send,
  Clock,
  Palette,
  X,
  Lock,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { checkGeminiApiKey } from '@/app/actions/check-api-key';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguageStore } from '@/store/use-language-store';
import { useEditorStore } from '@/store/use-editor-store';
import { cn } from '@/lib/utils';
import { Image as ImageClip, Video as VideoClip, Placeholder } from 'openvideo';

interface Asset {
  id: string;
  url: string; // Local preview or GCS read URL
  data?: string; // base64 (main for images)
  gcsUrl?: string; // GCS persistent URL
  type: 'image' | 'video';
  name: string;
  contentType: string;
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const STYLES = [
  { id: 'realistic', labelKey: 'ai_assets.style_realistic' },
  { id: 'scientific_glow', labelKey: 'ai_assets.style_scientific_glow' },
  { id: 'manga', labelKey: 'ai_assets.style_manga' },
  { id: 'cinematic', labelKey: 'ai_assets.style_cinematic' },
  { id: '3d', labelKey: 'ai_assets.style_3d' },
  { id: 'cyberpunk', labelKey: 'ai_assets.style_cyberpunk' },
  { id: 'cartoon', labelKey: 'ai_assets.style_cartoon' },
  { id: 'pixel', labelKey: 'ai_assets.style_pixel' },
  { id: 'watercolor', labelKey: 'ai_assets.style_watercolor' },
  { id: 'oil', labelKey: 'ai_assets.style_oil' },
  { id: 'sketch', labelKey: 'ai_assets.style_sketch' },
  { id: 'vintage', labelKey: 'ai_assets.style_vintage' },
];

const RATIOS = [
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '1:1', label: '1:1' },
];

const QUALITIES = [
  { id: 'standard', label: 'SD' },
  { id: 'high', label: 'HD' },
  { id: 'hd', label: '4K' },
];

export function AIAssetsPanel() {
  const { t } = useLanguageStore();
  const { studio, currentTime } = useEditorStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<Asset[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(1); // 1, 3, 5 minutes
  const [selectedStyle, setSelectedStyle] = useState<string>('realistic');
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [quality, setQuality] = useState<string>('standard');
  const [generationType, setGenerationType] = useState<'image' | 'video'>(
    'image'
  );
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-reset aspect ratio & Clear invalid assets when switching modes
  useEffect(() => {
    if (generationType === 'video' && aspectRatio === '1:1') {
      setAspectRatio('16:9');
    }

    if (generationType === 'image') {
      setSelectedAssets((prev) => prev.filter((a) => a.type === 'image'));
    }
  }, [generationType, aspectRatio]);

  // Check API Key on mount
  useEffect(() => {
    const checkAccess = async () => {
      const configured = await checkGeminiApiKey();
      setHasKey(configured);
    };
    checkAccess();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const remainingSlots = 4 - selectedAssets.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      const newAssets: Asset[] = await Promise.all(
        filesToProcess.map(async (file) => {
          const isVideo = file.type.startsWith('video/');
          let base64 = '';
          let gcsUrl = '';

          if (!isVideo) {
            base64 = await readFileAsBase64(file);
          } else {
            try {
              const presignedRes = await fetch('/api/storage/presigned-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName: file.name,
                  contentType: file.type,
                }),
              });

              if (presignedRes.ok) {
                const { uploadUrl, readUrl } = await presignedRes.json();

                await fetch(uploadUrl, {
                  method: 'PUT',
                  body: file,
                  headers: { 'Content-Type': file.type },
                });

                gcsUrl = readUrl;
              }
            } catch (err) {
              console.error('GCS Upload failed for video:', err);
            }
          }

          return {
            id: Math.random().toString(36).substring(7),
            url: URL.createObjectURL(file), // Local preview
            data: base64 || undefined,
            gcsUrl: gcsUrl || undefined,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            name: file.name,
            contentType: file.type,
          };
        })
      );

      setSelectedAssets((prev) => [...prev, ...newAssets]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAsset = (id: string) => {
    setSelectedAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const generateContent = async (targetType: 'image' | 'video') => {
    if (selectedAssets.length === 0 && !prompt) return;

    setIsGenerating(true);
    try {
      const endpoint =
        targetType === 'image' ? '/api/google/image' : '/api/google/video';

      const mediaReferences = selectedAssets
        .filter((a) => a.data || a.gcsUrl)
        .map((a) => ({
          inlineData: a.data
            ? {
                data: a.data,
                mimeType: a.contentType,
              }
            : undefined,
          fileUri: a.gcsUrl || undefined,
          mimeType: a.contentType,
        }));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            prompt || 'Generate a professional asset based on the references',
          media: mediaReferences,
          visualStyle: selectedStyle,
          aspectRatio: aspectRatio,
          quality: quality === 'hd' ? 'H' : quality === 'high' ? 'High' : 'S',
          duration: videoDuration,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();

      const newAsset: Asset = {
        id: Math.random().toString(36).substring(7),
        url: data.url,
        type: targetType,
        name: `AI ${targetType === 'image' ? 'Image' : 'Video'}`,
        contentType: targetType === 'image' ? 'image/jpeg' : 'video/mp4',
      };

      setGeneratedAssets((prev) => [newAsset, ...prev]);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addToProject = async (asset: Asset) => {
    if (!studio) return;

    try {
      let clip;
      if (asset.type === 'image') {
        clip = await ImageClip.fromUrl(asset.url);
        clip.duration = 5 * 1e6; // 5 seconds
      } else {
        clip = new Placeholder(
          asset.url,
          { width: 1920, height: 1080, duration: 5 * 1e6 },
          'Video'
        );

        VideoClip.fromUrl(asset.url).then(async (realVideo) => {
          await studio.timeline.replaceClipsBySource(asset.url, async (old) => {
            const clone = await realVideo.clone();
            clone.id = old.id;
            clone.display = { ...old.display };
            return clone;
          });
        });
      }

      await clip.scaleToFit(1080, 1920);
      clip.centerInScene(1080, 1920);
      clip.display.from = currentTime;
      clip.display.to = currentTime + clip.duration;

      await studio.addClip(clip);
    } catch (error) {
      console.error('Failed to add to project:', error);
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
                  t('updates.ai_features'),
                  t('ai_assets.type_image') + ' & ' + t('ai_assets.type_video'),
                  t('ai_assets.style'),
                  t('ai_assets.aspect_ratio'),
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
      <div className="flex-1 overflow-y-auto scrollbar-none space-y-6">
        {/* Source Selection Area */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                {t('ai_assets.select_source')}
              </label>
              <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded-md font-bold">
                {selectedAssets.length}/4
              </span>
            </div>
            {selectedAssets.length > 0 && (
              <button
                onClick={() => setSelectedAssets([])}
                className="text-[10px] text-red-400/60 hover:text-red-400 font-bold uppercase tracking-tight transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {selectedAssets.map((asset) => (
              <div
                key={asset.id}
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group shadow-lg"
              >
                {asset.type === 'image' ? (
                  <img src={asset.url} className="w-full h-full object-cover" />
                ) : (
                  <video
                    src={asset.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                  />
                )}
                <button
                  onClick={() => removeAsset(asset.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/60 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {selectedAssets.length < 4 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative aspect-video border-2 border-dashed border-white/5 rounded-2xl bg-white/2 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group overflow-hidden',
                  selectedAssets.length === 0 && 'col-span-2'
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept={
                    generationType === 'image' ? 'image/*' : 'image/*,video/*'
                  }
                  onChange={handleFileUpload}
                  multiple
                />
                <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg">
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5 text-white/20 group-hover:text-indigo-400 transition-colors" />
                  )}
                </div>
                {selectedAssets.length === 0 && (
                  <p className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-widest">
                    {isUploading ? 'Uploading...' : 'Añadir archivos'}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Content Type Selector */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-3.5 h-3.5 text-white/20" />
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              {t('ai_assets.type')}
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: 'image',
                label: t('ai_assets.type_image'),
                icon: ImageIcon,
              },
              {
                id: 'video',
                label: t('ai_assets.type_video'),
                icon: VideoIcon,
              },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setGenerationType(type.id as 'image' | 'video')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95',
                  generationType === type.id
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                )}
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Palette className="w-3.5 h-3.5 text-white/20" />
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              {t('ai_assets.style')}
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={cn(
                  'px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95',
                  selectedStyle === style.id
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                )}
              >
                {t(style.labelKey as any)}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1">
              {t('ai_assets.aspect_ratio')}
            </label>
            <div className="flex gap-2">
              {RATIOS.filter((r) => {
                if (generationType === 'video' && r.id === '1:1') return false;
                return true;
              }).map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-[10px] font-bold transition-all active:scale-95',
                    aspectRatio === ratio.id
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                  )}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1">
              {t('ai_assets.quality')}
            </label>
            <div className="flex gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setQuality(q.id)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95',
                    quality === q.id
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                  )}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1">
            PROMPT (OPCIONAL)
          </label>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                selectedStyle === 'scientific_glow'
                  ? 'Ej: Internal view of glowing cyan nervous system inside the face and neck, golden pulses of energy moving through veins, skin is semi-transparent and glowing from within, cinematic volumetric lighting, hyper-realistic anatomy.'
                  : 'Describe lo que quieres generar...'
              }
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:bg-white/8 transition-all min-h-[90px] resize-none"
            />
            <Sparkles className="absolute bottom-4 right-4 w-4 h-4 text-white/10 group-focus-within:text-indigo-400 group-focus-within:animate-pulse transition-colors" />
          </div>
        </section>

        {generationType === 'video' && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-3.5 h-3.5 text-white/20" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                {t('ai_assets.video_duration')}
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5].map((min) => (
                <button
                  key={min}
                  onClick={() => setVideoDuration(min)}
                  className={cn(
                    'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95',
                    videoDuration === min
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                  )}
                >
                  <span className="text-xs font-bold">{min}m</span>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                    MIN
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2 pt-2 pb-4">
          <Button
            disabled={isGenerating || (selectedAssets.length === 0 && !prompt)}
            onClick={() => generateContent(generationType)}
            className={cn(
              'w-full h-11 rounded-2xl gap-2 font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all',
              generationType === 'image'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
            )}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : generationType === 'image' ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <VideoIcon className="w-4 h-4" />
            )}
            <span className="text-xs">
              {isGenerating
                ? t('ai_assets.generating')
                : t('ai_assets.generate_btn')}
            </span>
          </Button>
        </section>

        {generatedAssets.length > 0 && (
          <section className="space-y-4 pt-6 mt-6 border-t border-white/5 px-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                RESULTADOS RECIENTES
              </h3>
              <div className="h-px bg-white/10 flex-1 ml-4" />
            </div>

            <div className="grid grid-cols-1 gap-4 pb-4">
              {generatedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative rounded-3xl overflow-hidden border border-white/5 bg-white/2 p-2 transition-all hover:bg-white/4 hover:border-white/10 shadow-xl"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                    {asset.type === 'image' ? (
                      <img
                        src={asset.url}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <video
                        src={asset.url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                      />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
                      <Button
                        onClick={() => addToProject(asset)}
                        className="bg-white text-black hover:bg-white/90 w-full gap-2 h-10 rounded-xl font-bold text-xs shadow-2xl active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-tight">
                          {t('ai_assets.add_to_project')}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 px-2 pb-1 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white/70 truncate max-w-[200px]">
                        {asset.name}
                      </span>
                      <span className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-0.5">
                        {asset.type === 'image'
                          ? 'Generated Image'
                          : 'Generated Video'}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                      {asset.type === 'image' ? (
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <VideoIcon className="w-3.5 h-3.5 text-purple-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="p-4 border-b border-white/5">
        <h2 className="text-sm font-bold flex items-center gap-2 text-white">
          <Wand2 className="h-4 w-4 text-indigo-400" />
          {t('ai_assets.title')}
        </h2>
        <p className="text-[11px] text-white/40 mt-1">
          {t('ai_assets.description')}
        </p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
        {renderContent()}
      </div>
    </div>
  );
}
