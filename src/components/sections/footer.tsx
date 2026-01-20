"use client";

import { useLanguage } from "@/context/language-context";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full text-center py-12 text-zinc-600 text-xs border-t border-border/20 mt-12">
      <p>{t("footer")}</p>
    </footer>
  );
}
