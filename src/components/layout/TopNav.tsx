"use client";

import { Moon, Sun, BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function TopNav() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base">부동산 가격지수</span>
        <span className="text-xs text-muted-foreground hidden sm:block">
          한국부동산원 R-ONE 주간 통계
        </span>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="테마 전환"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </div>
    </header>
  );
}
