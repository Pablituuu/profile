'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Sparkles,
  X,
  Github,
  Linkedin,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssetsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function AIAssetsModal({
  open,
  onOpenChange,
  title = 'Assistant AI',
}: AIAssetsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[450px] p-0 border-zinc-800 bg-black/95 text-white backdrop-blur-3xl rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-linear-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-tight text-base">
                {title}
              </h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.6)] bg-yellow-500" />
                <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-black">
                  DEMO MODE
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/30 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scrollbar-track-transparent bg-linear-to-b from-indigo-900/20 to-transparent p-6 text-center space-y-5">
          {/* Profile Card */}
          <div className="w-full space-y-2">
            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-base font-bold text-white shadow-lg">
                PJ
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold text-white">
                  Pablito Jean Pool Silva Inca
                </h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                  Full Stack Developer
                </p>
              </div>

              <div className="flex items-center gap-2.5 mt-1">
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
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all hover:scale-105 active:scale-95"
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
                className="flex items-center justify-between p-3 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all group/btn active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/20 text-green-400 group-hover/btn:rotate-12 transition-transform">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-green-200 font-medium">
                    +51 922 323 921
                  </span>
                </div>
                <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-1 rounded-lg group-hover/btn:bg-green-500/30 transition-colors font-bold tracking-tight">
                  WhatsApp
                </span>
              </a>

              <a
                href="mailto:pablito.silvainca@gmail.com"
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/btn active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/10 text-white/70">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] text-white/70 font-medium">
                    Request Demo
                  </span>
                </div>
                <span className="text-[10px] bg-white/5 text-white/40 px-2 py-1 rounded-lg group-hover/btn:bg-white/10 transition-colors font-bold tracking-tight">
                  Email
                </span>
              </a>
            </div>
          </div>

          {/* Features Description */}
          <div className="space-y-4 w-full pt-2">
            <div className="flex items-center justify-center gap-3 opacity-30">
              <div className="h-px bg-white flex-1" />
              <span className="text-[10px] uppercase font-bold text-white tracking-[0.2em]">
                Overview
              </span>
              <div className="h-px bg-white flex-1" />
            </div>

            <div className="w-full bg-white/5 rounded-2xl border border-white/5 p-4 text-left space-y-3">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-1">
                Current Features
              </p>
              <ul className="space-y-2">
                {[
                  'Intelligent Chat & Reasoning',
                  'AI Video Generation (Veo)',
                  'AI Image Generation',
                  'Smart Text Editing',
                  'Bilingual (EN/ES)',
                ].map((feat, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-white/70 flex items-center gap-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full bg-indigo-500/5 rounded-2xl border border-indigo-500/10 p-4 text-left space-y-3">
              <p className="text-[10px] font-bold text-indigo-300/40 uppercase tracking-[0.15em] mb-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Coming Soon
              </p>
              <ul className="space-y-2">
                {[
                  'Speech to Text',
                  'Video Subtitles Generation',
                  'Shader Applications',
                ].map((feat, i) => (
                  <li
                    key={i}
                    className="text-[13px] text-indigo-200/50 flex items-center gap-2.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
