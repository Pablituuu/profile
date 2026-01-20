"use client";

import { useEffect, useRef } from "react";
import { GitHubCalendar } from "react-github-calendar";
import { useTheme } from "next-themes";

export function GitHubCalendarComponent() {
  const { theme } = useTheme();
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "Pablituuu";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Scroll to the end to show recent activity
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full overflow-hidden">
      <div
        ref={containerRef}
        className="w-full overflow-x-auto no-scrollbar py-2 cursor-grab active:cursor-grabbing"
      >
        <div className="flex justify-start min-w-max px-2">
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
      <p className="text-[10px] text-muted-foreground mt-2 italic">
        Desliza para ver actividad anterior
      </p>
    </div>
  );
}
