"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  Award,
  Code2,
  ExternalLink,
  GitBranch,
  Star,
  Users,
  Activity,
  FolderDot,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { GitHubCalendarComponent } from "@/components/github-calendar";
import { useLanguage } from "@/context/language-context";
import Image from "next/image";

export default function Home() {
  const { t } = useLanguage();
  const [githubStats, setGithubStats] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/github/stats");
        if (res.ok) {
          const data = await res.json();
          setGithubStats(data);
        }
      } catch (error) {
        console.error("GitHub stats fetch failed:", error);
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
              <p className="text-xl text-brand-primary font-medium">
                {t("title")}
              </p>
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
                  href="https://github.com/Pablituuu"
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
              ].map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-primary/5 hover:bg-primary/10 text-xs py-1"
                >
                  {skill}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Right Column - Content */}
        <main className="lg:col-span-8 space-y-12 animate-in slide-in-from-right-8 duration-700">
          {/* Personal Projects */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <FolderDot className="w-8 h-8 text-brand-secondary" />
              {t("personalProjects")}
            </h2>
            <div className="grid grid-cols-1 gap-8">
              {[
                {
                  title: "React Video Editor",
                  url: "https://react-video-editor-mu.vercel.app/",
                  github: "https://github.com/Pablituuu/react-video-editor",
                  image: "/video-editor.png",
                  desc: t("videoEditorDesc"),
                  techs: [
                    "React",
                    "Remotion",
                    "TypeScript",
                    "Tailwind CSS",
                    "Zustand",
                  ],
                },
              ].map((project, i) => (
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
                          {t("launchDemo")}
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
                          <ExternalLink className="w-4 h-4" /> {t("launchDemo")}
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
                          <Github className="w-4 h-4" /> {t("viewCode")}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-border/50" />

          {/* Experience Section */}
          <section className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-brand-primary" />
              {t("professionalExperience")}
            </h2>
            <div className="space-y-6">
              {[
                {
                  company: "CLIQUIFY",
                  url: "https://www.thecliquify.co/",
                  image: "/cliquify.png",
                  role: t("roleFrontend"),
                  period: "Oct 2023 – Jan 2026",
                  desc: t("expCliquify"),
                  techs: [
                    "React JS",
                    "Fabric JS",
                    "Moveable JS",
                    "Zustand",
                    "Shadcn",
                  ],
                },
                {
                  company: "MY DESIGN",
                  url: "https://mydesigns.io/",
                  image: "/mydesigns.png",
                  role: t("roleFrontend"),
                  period: "Jan 2024 – Jul 2024",
                  desc: t("expMyDesign"),
                  techs: [
                    "Vue JS",
                    "Fabric JS",
                    "Material UI",
                    "Zustand",
                    "DnD kit",
                    "AWS Lambda",
                  ],
                },
                {
                  company: "DRAWIFY",
                  url: "https://drawify.com/home",
                  image: "/drawify.png",
                  role: t("roleFrontend"),
                  period: "Jul 2022 – Nov 2024",
                  desc: t("expDrawify"),
                  techs: ["React JS", "Chakra UI", "Redux", "AWS", "Stripe"],
                },
                {
                  company: "TELEFONICA CYBERSECURITY TECH",
                  role: t("roleAnalyst"),
                  period: "Feb 2020 – Nov 2023",
                  desc: t("expTelefonica"),
                  techs: ["Cortex XDR", "EDR", "Cybersecurity", "Linux"],
                },
              ].map((exp, i) => (
                <div
                  key={i}
                  className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-border"
                >
                  <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {exp.url ? (
                          <a
                            href={exp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 group/link"
                          >
                            <h3 className="text-xl font-bold text-foreground group-hover/link:text-brand-primary transition-colors">
                              {exp.company}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/link:text-brand-primary transition-colors" />
                          </a>
                        ) : (
                          <h3 className="text-xl font-bold text-foreground">
                            {exp.company}
                          </h3>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-brand-primary font-medium text-sm uppercase tracking-wider">
                      {exp.role}
                    </p>
                    {exp.image && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50 my-4 group/image">
                        {exp.url ? (
                          <a
                            href={exp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full h-full"
                          >
                            <Image
                              src={exp.image}
                              alt={exp.company}
                              fill
                              className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-end p-4">
                              <span className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded-lg backdrop-blur-md flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />{" "}
                                {t("verProyecto")}
                              </span>
                            </div>
                          </a>
                        ) : (
                          <Image
                            src={exp.image}
                            alt={exp.company}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {exp.desc}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {exp.techs.map((t) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-[10px] uppercase tracking-tighter opacity-70"
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-brand-secondary" />
                {t("education")}
              </h2>
              <Card className="glass border-none">
                <CardHeader className="py-4">
                  <CardTitle className="text-base">{t("university")}</CardTitle>
                  <CardDescription>2016 - 2021</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {t("degree")}
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Award className="w-6 h-6 text-brand-accent" />
                {t("certifications")}
              </h2>
              <div className="space-y-3">
                {[
                  "Support-Engineer (Palo Alto)",
                  "Itil Foundation 4",
                  "CCNA (I - II - III)",
                  "C# Solutions Development",
                ].map((cert) => (
                  <div
                    key={cert}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                    {cert}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <Separator className="bg-border/50" />

          {/* References */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">{t("references")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  name: "Dany Boza Canto",
                  phone: "+51 944 267 715",
                  company: "Cliquify / MyDesign",
                },
                {
                  name: "Ze Carlos Guerrero",
                  phone: "+51 958 973 260",
                  company: "Telefonica Tech",
                },
              ].map((ref, i) => (
                <Card
                  key={i}
                  className="glass border-none hover:bg-white/5 transition-colors group"
                >
                  <CardContent className="p-4 flex flex-col gap-1">
                    <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {ref.name}
                    </span>
                    <span className="text-xs text-brand-primary">
                      {ref.company}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {ref.phone}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="w-full text-center py-12 text-zinc-600 text-xs border-t border-border/20 mt-12">
        <p>{t("footer")}</p>
      </footer>
    </div>
  );
}
