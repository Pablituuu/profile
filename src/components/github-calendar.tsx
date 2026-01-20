"use client";

import { GitHubCalendar } from "react-github-calendar";
import { useTheme } from "next-themes";

export function GitHubCalendarComponent() {
  const { theme } = useTheme();
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "Pablituuu";

  return (
    <div className="flex flex-col gap-4 overflow-hidden py-4">
      <GitHubCalendar
        username={username}
        colorScheme={theme === "dark" ? "dark" : "light"}
        fontSize={12}
        blockSize={12}
        blockMargin={4}
        showWeekdayLabels
      />
    </div>
  );
}
