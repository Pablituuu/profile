'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExportModal } from './export-modal';

export function Header() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-end shrink-0 z-50">
      <div className="flex items-center gap-2">
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
