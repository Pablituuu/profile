"use client";

import { GraduationCap, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

export function EducationSection() {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            {
              title: "Cortex XDR: Investigation and Response (PAN-EDU-262)",
              issuer: "Palo Alto Networks",
              year: "2021",
            },
            {
              title: "Scrum Foundation Professional Certificate (SFPC)",
              issuer: "CertiProf",
              year: "2020",
            },
          ].map((cert, i) => (
            <Card key={i} className="glass border-none">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">{cert.title}</CardTitle>
                <CardDescription className="text-xs">
                  {cert.issuer} • {cert.year}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
