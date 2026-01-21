'use client';

import { FolderDot, ExternalLink, Github } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import type { Project } from '@/types/content';

export function ProjectsSection() {
  const { t } = useLanguage();

  const projects: Project[] = [
    {
      title: t('videoEditorV2Title'),
      url: '/video-editor',
      github: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_USERNAME || ''}/profile`,
      image: '/video-editor-v2.png',
      desc: t('videoEditorV2Desc'),
      techs: [
        'Next JS',
        '@designcombo/video',
        'Fabric JS',
        'Tailwind CSS',
        'Zustand',
      ],
    },
    {
      title: t('videoEditorV1Title'),
      url: 'https://react-video-editor-mu.vercel.app/',
      github: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_USERNAME || ''}/react-video-editor`,
      image: '/video-editor.png',
      desc: t('videoEditorV1Desc'),
      techs: ['React', 'Remotion', 'TypeScript', 'Tailwind CSS', 'Zustand'],
    },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <FolderDot className="w-8 h-8 text-brand-secondary" />
        {t('personalProjects')}
      </h2>
      <div className="grid grid-cols-1 gap-8">
        {projects.map((project, i) => (
          <div
            key={i}
            className="group relative grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl glass hover:bg-white/5 transition-all duration-500 overflow-hidden"
          >
            {/* Image Column */}
            <div className="lg:col-span-7 relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full relative"
              >
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                  <span className="px-6 py-2 bg-white text-black font-bold rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                    {t('launchDemo')}
                  </span>
                </div>
              </a>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {project.desc}
                </p>
                {/* 
                  Core Libraries Architecture:
                  - @remotion/player & remotion: Complex video rendering and timeline management.
                  - @designcombo/timeline & @designcombo/state: Advanced state management for video editing.
                  - @interactify/moveable: Precision UI manipulation for canvas elements.
                */}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {project.techs.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="bg-white/5 text-[10px] font-semibold"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white px-6"
                >
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" /> {t('launchDemo')}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full glass border-white/20 px-6"
                >
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" /> {t('viewCode')}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
