'use client';

import { useEffect, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/mode-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import type { GitHubStats } from '@/types/github';

// Sections
import { ProfileSidebar } from '@/components/sections/profile-sidebar';
import { ProjectsSection } from '@/components/sections/projects-section';
import { ExperienceSection } from '@/components/sections/experience-section';
import { EducationSection } from '@/components/sections/education-section';
import { ReferencesSection } from '@/components/sections/references-section';
import { Footer } from '@/components/sections/footer';

export default function Home() {
  const [githubStats, setGithubStats] = useState<GitHubStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/github/stats');
        if (res.ok) {
          const data = await res.json();
          setGithubStats(data);
        }
      } catch (error) {
        console.error('GitHub stats fetch failed:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <ModeToggle />
      <LanguageToggle />

      {/* Hero Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/30 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column - Profile & Contact */}
        <ProfileSidebar githubStats={githubStats} />

        {/* Right Column - Experience & Education */}
        <main className="lg:col-span-8 space-y-12 animate-in slide-in-from-right-8 duration-700">
          <ProjectsSection />

          <Separator className="bg-border/50" />

          <ExperienceSection />

          <Separator className="bg-border/50" />

          <EducationSection />

          <Separator className="bg-border/50" />

          <ReferencesSection />
        </main>
      </div>

      <Footer />
    </div>
  );
}
