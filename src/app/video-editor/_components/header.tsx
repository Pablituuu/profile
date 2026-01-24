"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExportModal } from "./export-modal";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between shrink-0 z-50">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Pablituuu Logo"
          width={32}
          height={32}
          className="rounded-md"
        />
        <span className="font-bold text-lg hidden md:block">Pablituuu</span>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button
          size="sm"
          className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          onClick={() => setIsExportModalOpen(true)}
        >
          Export
        </Button>
      </div>
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </header>
  );
}
