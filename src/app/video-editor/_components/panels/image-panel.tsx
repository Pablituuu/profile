'use client';

import { useState } from 'react';
import { AIAssetsModal } from '../modals/ai-assets-modal';

import { CloudUpload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from 'openvideo';
import { useEditorStore } from '@/store/use-editor-store';

const imageAssets = [
  {
    id: 1,
    title: 'Mountain Landscape',
    src: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    id: 2,
    title: 'Urban Architecture',
    src: 'https://images.pexels.com/photos/169647/pexels-photo-169647.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    id: 3,
    title: 'Abstract Gradient',
    src: 'https://images.pexels.com/photos/2085776/pexels-photo-2085776.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    id: 4,
    title: 'Cozy Coffee',
    src: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    id: 5,
    title: 'Neon City',
    src: 'https://images.pexels.com/photos/1519192/pexels-photo-1519192.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    id: 6,
    title: 'Minimal Plant',
    src: 'https://images.pexels.com/photos/1022923/pexels-photo-1022923.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
];

interface ImageAsset {
  id: string | number;
  title: string;
  src: string;
}

import { useLanguageStore } from '@/store/use-language-store';
import { useRef } from 'react';

export function ImagePanel() {
  const { studio } = useEditorStore();
  const { t } = useLanguageStore();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [assets, setAssets] = useState<ImageAsset[]>(() =>
    imageAssets.map((a) => ({ ...a, id: String(a.id) }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAssets: ImageAsset[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      title: file.name,
      src: URL.createObjectURL(file),
    }));

    setAssets((prev) => [...newAssets, ...prev]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddItemToCanvas = async (url: string) => {
    if (!studio) return;

    try {
      const imageClip = await Image.fromUrl(url);
      imageClip.display = { from: 0, to: 5 * 1e6 };
      imageClip.duration = 5 * 1e6;

      // Scale to fit and center in scene (1080x1920)
      await imageClip.scaleToFit(1080, 1920);
      imageClip.centerInScene(1080, 1920);

      await studio.addClip(imageClip);
    } catch (error) {
      console.error('Failed to add image:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background text-foreground select-none">
      {/* Upload Actions */}
      <div className="p-4 flex flex-col gap-3 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          multiple
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-[#3F3F3F] hover:bg-[#4F4F4F] text-white flex items-center gap-2 h-10 border-none shadow-none rounded-md"
        >
          <CloudUpload className="h-4 w-4" />
          <span>{t('image.upload')}</span>
        </Button>
      </div>

      {/* Promo Banner */}
      <div
        onClick={() => setIsAIModalOpen(true)}
        className="mx-4 mb-4 p-3 bg-linear-to-r from-pink-500/10 to-rose-500/10 rounded-lg border border-white/5 flex items-center gap-3 shrink-0 cursor-pointer hover:border-pink-500/30 transition-colors"
      >
        <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center">
          <Plus className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <div className="text-xs font-semibold text-pink-100">
            {t('image.generate_ai')}
          </div>
          <div className="text-[10px] text-pink-200/70">
            {t('image.create_unique')}
          </div>
        </div>
      </div>

      <AIAssetsModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
        title="AI Image Generation"
      />

      {/* Images Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group flex flex-col gap-1.5 cursor-pointer"
              onClick={() => handleAddItemToCanvas(asset.src)}
            >
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden border border-transparent group-hover:border-brand-primary/50">
                <img
                  src={asset.src}
                  alt={asset.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute top-1 left-1 bg-brand-primary/90 rounded px-1 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  +
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground truncate group-hover:text-white transition-colors">
                {asset.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
