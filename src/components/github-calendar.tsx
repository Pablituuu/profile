"use client";

import { useEffect, useRef, useState } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/language-context";

export function GitHubCalendarComponent() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "Pablituuu";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // We use a small timeout to ensure the SVG has fully rendered and the scrollWidth is accurate
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const scrollAmount =
          containerRef.current.scrollWidth - containerRef.current.clientWidth;
        containerRef.current.scrollTo({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <div
        ref={containerRef}
        className="w-full overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex justify-start min-w-max px-4">
          <GitHubCalendar
            username={username}
            colorScheme={theme === "dark" ? "dark" : "light"}
            fontSize={12}
            blockSize={12}
            blockMargin={4}
            showWeekdayLabels
          />
        </div>
      </div>
      <div className="flex justify-between items-center px-4 mt-1">
        <p className="text-[10px] text-muted-foreground italic">
          {t("historyHint")}
        </p>
        <p className="text-[10px] text-brand-primary font-medium">
          {t("recentActivity")}
        </p>
      </div>
    </div>
  );
}
