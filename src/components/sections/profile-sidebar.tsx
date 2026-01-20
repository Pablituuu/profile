"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Github,
  Activity,
  Star,
  Users,
  Code2,
} from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { GitHubCalendarComponent } from "@/components/github-calendar";
import type { GitHubStats } from "@/types/github";

interface ProfileSidebarProps {
  githubStats: GitHubStats | null;
}

export function ProfileSidebar({ githubStats }: ProfileSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="lg:col-span-4 space-y-8 animate-in slide-in-from-left-8 duration-700">
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
        <Avatar className="w-56 h-56 border-4 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-transform hover:scale-105 duration-500">
          <AvatarImage
            src="/profile.png"
            alt="Pablito Silva Inca"
            className="object-cover"
          />
          <AvatarFallback>PS</AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Pablito Jean Pool Silva Inca
          </h1>
          <p className="text-xl text-brand-primary font-medium">{t("title")}</p>
        </div>

        <p className="text-muted-foreground leading-relaxed">{t("bio")}</p>

        <div className="w-full space-y-4 pt-4">
          <div className="flex items-center gap-3 text-sm group cursor-pointer">
            <div className="p-2 rounded-lg glass group-hover:bg-primary/10 transition-colors">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <span>+51 922323921</span>
          </div>
          <div className="flex items-center gap-3 text-sm group cursor-pointer">
            <div className="p-2 rounded-lg glass group-hover:bg-primary/10 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <span>pablito.silvainca@gmail.com</span>
          </div>
          <div className="flex items-center gap-3 text-sm group cursor-pointer">
            <div className="p-2 rounded-lg glass group-hover:bg-primary/10 transition-colors">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <span>Huancayo, Perú</span>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            asChild
            size="icon"
            variant="outline"
            className="glass hover:text-primary transition-colors"
          >
            <a
              href="https://www.linkedin.com/in/pablito-jean-pool-silva-inca-735a03192/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </Button>
          <Button
            asChild
            size="icon"
            variant="outline"
            className="glass hover:text-primary transition-colors"
          >
            <a
              href={`https://github.com/${process.env.NEXT_PUBLIC_GITHUB_USERNAME || ""}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5" />
            </a>
          </Button>
        </div>

        {/* GitHub Insights */}
        <div className="w-full space-y-4 pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-primary" />
            {t("githubInsights")}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass border-none p-3 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-all">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-xl font-bold">
                {githubStats?.public_repos || "—"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase text-center">
                {t("repos")}
              </span>
            </Card>
            <Card className="glass border-none p-3 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-all">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xl font-bold">
                {githubStats?.total_stars || "—"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase text-center">
                {t("stars")}
              </span>
            </Card>
            <Card className="glass border-none p-3 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-all">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xl font-bold">
                {githubStats?.followers || "—"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase text-center">
                {t("followers")}
              </span>
            </Card>
            <Card className="glass border-none p-3 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-all">
              <Code2 className="w-4 h-4 text-purple-500" />
              <span className="text-xl font-bold">
                {githubStats?.top_repo?.stars || "—"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase text-center">
                {t("topRepo")}
              </span>
            </Card>
          </div>

          <Card className="glass border-none p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" /> {t("annualActivity")}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              >
                {t("online")}
              </Badge>
            </div>
            <div className="w-full">
              <GitHubCalendarComponent />
            </div>
          </Card>
        </div>
      </div>

      <Card className="glass border-none shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code2 className="w-5 h-5 text-brand-secondary" />
            {t("skills")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            "React JS",
            "Next JS",
            "Vue JS",
            "Flutter",
            "React Native",
            "Redux",
            "Chakra UI",
            "Vite",
            "Shadcn",
            "Zustand",
            "Fabric JS",
            "Moveable JS",
            "DnD kit",
            "Linux",
            "JWT",
            "Cortex XDR",
          ].map((skill, i) => (
            <Badge
              key={`${skill}-${i}`}
              variant="secondary"
              className="bg-primary/5 hover:bg-primary/10 text-xs py-1"
            >
              {skill}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
