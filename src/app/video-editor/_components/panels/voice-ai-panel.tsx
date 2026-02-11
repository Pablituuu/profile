'use client';

import { useState, useRef } from 'react';
import {
  Mic,
  Sparkles,
  Type,
  Upload,
  Play,
  Volume2,
  Plus,
  Music,
  Loader2,
  Trash2,
  Settings2,
  Search,
  X,
  Bot,
  Github,
  Linkedin,
  Mail,
} from 'lucide-react';
import { useEffect } from 'react';
import { checkElevenLabsApiKey } from '@/app/actions/check-api-key';
import { useLanguageStore } from '@/store/use-language-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { Audio as AudioClip } from 'openvideo';
import { useEditorStore } from '@/store/use-editor-store';

const getVoices = (t: any) => [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: t('voice_ai.voice_desc_soft'),
    previewUrl: '#',
    tags: ['soft', 'suave', 'narración', 'calm', 'gentle'],
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    description: t('voice_ai.voice_desc_sarah'),
    previewUrl: '#',
    tags: ['professional', 'profesional', 'confident', 'confiada', 'corporate'],
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    description: t('voice_ai.voice_desc_charlie'),
    previewUrl: '#',
    tags: [
      'energetic',
      'enérgica',
      'hype',
      'animate',
      'cartoon',
      'fun',
      'alegre',
    ],
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    description: t('voice_ai.voice_desc_george'),
    previewUrl: '#',
    tags: [
      'storyteller',
      'narrador',
      'warm',
      'cálido',
      'slow',
      'pausado',
      'deep',
    ],
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    description: t('voice_ai.voice_desc_alice'),
    previewUrl: '#',
    tags: [
      'educational',
      'educativa',
      'informative',
      'informativa',
      'clear',
      'clara',
    ],
  },
  {
    id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    description: t('voice_ai.voice_desc_matilda'),
    previewUrl: '#',
    tags: [
      'serious',
      'seria',
      'professional',
      'profesional',
      'balanced',
      'equilibrada',
    ],
  },
  {
    id: 'bIHbv24MWmeRgasZH58o',
    name: 'Will',
    description: t('voice_ai.voice_desc_will'),
    previewUrl: '#',
    tags: [
      'chill',
      'relaxed',
      'relajado',
      'slow',
      'pausado',
      'optimist',
      'optimista',
    ],
  },
  {
    id: 'cjVigY5qzO86Huf0OWal',
    name: 'Eric',
    description: t('voice_ai.voice_desc_eric'),
    previewUrl: '#',
    tags: [
      'trustworthy',
      'confiable',
      'smooth',
      'smooth',
      'classy',
      'elegante',
    ],
  },
  {
    id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian',
    description: t('voice_ai.voice_desc_brian'),
    previewUrl: '#',
    tags: [
      'resonant',
      'resonante',
      'deep',
      'profunda',
      'comforting',
      'reconfortante',
    ],
  },
  {
    id: 'pqHfZKP75CvOlQylNhV4',
    name: 'Bill',
    description: t('voice_ai.voice_desc_bill'),
    previewUrl: '#',
    tags: ['wise', 'sabio', 'mature', 'madura', 'balanced', 'equilibrada'],
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    description: t('voice_ai.voice_desc_roger'),
    previewUrl: '#',
    tags: ['casual', 'classy', 'relajado', 'male'],
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    description: t('voice_ai.voice_desc_laura'),
    previewUrl: '#',
    tags: ['quirky', 'animate', 'animated', 'sassy', 'female', 'viva'],
  },
  {
    id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum',
    description: t('voice_ai.voice_desc_callum'),
    previewUrl: '#',
    tags: ['cartoon', 'animación', 'trickster', 'husky', 'male', 'personaje'],
  },
  {
    id: 'SAz9YHcvj6GT2YYXdXww',
    name: 'River',
    description: t('voice_ai.voice_desc_river'),
    previewUrl: '#',
    tags: ['neutral', 'calm', 'calmada', 'relaxed', 'male', 'narrative'],
  },
  {
    id: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry',
    description: t('voice_ai.voice_desc_harry'),
    previewUrl: '#',
    tags: ['cartoon', 'warrior', 'guerrero', 'rough', 'male', 'personaje'],
  },
  {
    id: 'TX3LPaxmHKxFdv7VOQHJ',
    name: 'Liam',
    description: t('voice_ai.voice_desc_liam'),
    previewUrl: '#',
    tags: ['energetic', 'creator', 'social media', 'enérgico', 'young', 'male'],
  },
  {
    id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica',
    description: t('voice_ai.voice_desc_jessica'),
    previewUrl: '#',
    tags: ['playful', 'bright', 'cute', 'animate', 'linda', 'female'],
  },
  {
    id: 'hpp4J3VqNfWAUOO0d1Us',
    name: 'Bella',
    description: t('voice_ai.voice_desc_bella'),
    previewUrl: '#',
    tags: ['professional', 'bright', 'clear', 'female'],
  },
  {
    id: 'iP95p4xoKVk53GoZ742B',
    name: 'Chris',
    description: t('voice_ai.voice_desc_chris'),
    previewUrl: '#',
    tags: ['casual', 'charming', 'charming', 'male'],
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    description: t('voice_ai.voice_desc_daniel'),
    previewUrl: '#',
    tags: ['broadcaster', 'formal', 'british', 'male'],
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    description: t('voice_ai.voice_desc_lily'),
    previewUrl: '#',
    tags: ['velvety', 'actress', 'actriz', 'female'],
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: t('voice_ai.voice_desc_adam'),
    previewUrl: '#',
    tags: ['dominant', 'firm', 'firme', 'male'],
  },
];

export function VoiceAIPanel() {
  const { t, language } = useLanguageStore();
  const { studio } = useEditorStore();
  const voices = getVoices(t);
  const [inputType, setInputType] = useState<'text' | 'audio'>('text');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voices[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'es'>(
    (language as 'en' | 'es') || 'en'
  );
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentPreview, setCurrentPreview] = useState<HTMLAudioElement | null>(
    null
  );

  useEffect(() => {
    const checkAccess = async () => {
      const configured = await checkElevenLabsApiKey();
      setHasAccess(configured);
    };
    checkAccess();
  }, []);
  const [generatedAudios, setGeneratedAudios] = useState<
    { id: string; url: string; name: string; timestamp: number }[]
  >([]);
  const [isPlayingGeneratedId, setIsPlayingGeneratedId] = useState<
    string | null
  >(null);

  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handlePreview = async (e: React.MouseEvent, voiceId: string) => {
    e.stopPropagation(); // Avoid selecting the voice when clicking play

    // If clicking the same one that is playing, stop it
    if (currentPreview && previewLoadingId === voiceId) {
      currentPreview.pause();
      setCurrentPreview(null);
      setPreviewLoadingId(null);
      return;
    }

    // Stop any current preview
    if (currentPreview) {
      currentPreview.pause();
    }

    setPreviewLoadingId(voiceId);
    try {
      const response = await fetch(
        `/api/ai/voice/preview?voiceId=${voiceId}&lang=${previewLanguage}`
      );
      const data = await response.json();

      if (data.preview_url) {
        const audio = new Audio(data.preview_url);
        audio.volume = volume / 100;
        setCurrentPreview(audio);
        audio.play();
        audio.onended = () => {
          setPreviewLoadingId(null);
          setCurrentPreview(null);
        };
      } else {
        const errorMsg = data.details || 'No hay vista previa disponible.';
        alert(`Error: ${errorMsg}`);
        setPreviewLoadingId(null);
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      alert(`Error de conexión: ${error.message}`);
      setPreviewLoadingId(null);
    }
  };

  const handleGenerate = async () => {
    if (!studio || isGenerating) return;
    if (inputType === 'text' && !text) return;
    if (inputType === 'audio' && !audioFile) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('type', inputType);
      formData.append('voiceId', selectedVoice);
      if (inputType === 'text') {
        formData.append('text', text);
      } else if (audioFile) {
        formData.append('audio', audioFile);
      }

      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice');
      }

      const data = await response.json();

      if (data.url) {
        const voiceName =
          voices.find((v) => v.id === selectedVoice)?.name || 'Voz';
        const newAudio = {
          id: Math.random().toString(36).substring(7),
          url: data.url,
          name: `${voiceName} - ${new Date().toLocaleTimeString()}`,
          timestamp: Date.now(),
        };
        setGeneratedAudios((prev) => [newAudio, ...prev]);
      }
    } catch (error) {
      console.error('[Voice AI] Error:', error);
      alert('Error generando la voz. Por favor verifica tu API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayGenerated = (id: string, url: string) => {
    if (currentPreview && isPlayingGeneratedId === id) {
      currentPreview.pause();
      setCurrentPreview(null);
      setIsPlayingGeneratedId(null);
      return;
    }

    if (currentPreview) {
      currentPreview.pause();
    }

    const audio = new Audio(url);
    audio.volume = volume / 100;
    setCurrentPreview(audio);
    setIsPlayingGeneratedId(id);
    audio.play();
    audio.onended = () => {
      setIsPlayingGeneratedId(null);
      setCurrentPreview(null);
    };
  };

  const handleAddToTimeline = async (url: string) => {
    if (!studio) return;
    try {
      const audioClip = await AudioClip.fromUrl(url);
      // @ts-ignore - openvideo clips handle volume/gain
      audioClip.volume = volume / 100;
      await studio.addClip(audioClip);
    } catch (error) {
      console.error('[Voice AI] Add to timeline error:', error);
      alert('Error al añadir a la línea de tiempo.');
    }
  };

  const handleDeleteGenerated = (id: string) => {
    setGeneratedAudios((prev) => prev.filter((a) => a.id !== id));
    if (isPlayingGeneratedId === id) {
      currentPreview?.pause();
      setCurrentPreview(null);
      setIsPlayingGeneratedId(null);
    }
  };

  const filteredVoices = voices.filter((voice) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      voice.name.toLowerCase().includes(query) ||
      voice.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/5">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2 text-white">
            <Mic className="h-4 w-4 text-brand-primary" />
            {t('menu.voice_ai')}
          </h2>
          <p className="text-[11px] text-white/40 mt-1">
            {t('voice_ai.description')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {hasAccess === null ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-50">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">
              {t('highlights.status_verifying')}
            </p>
          </div>
        ) : hasAccess === false ? (
          <div className="flex flex-col items-center py-6 text-center space-y-6 h-full animate-in fade-in duration-500">
            <div className="space-y-3 px-4">
              <Bot className="w-12 h-12 text-brand-primary mx-auto" />
              <h3 className="text-base font-bold text-white tracking-tight">
                {t('highlights.demo_title')}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {t('highlights.demo_description')}
              </p>
            </div>

            <div className="w-full space-y-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-brand-primary to-purple-500 flex items-center justify-center text-base font-bold text-white shadow-xl ring-4 ring-white/5">
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
        ) : (
          <div className="space-y-8 pb-10">
            {/* Global Volume Slider Section */}
            <section className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1">
                {t('voice_ai.volume')}
              </label>
              <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 group transition-all hover:bg-white/8">
                <div className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">
                      Potencia
                    </span>
                    <span className="text-[11px] font-black text-brand-primary tabular-nums">
                      {volume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-primary focus:outline-none"
                  />
                </div>
              </div>
            </section>
            {/* 1. Input Method Selector */}
            <section className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1">
                {t('voice_ai.input_method')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'text', label: t('voice_ai.tts'), icon: Type },
                  { id: 'audio', label: t('voice_ai.sts'), icon: Volume2 },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setInputType(type.id as any)}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-tight transition-all active:scale-95',
                      inputType === type.id
                        ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-primary shadow-lg shadow-brand-primary/10'
                        : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                    )}
                  >
                    <type.icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 2. Content Input */}
            <section className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-1">
                {inputType === 'text'
                  ? t('voice_ai.content_script')
                  : t('voice_ai.content_audio')}
              </label>

              {inputType === 'text' ? (
                <div className="relative group">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('voice_ai.placeholder_text')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:bg-white/8 transition-all min-h-[120px] resize-none"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-white/20">
                      {text.length} {t('voice_ai.characters')}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-white/10 group-focus-within:text-brand-primary group-focus-within:animate-pulse" />
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => audioInputRef.current?.click()}
                  className={cn(
                    'h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                    audioFile
                      ? 'border-brand-primary/40 bg-brand-primary/5'
                      : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10'
                  )}
                >
                  <input
                    type="file"
                    ref={audioInputRef}
                    className="hidden"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                  />
                  {audioFile ? (
                    <>
                      <Music className="w-5 h-5 text-brand-primary" />
                      <span className="text-[10px] font-bold text-white/70 truncate px-4 w-full text-center">
                        {audioFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-white/20" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {t('voice_ai.upload_audio')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* 3. Voice Selection */}
            <section className="space-y-4">
              <div className="flex flex-col gap-4 px-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    {t('voice_ai.select_voice')}
                  </label>

                  {/* Language Switch */}
                  <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/5">
                    <button
                      onClick={() => setPreviewLanguage('en')}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[8px] font-black transition-all',
                        previewLanguage === 'en'
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-white/30 hover:text-white/50'
                      )}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setPreviewLanguage('es')}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[8px] font-black transition-all',
                        previewLanguage === 'es'
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-white/30 hover:text-white/50'
                      )}
                    >
                      ES
                    </button>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('voice_ai.search_placeholder')}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-9 pr-9 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 focus:bg-white/10 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 text-white/20 hover:text-white transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {filteredVoices.map((voice) => (
                  <div
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={cn(
                      'relative group p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 flex flex-col gap-1',
                      selectedVoice === voice.id
                        ? 'bg-brand-primary/10 border-brand-primary/40'
                        : 'bg-white/2 border-white/5 hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[11px] font-bold',
                          selectedVoice === voice.id
                            ? 'text-brand-primary'
                            : 'text-white/80'
                        )}
                      >
                        {voice.name}
                      </span>
                      <button
                        onClick={(e) => handlePreview(e, voice.id)}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      >
                        {previewLoadingId === voice.id && !currentPreview ? (
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        ) : previewLoadingId === voice.id && currentPreview ? (
                          <div className="w-2.5 h-2.5 flex items-center justify-center">
                            <div className="w-1 h-3 bg-brand-primary animate-pulse mx-0.5" />
                            <div className="w-1 h-3 bg-brand-primary animate-pulse" />
                          </div>
                        ) : (
                          <Play className="w-2.5 h-2.5 fill-current" />
                        )}
                      </button>
                    </div>
                    <span className="text-[9px] text-white/30 font-medium">
                      {voice.description}
                    </span>
                    {selectedVoice === voice.id && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-brand-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Generate Button */}
            <div className="pt-2 pb-6">
              <Button
                disabled={
                  isGenerating || (inputType === 'text' ? !text : !audioFile)
                }
                onClick={handleGenerate}
                className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 active:scale-95 transition-all gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="text-xs">
                  {isGenerating
                    ? t('ai_assets.generating')
                    : t('voice_ai.generate')}
                </span>
              </Button>
            </div>

            {/* 4. Generated Results List */}
            {generatedAudios.length > 0 && (
              <section className="space-y-4 pb-8">
                <div className="flex items-center justify-between px-1 border-t border-white/5 pt-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    {t('voice_ai.generated_results')}
                  </label>
                  <span className="bg-brand-primary/20 text-brand-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {generatedAudios.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {generatedAudios.map((audio) => (
                    <div
                      key={audio.id}
                      className="bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <Music className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-white/80">
                            {audio.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGenerated(audio.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handlePlayGenerated(audio.id, audio.url)
                          }
                          className={cn(
                            'flex-1 h-9 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all gap-2',
                            isPlayingGeneratedId === audio.id
                              ? 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20'
                              : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                          )}
                        >
                          {isPlayingGeneratedId === audio.id ? (
                            <>
                              <div className="w-2.5 h-2.5 flex items-center justify-center gap-0.5">
                                <div className="w-0.5 h-2 bg-current animate-pulse" />
                                <div className="w-0.5 h-2 bg-current animate-pulse delay-75" />
                              </div>
                              {t('voice_ai.stop')}
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              {t('voice_ai.play')}
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleAddToTimeline(audio.url)}
                          className="flex-2 h-9 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-brand-primary/10 active:scale-95 transition-all gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t('voice_ai.add_to_timeline')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
