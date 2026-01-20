"use client";

import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";

export function ReferencesSection() {
  const { t } = useLanguage();

  const references = [
    {
      name: "Jean Karlo Silva Inca",
      role: "Desarrollador Full-stack Sr",
      tel: "+51 924 956 462",
    },
    {
      name: "Carlos Meza",
      role: "Analista de Telecomunicaciones",
      tel: "+51 964 693 723",
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
            <CardContent className="text-sm">
              <p className="text-brand-secondary font-medium">{ref.role}</p>
              <p className="text-muted-foreground mt-1">{ref.tel}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
