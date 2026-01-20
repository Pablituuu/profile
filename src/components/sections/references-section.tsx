"use client";

import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

export function ReferencesSection() {
  const { t } = useLanguage();

  const references = [
    {
      name: "Mohit Chopra",
      role: t("rolePM"),
      company: "Cliquify",
      tel: "+1 (309) 472-1607",
    },
    {
      name: "Umanda Joyobandara",
      role: t("rolePM"),
      company: "Drawify",
      tel: "+94 77 679 0596",
    },
    {
      name: "Dany Boza",
      role: t("roleFullstack"),
      company: "Cliquify - Drawify - My Design",
      tel: "+51 944 267 715",
    },
    {
      name: "Ze Carlos",
      role: t("roleAnalyst"),
      company: "Telefonica TECH",
      tel: "+51 958 973 260",
    },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">{t("references")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {references.map((ref, i) => (
          <Card key={i} className="glass border-none">
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs">
                  <User className="w-4 h-4" />
                </div>
                {ref.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="text-brand-secondary font-medium">{ref.role}</p>
              <p className="text-muted-foreground text-xs font-semibold">
                {ref.company}
              </p>
              <p className="text-muted-foreground mt-1">{ref.tel}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
