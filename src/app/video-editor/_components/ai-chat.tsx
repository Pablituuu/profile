'use client';

import React, { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAISDKRuntime } from '@assistant-ui/react-ai-sdk';
import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  AssistantRuntimeProvider,
} from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Github,
  Linkedin,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/use-editor-store';
import { Text, IClip } from '@designcombo/video';
import { useAiHandlers } from '../_hooks/use-ai-handlers';

/**
 * Custom Message component with role-based styling using local variables
 */
const CustomMessage = () => {
  return (
    <MessagePrimitive.Root className="flex gap-3 mb-6 data-[role=user]:flex-row-reverse group [--msg-avatar-bg:rgba(255,255,255,0.05)] [--msg-bg:rgba(255,255,255,0.03)] [--msg-border:rgba(255,255,255,0.05)] data-[role=user]:[--msg-avatar-bg:rgba(255,255,255,0.1)] data-[role=user]:[--msg-bg:rgba(79,70,229,0.15)] data-[role=user]:[--msg-border:rgba(147,51,234,0.3)]">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 bg-[--msg-avatar-bg]">
        <MessagePrimitive.If user>
          <User className="w-4 h-4 text-white/60" />
        </MessagePrimitive.If>
        <MessagePrimitive.If assistant>
          <Bot className="w-4 h-4 text-indigo-400" />
        </MessagePrimitive.If>
      </div>

      <div className="max-w-[85%] flex flex-col gap-2">
        <div className="p-3.5 rounded-2xl bg-[--msg-bg] border border-[--msg-border] group-data-[role=user]:rounded-tr-none group-data-[role=assistant]:rounded-tl-none">
          <MessagePrimitive.Content
            components={{
              Text: () => (
                <MarkdownTextPrimitive className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none text-white/90" />
              ),
              tools: {
                by_name: {
                  addText: ({ args }) => (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 mt-2 first:mt-0 animate-in fade-in slide-in-from-left-2 duration-500">
                      <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                      </div>
                      <span className="text-xs text-white/60 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        Agregando texto: "{(args as any).text}"
                      </span>
                    </div>
                  ),
                  updateSelectedTextStyle: () => (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 mt-2 first:mt-0 animate-in fade-in slide-in-from-left-2 duration-500">
                      <div className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                      </div>
                      <span className="text-xs text-white/60 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        Actualizando estilo del texto...
                      </span>
                    </div>
                  ),
                },
              },
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

import { checkGeminiApiKey } from '@/app/actions/check-api-key';

// ... (keep CustomMessage component as is)

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const { studio } = useEditorStore();

  const { handleToolCall } = useAiHandlers(studio);

  // Check API Key on mount
  React.useEffect(() => {
    checkGeminiApiKey().then((configured) => {
      setHasKey(configured);
    });
  }, []);

  // Initialize chat only if key exists (or while checking to avoid hook errors, though we won't render it)
  // We can always initialize it but obscure the UI.
  const chat = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onToolCall: async ({ toolCall }) => {
      await handleToolCall(toolCall);
    },
  });

  const runtime = useAISDKRuntime(chat);

  // If status is loading, we could show nothing or a loader. default to true/null to avoid flash?
  // Let's assume loading state.

  const renderContent = () => {
    if (hasKey === false) {
      return (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scrollbar-track-transparent bg-linear-to-b from-indigo-900/20 to-transparent">
          <div className="flex flex-col items-center p-6 text-center space-y-5">
            {/* Contact / Profile Section - NOW AT TOP */}
            <div className="w-full space-y-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  PJ
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-white">
                    Pablito Jean Pool Silva Inca
                  </h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">
                    Full Stack Developer
                  </p>
                </div>

                <div className="flex items-center gap-2">
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
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                      title={social.title}
                    >
                      <social.icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <a
                  href="https://wa.me/51922323921"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors group/btn"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-green-500/20 text-green-400">
                      <MessageCircle className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] text-green-200 font-medium">
                      +51 922 323 921
                    </span>
                  </div>
                  <span className="text-[9px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded group-hover/btn:bg-green-500/30 transition-colors">
                    WhatsApp
                  </span>
                </a>

                <a
                  href="mailto:pablito.silvainca@gmail.com"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/btn"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-white/10 text-white/70">
                      <Mail className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] text-white/70 font-medium">
                      Request Demo
                    </span>
                  </div>
                  <span className="text-[9px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded group-hover/btn:bg-white/10 transition-colors">
                    Email
                  </span>
                </a>
              </div>
            </div>

            {/* Features Description - NOW AT BOTTOM */}
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-center gap-2 opacity-50">
                <div className="h-px bg-white/20 flex-1" />
                <span className="text-[10px] uppercase font-bold text-white/40">
                  Overview
                </span>
                <div className="h-px bg-white/20 flex-1" />
              </div>

              <div className="w-full bg-white/5 rounded-xl border border-white/5 p-3 text-left space-y-2">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">
                  Current Features
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Intelligent Chat & Reasoning',
                    'AI Video Generation (Veo)',
                    'AI Image Generation',
                    'Smart Text Editing',
                    'Bilingual (EN/ES)',
                  ].map((feat, i) => (
                    <li
                      key={i}
                      className="text-xs text-white/80 flex items-center gap-2"
                    >
                      <div className="w-1 h-1 rounded-full bg-indigo-500" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full bg-indigo-500/5 rounded-xl border border-indigo-500/10 p-3 text-left space-y-2">
                <p className="text-[10px] font-semibold text-indigo-300/40 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Coming Soon
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Speech to Text',
                    'Video Subtitles Generation',
                    'Shader Applications',
                  ].map((feat, i) => (
                    <li
                      key={i}
                      className="text-xs text-indigo-200/60 flex items-center gap-2"
                    >
                      <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <ThreadPrimitive.Root className="flex-1 flex flex-col min-h-0 bg-transparent">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 transition-colors">
          <ThreadPrimitive.Empty>
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
              <div className="p-5 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
                <Bot className="w-10 h-10 text-indigo-400 relative z-10" />
              </div>
              <div className="space-y-2 max-w-[240px]">
                <p className="text-base font-semibold text-white/90">
                  How can I assist you?
                </p>
                <p className="text-xs text-white/40 leading-relaxed font-medium">
                  I can help you with timeline edits, effects, or explaining
                  editor features.
                </p>
              </div>
            </div>
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.Messages
            components={{
              Message: CustomMessage,
            }}
          />
          {/* ... (keep loader) ... */}
          <ThreadPrimitive.If running>
            <div className="flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 bg-white/5">
                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="bg-white/3 border border-white/5 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" />
                </div>
                <span className="text-xs text-white/40 font-medium">
                  Pensando...
                </span>
              </div>
            </div>
          </ThreadPrimitive.If>
        </ThreadPrimitive.Viewport>

        <ComposerPrimitive.Root className="p-6 pt-2 shrink-0 border-t border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-1 transition-all focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:bg-white/8">
            <ComposerPrimitive.Input
              placeholder="Type a message..."
              autoFocus
              className="w-full bg-transparent border-none py-3.5 pl-4 pr-14 text-sm text-white placeholder:text-white/20 focus:outline-none resize-none min-h-[48px] max-h-[120px]"
            />
            <ComposerPrimitive.Send className="absolute right-1.5 bottom-1.5 p-2.5 rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all active:scale-90 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </ComposerPrimitive.Send>
          </div>
          <p className="text-center text-[9px] text-white/10 mt-4 uppercase tracking-[0.2em] font-bold">
            AI assistant may provide inaccurate info
          </p>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    );
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end pointer-events-none">
        {/* Modal Window */}
        <div
          className={cn(
            'w-[400px] h-[640px] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-300 ease-out pointer-events-auto origin-bottom-right mb-4',
            isOpen
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-90 opacity-0 translate-y-10'
          )}
          style={{ visibility: isOpen ? 'visible' : 'hidden' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-linear-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-md shrink-0">
            {/* ... Header content ... */}
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/20">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-white tracking-tight text-base">
                  Assistant AI
                </h3>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] ${hasKey ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}
                  />
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-black">
                    {hasKey === false ? 'Demo Mode' : 'Powered by Gemini'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/30 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conditional Content */}
          {renderContent()}
        </div>

        {/* Trigger Button */}
        <button
          // ... (same button)
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'w-14 h-14 rounded-full bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 border border-white/20 shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 group overflow-hidden pointer-events-auto',
            isOpen && 'scale-0 opacity-0'
          )}
        >
          {/* ... icon */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Sparkles className="w-6 h-6 animate-pulse group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </AssistantRuntimeProvider>
  );
}
