'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLanguageStore } from '@/store/use-language-store';
import type { TranslationKey } from '@/i18n/translations';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Detect Mac
const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

const mod = isMac ? '⌘' : 'Ctrl';
const shift = isMac ? '⇧' : 'Shift';

interface ShortcutEntry {
  labelKey: string;
  keys: string[];
}

interface ShortcutGroup {
  titleKey: string;
  shortcuts: ShortcutEntry[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    titleKey: 'shortcuts.global',
    shortcuts: [
      { labelKey: 'shortcuts.undo', keys: [mod, 'Z'] },
      { labelKey: 'shortcuts.redo', keys: [shift, mod, 'Z'] },
      { labelKey: 'shortcuts.play_pause', keys: ['Space'] },
      { labelKey: 'shortcuts.delete', keys: ['Delete'] },
      { labelKey: 'shortcuts.duplicate', keys: [mod, 'D'] },
      { labelKey: 'shortcuts.copy', keys: [mod, 'C'] },
      { labelKey: 'shortcuts.paste', keys: [mod, 'V'] },
      { labelKey: 'shortcuts.select_all', keys: [mod, 'A'] },
      { labelKey: 'shortcuts.save_json', keys: [mod, 'S'] },
      { labelKey: 'shortcuts.export_video', keys: [mod, 'E'] },
      { labelKey: 'shortcuts.deselect', keys: ['Esc'] },
    ],
  },
  {
    titleKey: 'shortcuts.timeline',
    shortcuts: [
      { labelKey: 'shortcuts.split', keys: [mod, 'B'] },
      { labelKey: 'shortcuts.zoom_in', keys: [mod, '+'] },
      { labelKey: 'shortcuts.zoom_out', keys: [mod, '-'] },
      { labelKey: 'shortcuts.go_to_start', keys: ['Home'] },
      { labelKey: 'shortcuts.go_to_end', keys: ['End'] },
      { labelKey: 'shortcuts.prev_frame', keys: [','] },
      { labelKey: 'shortcuts.next_frame', keys: ['.'] },
    ],
  },
  {
    titleKey: 'shortcuts.canvas',
    shortcuts: [
      { labelKey: 'shortcuts.move_up', keys: ['↑'] },
      { labelKey: 'shortcuts.move_down', keys: ['↓'] },
      { labelKey: 'shortcuts.move_left', keys: ['←'] },
      { labelKey: 'shortcuts.move_right', keys: ['→'] },
      { labelKey: 'shortcuts.move_5px', keys: [shift, 'Arrow Keys'] },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-[22px] px-1.5 rounded-md bg-white/6 border border-white/10 text-[11px] font-medium text-white/70 font-mono shadow-sm">
      {children}
    </kbd>
  );
}

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  const { t } = useLanguageStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[720px] border-zinc-800 bg-[#0c0c0e]/95 p-0 text-white backdrop-blur-xl"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {t('shortcuts.title')}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-0 divide-x divide-white/5 px-2 pb-6 pt-2">
          {shortcutGroups.map((group) => (
            <div key={group.titleKey} className="px-4">
              {/* Group Title */}
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3 mt-2">
                {t(group.titleKey as TranslationKey)}
              </h3>

              {/* Shortcuts list */}
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.labelKey}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/3 transition-colors group"
                  >
                    <span className="text-[12px] text-white/50 group-hover:text-white/70 transition-colors">
                      {t(shortcut.labelKey as TranslationKey)}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, idx) => (
                        <KeyBadge key={idx}>{key}</KeyBadge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
