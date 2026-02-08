"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Languages,
  Loader2,
  Sparkles,
  MessageSquare,
  Video,
  AlertCircle,
  Plus,
  Settings2,
  Check,
  Copy,
  Zap,
  ArrowLeft,
  Trash2,
  Play,
  Lock,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
} from "lucide-react";
import { checkDeepgramApiKey } from "@/app/actions/check-api-key";
import { useLanguageStore } from "@/store/use-language-store";
import { useEditorStore } from "@/store/use-editor-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { VideoClipTimeline as VideoClipTimelineClass } from "@/app/video-editor/_lib/timeline/video-clip";
import { fontManager, jsonToClip, Log } from "openvideo";
import { cloneDeep } from "lodash";
import { createPortal } from "react-dom";

const LANGUAGES = [
  { code: "auto", label: "Auto Detect", icon: Sparkles },
  { code: "es", label: "Spanish", icon: "🇪🇸" },
  { code: "en", label: "English", icon: "🇺🇸" },
  { code: "pt", label: "Portuguese", icon: "🇧🇷" },
  { code: "fr", label: "French", icon: "🇫🇷" },
];

export function CaptionsPanel() {
  const { t } = useLanguageStore();
  const { timeline, studio } = useEditorStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [videoClips, setVideoClips] = useState<any[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [transcription, setTranscription] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"setup" | "list">("setup");
  const [captionItems, setCaptionItems] = useState<any[]>([]);
  const [activeCaptionId, setActiveCaptionId] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const captionItemsRef = useRef<any[]>([]);
  const activeCaptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    checkDeepgramApiKey().then((configured) => {
      setHasKey(configured);
    });
  }, []);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    captionItemsRef.current = captionItems;
  }, [captionItems]);

  const updateCaptionItems = useCallback(() => {
    if (!studio) return;
    const tracks = studio.getTracks();
    const allClips: any[] = [];
    tracks.forEach((track) => {
      track.clipIds.forEach((id) => {
        const clip = studio.getClipById(id);
        if (clip) allClips.push(clip);
      });
    });

    const captions = allClips.filter((clip) => clip.type === "Caption");
    const sorted = captions.sort((a, b) => a.display.from - b.display.from);
    setCaptionItems(sorted);
  }, [studio]);

  const handleTimeUpdate = useCallback(
    ({ currentTime }: { currentTime: number }) => {
      const activeItem = captionItemsRef.current.find(
        (item) =>
          currentTime >= item.display.from && currentTime < item.display.to,
      );
      const newActiveId = activeItem ? activeItem.id : null;
      if (newActiveId !== activeCaptionIdRef.current) {
        setActiveCaptionId(newActiveId);
        activeCaptionIdRef.current = newActiveId;
      }
    },
    [],
  );

  useEffect(() => {
    if (!timeline) return;
    const updateClips = () => {
      const clips = (timeline as any).getClips();
      const videos = clips.filter(
        (clip: any) =>
          clip instanceof VideoClipTimelineClass ||
          clip.type === "VideoClip" ||
          clip.type === "video",
      );
      setVideoClips(videos);
    };

    updateClips();
    updateCaptionItems();

    timeline.on("object:added", updateClips);
    timeline.on("object:removed", updateClips);
    timeline.on("object:modified", updateClips);

    studio?.on("clip:added", updateCaptionItems);
    studio?.on("clip:removed", updateCaptionItems);
    studio?.on("clip:updated", updateCaptionItems);
    studio?.on("currentTime", handleTimeUpdate);

    return () => {
      timeline.off("object:added", updateClips);
      timeline.off("object:removed", updateClips);
      timeline.off("object:modified", updateClips);
      studio?.off("clip:added", updateCaptionItems);
      studio?.off("clip:removed", updateCaptionItems);
      studio?.off("clip:updated", updateCaptionItems);
      studio?.off("currentTime", handleTimeUpdate);
    };
  }, [timeline, studio, updateCaptionItems, handleTimeUpdate]);

  const generateCaptions = async () => {
    const clip = videoClips.find((c) => (c.clipId || c.id) === selectedClipId);
    if (!clip || !clip.src) return;

    setIsProcessing(true);
    setTranscription(null);
    try {
      const body = new FormData();
      const response = await fetch(clip.src);
      const blob = await response.blob();
      body.append("video", blob, "video.mp4");
      body.append("language", selectedLanguage);

      const apiResponse = await fetch("/api/ai/captions", {
        method: "POST",
        body,
      });

      const data = await apiResponse.json();
      if (data.error) {
        if (data.error.includes("does not have an audio track")) {
          throw new Error(t("captions.no_audio_error"));
        }
        throw new Error(data.error);
      }
      setTranscription(data);
      setTimeout(() => handleBurnToTimeline(data), 100);
    } catch (error: any) {
      setErrorToast(error.message || t("updates.ai_stability_desc"));
    } finally {
      setIsProcessing(false);
    }
  };

  const groupWordsByWidth = (
    words: any[],
    maxWidth: number = 800,
    fontSize: number = 80,
    fontFamily: string = "Bangers-Regular",
    fontWeight: string = "900",
  ): any[] => {
    if (!words || words.length === 0) return [];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

    const captions: any[] = [];
    let currentWords: any[] = [];
    let currentText = "";
    let currentWidth = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordText = word.word || word.text || "";
      const testText = currentText ? `${currentText} ${wordText}` : wordText;
      const testWidth = ctx.measureText(testText).width;

      if (testWidth > maxWidth && currentWords.length > 0) {
        const firstWord = currentWords[0];
        const lastWord = currentWords[currentWords.length - 1];
        const metrics = ctx.measureText("AaFfLMZpPqQ");
        const textHeight =
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        captions.push({
          text: currentText,
          width: currentWidth,
          height: textHeight || fontSize,
          words: currentWords.map((w, idx) => ({
            text: w.word || w.text || "",
            from: idx === 0 ? 0 : (w.start - firstWord.start) * 1000,
            to: (w.end - firstWord.start) * 1000,
            isKeyWord: idx === 0 || idx === currentWords.length - 1,
            paragraphIndex: w.paragraphIndex ?? "",
          })),
          from: firstWord.start,
          to: lastWord.end,
        });
        currentWords = [word];
        currentText = wordText;
        currentWidth = ctx.measureText(wordText).width;
      } else {
        currentWords.push(word);
        currentText = testText;
        currentWidth = testWidth;
      }
    }

    if (currentWords.length > 0) {
      const firstWord = currentWords[0];
      const lastWord = currentWords[currentWords.length - 1];
      const metrics = ctx.measureText("AaFfLMZpPqQ");
      const textHeight =
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      captions.push({
        text: currentText,
        width: currentWidth,
        height: textHeight || fontSize,
        words: currentWords.map((w, idx) => ({
          text: w.word || w.text || "",
          from: idx === 0 ? 0 : (w.start - firstWord.start) * 1000,
          to: (w.end - firstWord.start) * 1000,
          isKeyWord: idx === 0 || idx === currentWords.length - 1,
          paragraphIndex: w.paragraphIndex ?? "",
        })),
        from: firstWord.start,
        to: lastWord.end,
      });
    }
    return captions;
  };

  const handleBurnToTimeline = async (customTranscription?: any) => {
    const activeTranscription = customTranscription || transcription;
    if (!studio || !activeTranscription || !selectedClipId) return;

    setIsBurning(true);
    try {
      const clip = videoClips.find(
        (c) => (c.clipId || c.id) === selectedClipId,
      );
      if (!clip) return;

      const videoWidth = (studio as any).opts?.width || 1080;
      const videoHeight = (studio as any).opts?.height || 1920;
      const fontSize = 80;
      const fontFamily = "Bangers-Regular";
      const fontUrl =
        "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf";

      await fontManager.addFont({ name: fontFamily, url: fontUrl });

      const words =
        activeTranscription.results?.channels[0]?.alternatives[0]?.words || [];
      const captionChunks = groupWordsByWidth(
        words,
        videoWidth * 0.8,
        fontSize,
        fontFamily,
        "900",
      );

      const clipsToAdd: any[] = [];
      const captionTrackId = `track_captions_${Date.now()}`;
      const timelineStartUs = clip.startUs || 0;

      for (const chunk of captionChunks) {
        const fromUs = chunk.from * 1e6 + timelineStartUs;
        const toUs = chunk.to * 1e6 + timelineStartUs;
        const durationUs = toUs - fromUs;
        const captionWidth = Math.ceil(chunk.width) + 150;
        const captionHeight = Math.ceil(chunk.height) + 20;

        const json = {
          type: "Caption",
          src: "",
          display: { from: fromUs, to: toUs },
          playbackRate: 1,
          duration: durationUs,
          left: (videoWidth - captionWidth) / 2,
          top: videoHeight - captionHeight - 40,
          width: captionWidth,
          height: captionHeight,
          angle: 0,
          zIndex: 1000,
          opacity: 1,
          flip: null,
          text: chunk.text,
          mediaId: clip.clipId || clip.id,
          style: {
            fontSize,
            fontFamily,
            fontWeight: "900",
            color: "#FFFF00",
            align: "center",
            fontUrl,
            stroke: { color: "#000000", width: 8 },
            shadow: {
              color: "#000000",
              alpha: 0.8,
              blur: 10,
              distance: 4,
              angle: Math.PI / 4,
            },
          },
          caption: {
            words: chunk.words,
            colors: {
              appeared: "#FFFFFF",
              active: "#FFFFFF",
              activeFill: "#FF0000",
              background: "",
              keyword: "#FFFFFF",
            },
            preserveKeywordColor: true,
            positioning: { videoWidth, videoHeight },
          },
          wordsPerLine: "multiple",
        };
        const captionClip = await jsonToClip(json as any);
        clipsToAdd.push(captionClip);
      }

      if (clipsToAdd.length > 0) {
        await studio.addClip(clipsToAdd, { trackId: captionTrackId });
        updateCaptionItems();
        setTranscription(null);
        setView("list");
      }
    } catch (error) {
      console.error("Burn error:", error);
    } finally {
      setIsBurning(false);
    }
  };

  const handleUpdateCaption = async (
    id: string,
    text: string,
    fullUpdate = false,
  ) => {
    if (!studio) return;
    const clip = studio.getClipById(id);
    if (!clip) return;
    const trackId = studio.findTrackIdByClipId(id);
    if (!trackId) return;

    if (!fullUpdate) {
      (clip as any).text = text;
      (clip as any).emit("propsChange", { text });
      return;
    }

    const newWordsText = text.trim().split(/\s+/).filter(Boolean);
    const clipJson = (clip as any).toJSON
      ? (clip as any).toJSON()
      : { ...clip };
    const caption = clipJson.caption || {};
    const oldWords = caption.words || [];
    const paragraphIndex = oldWords[0]?.paragraphIndex ?? "";

    let updatedWords;
    if (newWordsText.length > oldWords.length) {
      const totalDurationMs =
        (clipJson.display.to - clipJson.display.from) / 1000;
      const totalChars = newWordsText.reduce((acc, w) => acc + w.length, 0);
      const durationPerChar = totalChars > 0 ? totalDurationMs / totalChars : 0;
      let currentShift = 0;
      updatedWords = newWordsText.map((wordText, index) => {
        const wordDuration = wordText.length * durationPerChar;
        const word = {
          ...(oldWords[index] || { isKeyWord: false, paragraphIndex }),
          text: wordText,
          from: currentShift,
          to: currentShift + wordDuration,
        };
        currentShift += wordDuration;
        return word;
      });
    } else {
      updatedWords = newWordsText.map((wordText, index) => {
        if (oldWords[index]) return { ...oldWords[index], text: wordText };
        return { text: wordText, from: 0, to: 0, isKeyWord: false };
      });
    }

    const newClipJson = {
      ...clipJson,
      text,
      caption: { ...caption, words: updatedWords },
      id: undefined,
    };
    try {
      const newClip = await jsonToClip(newClipJson as any);
      await studio.addClip([newClip], { trackId });
      studio.removeClipById(id);
    } catch (error) {
      Log.error("Failed to update caption clip:", error);
    }
  };

  const handleSplitCaption = async (
    id: string,
    cursorPosition: number,
    fullText: string,
  ) => {
    if (!studio) return;
    const clip = studio.getClipById(id);
    if (!clip) return;
    const trackId = studio.findTrackIdByClipId(id);
    if (!trackId) return;

    const wordsInText: { text: string; start: number; end: number }[] = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      wordsInText.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    let splitWordIndex = -1;
    for (let i = 0; i < wordsInText.length; i++) {
      if (
        cursorPosition <= wordsInText[i].start ||
        cursorPosition < wordsInText[i].end
      ) {
        splitWordIndex = i;
        break;
      }
    }
    if (splitWordIndex <= 0) return;

    const part1Text = wordsInText
      .slice(0, splitWordIndex)
      .map((w) => w.text)
      .join(" ");
    const part2Text = wordsInText
      .slice(splitWordIndex)
      .map((w) => w.text)
      .join(" ");
    const clipJson = (clip as any).toJSON
      ? (clip as any).toJSON()
      : { ...clip };
    const caption = clipJson.caption || {};
    const words = caption.words || [];
    const part1Words = words.slice(0, splitWordIndex);
    const part2Words = words.slice(splitWordIndex);

    if (part1Words.length === 0 || part2Words.length === 0) return;
    const lastWordPart1 = part1Words[part1Words.length - 1];

    const clip1Json = {
      ...clipJson,
      id: undefined,
      text: part1Text,
      caption: { ...caption, words: part1Words },
      display: {
        from: clipJson.display.from,
        to: lastWordPart1.to * 1000 + clipJson.display.from,
      },
      duration: lastWordPart1.to * 1000,
    };

    const normalizeWordTimings = (words: any[]) => {
      let currentTime = 0;
      return words.map((word) => {
        const duration = word.to - word.from;
        const newWord = {
          ...word,
          from: currentTime,
          to: currentTime + duration,
        };
        currentTime += duration;
        return newWord;
      });
    };

    const clip2Json = {
      ...clipJson,
      id: undefined,
      text: part2Text,
      caption: { ...caption, words: normalizeWordTimings(part2Words) },
      display: {
        from: lastWordPart1.to * 1000 + clipJson.display.from,
        to: clipJson.display.to,
      },
      duration:
        clipJson.display.to - lastWordPart1.to * 1000 - clipJson.display.from,
    };

    try {
      const clip1 = await jsonToClip(clip1Json as any);
      const clip2 = await jsonToClip(clip2Json as any);
      await studio.addClip([clip1, clip2], { trackId });
      studio.removeClipById(id);
    } catch (error) {
      Log.error("Failed to split caption clip:", error);
    }
  };

  const handleDeleteCaption = (id: string) => {
    if (!studio) return;
    studio.removeClipById(id);
  };

  const handleSeek = (time: number) => {
    if (!studio) return;
    studio.seek(time);
  };

  const copyToClipboard = () => {
    const text =
      transcription?.results?.channels[0]?.alternatives[0]?.transcript;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDuration = (micros: number) => {
    const seconds = Math.floor(micros / 1e6);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const filteredCaptionItems = captionItems.filter((item: any) => {
    const mId =
      item.mediaId ||
      item.opts?.mediaId ||
      item.originalOpts?.mediaId ||
      item.metadata?.sourceClipId;
    return mId === selectedClipId;
  });

  const renderContent = () => {
    if (hasKey === false) {
      return (
        <div className="flex flex-col items-center py-6 text-center space-y-6 h-full animate-in fade-in duration-500 overflow-y-auto">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full" />
              <Lock className="w-6 h-6 text-indigo-400 relative z-10" />
            </div>
            <div className="space-y-1 px-4">
              <h3 className="text-base font-bold text-white tracking-tight">
                {t("highlights.demo_title")}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {t("highlights.demo_description")}
              </p>
            </div>
          </div>
          <div className="w-full space-y-2 px-4">
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
                    href: "https://github.com/Pablituuu",
                    title: "GitHub",
                  },
                  {
                    icon: Linkedin,
                    href: "https://www.linkedin.com/in/pablito-jean-pool-silva-inca-735a03192/",
                    title: "LinkedIn",
                  },
                  {
                    icon: Mail,
                    href: "mailto:pablito.silvainca@gmail.com",
                    title: "Email",
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
            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/51922323921"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all group/btn hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-green-200 font-semibold">
                    +51 922 323 921
                  </span>
                </div>
                <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-md group-hover/btn:bg-green-500/30 font-bold uppercase tracking-wider">
                  WhatsApp
                </span>
              </a>
              <a
                href="mailto:pablito.silvainca@gmail.com"
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/btn hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-white/70">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-white/70 font-semibold">
                    Request Demo
                  </span>
                </div>
                <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-md group-hover/btn:bg-white/10 font-bold uppercase tracking-wider">
                  Email
                </span>
              </a>
            </div>
          </div>
          <div className="space-y-4 w-full pt-4 px-4">
            <div className="flex items-center justify-center gap-3 opacity-30">
              <div className="h-px bg-white/50 flex-1" />
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50">
                {t("highlights.overview")}
              </span>
              <div className="h-px bg-white/50 flex-1" />
            </div>
            <div className="w-full bg-white/5 rounded-2xl border border-white/5 p-4 text-left space-y-3">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em]">
                {t("highlights.current_features")}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  t("updates.ai_captions"),
                  t("updates.stt"),
                  "Deepgram Nova-2 Integration",
                  "Gemini Pro Vision Support",
                  t("updates.i18n"),
                ].map((feat) => (
                  <div
                    key={feat}
                    className="text-xs text-white/60 flex items-center gap-2.5 group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400 transition-all" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (view === "list") {
      return (
        <div className="flex-1 flex flex-col bg-[#0D0D0F] overflow-hidden">
          <div className="p-5 flex items-center gap-4 border-b border-white/5 bg-[#0D0D0F]/80 backdrop-blur-xl sticky top-0 z-20">
            <button
              onClick={() => setView("setup")}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t("captions.list_title")}
              </h2>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-widest">
                {filteredCaptionItems.length} {t("highlights.clips_count")}
              </p>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-5 flex flex-col gap-3 pb-10">
              {filteredCaptionItems.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-4 text-center opacity-40">
                  <div className="p-4 rounded-full bg-white/5">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-xs font-medium">
                    {t("highlights.status_init").replace("...", "")}
                  </p>
                  <Button
                    onClick={() => setView("setup")}
                    variant="ghost"
                    className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest"
                  >
                    {t("captions.setup_title")}
                  </Button>
                </div>
              ) : (
                filteredCaptionItems.map((item) => (
                  <CaptionItem
                    key={item.id}
                    item={item}
                    isActive={item.id === activeCaptionId}
                    onUpdate={(text, fullUpdate) =>
                      handleUpdateCaption(item.id, text, fullUpdate)
                    }
                    onSplit={(pos, text) =>
                      handleSplitCaption(item.id, pos, text)
                    }
                    onDelete={() => handleDeleteCaption(item.id)}
                    onSeek={() => handleSeek(item.display.from)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col p-5 space-y-8 overflow-y-auto scrollbar-none bg-[#0D0D0F]">
        <div className="relative overflow-hidden p-4 rounded-2xl bg-linear-to-br from-indigo-600/20 to-purple-600/10 border border-white/10 shadow-2xl hover:border-indigo-500/30 transition-all cursor-default">
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-none mb-1.5">
                {t("captions.setup_title")}
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-indigo-300/70 font-medium uppercase tracking-widest leading-none">
                  Deepgram Nova-2 Active
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full" />
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase text-white/40 tracking-widest flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5" />
            Language Detection
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-300 ${selectedLanguage === lang.code ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.02]" : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"}`}
              >
                <span className="text-sm">
                  {typeof lang.icon === "string" ? (
                    lang.icon
                  ) : (
                    <lang.icon
                      className={`w-3.5 h-3.5 ${selectedLanguage === lang.code ? "text-indigo-600" : "text-indigo-400"}`}
                    />
                  )}
                </span>
                <span className="text-[11px] font-semibold">{lang.label}</span>
                {selectedLanguage === lang.code && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase text-white/40 tracking-widest flex items-center gap-2">
            <Video className="w-3.5 h-3.5" />
            Source Clip from Timeline
          </h3>
          {videoClips.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white/2 border border-dashed border-white/10 flex flex-col items-center text-center gap-4 transition-all hover:bg-white/4">
              <div className="p-3 rounded-full bg-white/5 text-white/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-[11px] text-white/30 font-medium">
                {t("updates.video_support_desc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {videoClips.map((clip) => {
                const clipId = clip.clipId || clip.id;
                const isSelected = selectedClipId === clipId;
                return (
                  <div
                    key={clipId}
                    onClick={() => {
                      setSelectedClipId(clipId);
                      if (
                        captionItems.some(
                          (c) =>
                            (c.mediaId || c.metadata?.sourceClipId) === clipId,
                        )
                      )
                        setView("list");
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group overflow-hidden ${isSelected ? "bg-[#1A1A1E] border-indigo-500/50 shadow-xl" : "bg-white/5 border-transparent hover:bg-white/10"}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <VideoThumbnail src={clip.src} isSelected={isSelected} />
                      <div>
                        <p
                          className={`text-xs font-bold leading-none mb-1.5 ${isSelected ? "text-white" : "text-white/70"}`}
                        >
                          {(clip.label || "Video Clip").substring(0, 20)}...
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono">
                            {formatDuration(clip.durationUs || 0)}
                          </span>
                          {(() => {
                            const count = captionItems.filter(
                              (c) =>
                                (c.mediaId || c.metadata?.sourceClipId) ===
                                clipId,
                            ).length;
                            return (
                              count > 0 && (
                                <span className="text-[8px] font-bold uppercase">
                                  {count} {t("updates.captions")}
                                </span>
                              )
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400 animate-pulse" />
                    ) : (
                      <Plus className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedClipId && !transcription && !isProcessing && (
          <Button
            onClick={generateCaptions}
            className="w-full bg-white hover:bg-white/90 text-black font-bold h-12 rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] active:scale-95 border-none"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("text.add_captions")}
          </Button>
        )}

        {isProcessing && (
          <div className="py-12 flex flex-col items-center gap-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
              <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse -z-10" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs text-white font-bold">
                {t("highlights.processing")}
              </p>
              <p className="text-[10px] text-white/30 font-medium tracking-wide uppercase">
                {t("captions.processing")}
              </p>
            </div>
          </div>
        )}

        {transcription && (
          <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-700 pb-10">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase text-white/40 tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Generated Text
                {transcription.metadata?.detected_language && (
                  <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full text-[8px] font-black border border-indigo-500/20">
                    {transcription.metadata.detected_language.toUpperCase()}
                  </span>
                )}
              </h3>
              <button
                onClick={() => {
                  setTranscription(null);
                  setSelectedClipId(null);
                }}
                className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest"
              >
                Clear
              </button>
            </div>
            <div className="group relative">
              <div className="p-5 rounded-2xl bg-[#141417] border border-white/5 text-[13px] text-white/90 leading-relaxed font-medium italic shadow-inner">
                "
                {transcription.results?.channels[0]?.alternatives[0]
                  ?.transcript || "No transcript found"}
                "
              </div>
              <button
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-[8px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Copy
                    </span>
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>
            <div className="space-y-3 pt-2">
              <Button
                disabled={isBurning}
                onClick={() => handleBurnToTimeline()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all border-none"
              >
                {isBurning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Burning...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {t("captions.regenerate")}
                  </>
                )}
              </Button>
              <p className="text-[9px] text-center text-white/20 font-medium uppercase tracking-tighter">
                {t("captions.alignment_complete")}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0D0D0F]">
      {renderContent()}
      {typeof document !== "undefined" &&
        errorToast &&
        createPortal(
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-9999 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="relative overflow-hidden bg-[#0F0F12]/95 border border-white/10 text-white p-5 pr-12 rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-4 min-w-[380px] max-w-[500px] ring-1 ring-white/10">
              <div className="absolute -left-4 -top-4 w-16 h-16 bg-red-500/10 blur-2xl rounded-full" />
              <div className="relative w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="relative flex-1 min-w-0">
                <h4 className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  {t("captions.system_message")}
                </h4>
                <p className="text-[13px] text-white/90 font-medium leading-tight">
                  {errorToast}
                </p>
              </div>
              <button
                onClick={() => setErrorToast(null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all active:scale-90"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function CaptionItem({
  item,
  isActive,
  onUpdate,
  onSplit,
  onDelete,
  onSeek,
}: {
  item: any;
  isActive: boolean;
  onUpdate: (text: string, fullUpdate?: boolean) => void;
  onSplit: (cursorPosition: number, text: string) => void;
  onDelete: () => void;
  onSeek: () => void;
}) {
  const [text, setText] = useState(item.text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    setText(item.text || "");
  }, [item.text]);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onUpdate(e.target.value, false);
  };
  const handleBlur = () => {
    if (text !== item.text) onUpdate(text, true);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const cursorPosition = textareaRef.current?.selectionStart || 0;
      onSplit(cursorPosition, text);
    }
  };
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-2xl p-4 transition-all duration-300 border",
        isActive
          ? "bg-indigo-500/5 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.05)]"
          : "bg-white/2 border-white/5 hover:bg-white/4",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group/time"
          onClick={onSeek}
        >
          <div className="w-1 h-3 rounded-full bg-indigo-500/40 group-hover/time:bg-indigo-500 transition-colors" />
          <span className="text-[10px] font-bold font-mono text-white/30 group-hover/time:text-white/60 transition-colors tracking-tight">
            {formatTimeForUI(item.display.from / 1e6)} —{" "}
            {formatTimeForUI(item.display.to / 1e6)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={onSeek}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500 text-white/40 hover:text-white transition-all active:scale-90"
          >
            <Play className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all active:scale-90"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="min-h-[20px] p-0 resize-none border-none focus-visible:ring-0 bg-transparent text-[13px] leading-relaxed text-white/80 focus:text-white placeholder:text-white/10 font-medium"
        rows={1}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = "auto";
          target.style.height = `${target.scrollHeight}px`;
        }}
      />
    </div>
  );
}

function formatTimeForUI(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function VideoThumbnail({
  src,
  isSelected,
}: {
  src: string;
  isSelected: boolean;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!src) return;
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    const onLoadedMetadata = () => {
      video.currentTime = 0.5;
    };
    const onSeeked = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 80;
      canvas.height = 80;
      const videoRatio = video.videoWidth / video.videoHeight;
      let drawWidth = canvas.width,
        drawHeight = canvas.height,
        offsetX = 0,
        offsetY = 0;
      if (videoRatio > 1) {
        drawWidth = canvas.height * videoRatio;
        offsetX = -(drawWidth - canvas.width) / 2;
      } else {
        drawHeight = canvas.width / videoRatio;
        offsetY = -(drawHeight - canvas.height) / 2;
      }
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      try {
        setThumbnail(canvas.toDataURL("image/jpeg", 0.7));
      } catch (e) {
        console.error("Thumb error:", e);
      }
    };
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeked", onSeeked);
    video.src = src;
    video.load();
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
      video.src = "";
    };
  }, [src]);
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center transition-all duration-500 border relative",
        isSelected
          ? "border-indigo-400/50 shadow-lg shadow-indigo-500/20 scale-105"
          : "border-white/10 grayscale-[0.5] group-hover/thumb:grayscale-0",
      )}
    >
      {thumbnail ? (
        <img src={thumbnail} className="w-full h-full object-cover" alt="cut" />
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          <Video className="w-4 h-4 text-white/20 animate-pulse" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {isSelected && (
        <div className="absolute inset-0 bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/50" />
      )}
    </div>
  );
}
