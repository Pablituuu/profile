"use client";

import { Briefcase, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useLanguage } from "@/context/language-context";
import type { Experience } from "@/types/content";

export function ExperienceSection() {
  const { t } = useLanguage();

  const experiences: Experience[] = [
    {
      company: "CLIQUIFY",
      url: "https://www.thecliquify.co/",
      image: "/cliquify.png",
      role: t("roleFrontend"),
      period: "Oct 2023 – Jan 2026",
      desc: t("expCliquify"),
      techs: ["React JS", "Fabric JS", "Moveable JS", "Zustand", "Shadcn"],
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
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <Briefcase className="w-8 h-8 text-brand-primary" />
        {t("professionalExperience")}
      </h2>
      <div className="space-y-6">
        {experiences.map((exp, i) => (
          <div
            key={i}
            className="group relative p-6 rounded-3xl glass border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                {exp.url ? (
                  <a
                    href={exp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-bold text-foreground hover:text-brand-primary transition-colors flex items-center gap-2"
                  >
                    {exp.company}
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded-lg backdrop-blur-md flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> {t("verProyecto")}
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
            <p className="text-muted-foreground leading-relaxed text-sm mb-4">
              {exp.desc}
            </p>
            <div className="flex flex-wrap gap-2">
              {exp.techs.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="bg-primary/5 hover:bg-primary/10 text-[10px]"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
