'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/store/use-language-store';
import { Sparkles } from 'lucide-react';
import packageInfo from '@/../package.json';

export function UpdatesModal() {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLanguageStore();

  const handleClose = () => {
    setIsOpen(false);
  };

  const aiItems = [
    {
      id: 'voice_ai_pro',
      title: t('updates.voice_ai_pro'),
      description: t('updates.voice_ai_pro_desc'),
    },
    {
      id: 'ai_captions',
      title: t('updates.ai_captions'),
      description: t('updates.ai_captions_desc'),
    },
    {
      id: 'ai_highlights',
      title: t('updates.ai_highlights'),
      description: t('updates.ai_highlights_desc'),
    },
    {
      id: 'ai_highlights_tuning',
      title: t('updates.highlights_tuning'),
      description: t('updates.highlights_tuning_desc'),
    },
    {
      id: 'ai_assets',
      title: t('modal.ai_assets'),
      description: t('updates.ai_assets_desc'),
    },
  ];

  const improvedItems = [
    {
      id: 'access_control',
      title: t('updates.access_control'),
      description: t('updates.access_control_desc'),
    },
    {
      id: 'auth',
      title: t('updates.auth'),
      description: t('updates.auth_desc'),
    },
    {
      id: 'i18n',
      title: t('updates.i18n'),
      description: t('updates.i18n_desc'),
    },
    {
      id: 'transitions_stability',
      title: t('updates.transitions_stability'),
      description: t('updates.transitions_stability_desc'),
    },
    {
      id: 'ai_stability',
      title: t('updates.ai_stability'),
      description: t('updates.ai_stability_desc'),
    },
    {
      id: 'corner_radius_fix',
      title: t('updates.corner_radius_fix'),
      description: t('updates.corner_radius_fix_desc'),
    },
    {
      id: 'smart_sync',
      title: t('updates.smart_sync'),
      description: t('updates.smart_sync_desc'),
    },
  ];

  const coreItems = [
    {
      id: 'video_support',
      title: t('updates.video_support'),
      description: t('updates.video_support_desc'),
    },
    {
      id: 'image_support',
      title: t('updates.image_support'),
      description: t('updates.image_support_desc'),
    },
    {
      id: 'state_control',
      title: t('updates.state_control'),
      description: t('updates.state_control_desc'),
    },
    {
      id: 'keyboard_zoom',
      title: t('updates.keyboard_zoom'),
      description: t('updates.keyboard_zoom_desc'),
    },
  ];

  const issueItems = [
    {
      id: 'export_performance',
      title: t('updates.export_performance'),
      description: t('updates.export_performance_desc'),
    },
  ];

  const comingSoonItems = [
    t('updates.audio_mixing'),
    t('updates.export_formats'),
    t('updates.script_to_video'),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        showCloseButton={false}
        className="sm:max-w-[500px] bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-0 overflow-hidden"
      >
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2.5 text-2xl font-bold text-white">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="size-8 object-contain rounded-lg shadow-lg shadow-indigo-500/20"
                />
                <div className="flex flex-col -space-y-1">
                  <span className="text-xl tracking-tight">
                    {t('updates.title')}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-black text-indigo-400/80">
                    Pablituuu Studio
                  </span>
                </div>
              </DialogTitle>
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-xs font-bold rounded-full"
              >
                v{packageInfo.version}
              </Badge>
            </div>
            <p className="text-white/60 text-sm mt-1 text-left">
              {t('updates.latest_updates')}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
          {/* AI Features Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 border-b border-indigo-500/10 pb-2 ml-1">
              {t('updates.ai_features')}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {aiItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-indigo-500/5 rounded-lg bg-indigo-500/5 px-4 hover:bg-indigo-500/10 transition-all border-none"
                >
                  <AccordionTrigger className="text-left font-medium text-indigo-200 hover:text-indigo-100 hover:no-underline py-4">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-indigo-200/60 text-sm leading-relaxed pb-4">
                    {item.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Known Issues Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-red-400/60 border-b border-red-500/10 pb-2 ml-1">
              {t('updates.issues')}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {issueItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-red-500/5 rounded-lg bg-red-500/5 px-4 hover:bg-red-500/10 transition-all border-none"
                >
                  <AccordionTrigger className="text-left font-medium text-red-300/80 hover:text-red-300 hover:no-underline py-4">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-red-200/60 text-sm leading-relaxed pb-4">
                    {item.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Improved Features Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 ml-1">
              {t('updates.improved_features')}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {improvedItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-white/5 rounded-lg bg-white/5 px-4 hover:bg-white/10 transition-all border-none"
                >
                  <AccordionTrigger className="text-left font-medium hover:text-indigo-300 hover:no-underline py-4">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/60 text-sm leading-relaxed pb-4">
                    {item.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Core Features Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 ml-1">
              {t('updates.core_features')}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {coreItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-white/5 rounded-lg bg-white/5 px-4 hover:bg-white/10 transition-all border-none"
                >
                  <AccordionTrigger className="text-left font-medium hover:text-indigo-300 hover:no-underline py-4">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/60 text-sm leading-relaxed pb-4">
                    {item.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Coming Soon Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400/60 border-b border-indigo-400/10 pb-2 ml-1">
              {t('updates.coming_soon')}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {comingSoonItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-white/80 text-sm"
                >
                  <div className="size-1.5 rounded-full bg-indigo-500/40" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 pt-2">
          <DialogFooter className="sm:justify-center">
            <Button
              onClick={handleClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              {t('updates.close')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
