'use client';

import { Play, Plus } from 'lucide-react';
import { Audio } from 'openvideo';
import { useEditorStore } from '@/store/use-editor-store';

const audioTracks = [
  {
    id: 1,
    title: 'Hope. City pop.',
    author: 'table_1',
    duration: '02:11',
    cover:
      'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop',
    src: 'https://raw.githubusercontent.com/mdn/learning-area/main/html/multimedia-and-embedding/video-and-audio-content/viper.mp3',
  },
  {
    id: 2,
    title: 'Melancholy',
    author: 'Author_Name',
    duration: '00:23',
    cover:
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=200&auto=format&fit=crop',
    src: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3',
  },
  {
    id: 3,
    title: 'PHONK!',
    author: 'D254',
    duration: '01:00',
    cover:
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop',
    src: 'https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample2.mp3',
  },
  {
    id: 4,
    title: 'Hip Hop Background',
    author: 'Pavel',
    duration: '01:25',
    cover:
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=200&auto=format&fit=crop',
    src: 'https://raw.githubusercontent.com/rafael-mancini/audio-samples/main/mp3/sample-1.mp3',
  },
  {
    id: 5,
    title: 'Best background music',
    author: 'harryfaoki',
    duration: '03:11',
    cover:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop',
    src: 'https://raw.githubusercontent.com/rafael-mancini/audio-samples/main/mp3/sample-2.mp3',
  },
  {
    id: 6,
    title: 'Lofi hiphop perfect',
    author: 'IWAI Noriko',
    duration: '03:22',
    cover:
      'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=200&auto=format&fit=crop',
    src: 'https://raw.githubusercontent.com/rafael-mancini/audio-samples/main/mp3/sample-3.mp3',
  },
];

export function AudioPanel() {
  const { studio } = useEditorStore();

  const handleAddAudio = async (url: string) => {
    if (!studio) return;

    try {
      const audioClip = await Audio.fromUrl(url);
      await studio.addClip(audioClip);
    } catch (error) {
      console.error('Failed to add audio:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground select-none">
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-4">
          <div className="flex flex-col gap-2">
            {audioTracks.map((track) => (
              <div
                key={track.id}
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => handleAddAudio(track.src)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground/90 line-clamp-1">
                      {track.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {track.author}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
                    {track.duration}
                  </span>
                  <button className="h-7 w-7 rounded-full bg-brand-primary flex items-center justify-center hover:bg-brand-primary/90 hover:scale-105 transition-all text-white shadow-sm opacity-0 group-hover:opacity-100">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
