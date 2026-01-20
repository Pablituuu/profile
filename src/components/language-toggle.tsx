"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="glass fixed top-[4.5rem] right-6 z-50 rounded-full px-3 gap-2 h-10 min-w-10"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="text-xs font-bold uppercase">{language}</span>
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-none z-[60]">
        <DropdownMenuItem
          onClick={() => setLanguage("es")}
          className="cursor-pointer focus:bg-primary/10"
        >
          Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className="cursor-pointer focus:bg-primary/10"
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
