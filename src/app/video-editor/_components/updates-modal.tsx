"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguageStore } from "@/store/use-language-store";
import { Sparkles } from "lucide-react";

export function UpdatesModal() {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLanguageStore();

  const handleClose = () => {
    setIsOpen(false);
  };

  const updateItems = [
    {
      id: "smart_sync",
      title: t("updates.smart_sync"),
      description: t("updates.smart_sync_desc"),
    },
    {
      id: "keyboard_zoom",
      title: t("updates.keyboard_zoom"),
      description: t("updates.keyboard_zoom_desc"),
    },
    {
      id: "performance_ui",
      title: t("updates.performance_ui"),
      description: t("updates.performance_ui_desc"),
    },
    {
      id: "track_management",
      title: t("updates.track_management"),
      description: t("updates.track_management_desc"),
    },
  ];

  const coreItems = [
    {
      id: "video_support",
      title: t("updates.video_support"),
      description: t("updates.video_support_desc"),
    },
    {
      id: "image_support",
      title: t("updates.image_support"),
      description: t("updates.image_support_desc"),
    },
    {
      id: "state_control",
      title: t("updates.state_control"),
      description: t("updates.state_control_desc"),
    },
  ];

  const comingSoonItems = [
    t("updates.ai_voiceover"),
    t("updates.transitions"),
    t("updates.audio_mixing"),
    t("updates.filters_effects"),
    t("updates.export_formats"),
    t("updates.stt"),
    t("updates.captions"),
    t("updates.script_to_video"),
    t("updates.link_to_video"),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[500px] bg-[#0a0a0a] border-white/10 text-white shadow-2xl p-0 overflow-hidden"
      >
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-indigo-400">
                <Sparkles className="size-6" />
                {t("updates.title")}
              </DialogTitle>
              <Badge
                variant="outline"
                className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 text-xs font-bold rounded-full"
              >
                v0.2.1
              </Badge>
            </div>
            <p className="text-white/60 text-sm mt-1 text-left">
              {t("updates.latest_updates")}
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-8 max-h-[500px] overflow-y-auto custom-scrollbar">
          {/* Recent Updates Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 ml-1">
              {t("updates.new_features")}
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {updateItems.map((item) => (
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
              {t("updates.core_features")}
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
              {t("updates.coming_soon")}
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
              {t("updates.close")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
