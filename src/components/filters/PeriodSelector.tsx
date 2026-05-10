"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PeriodOption } from "@/lib/store/filter-store";

const PERIODS: PeriodOption[] = ["최대", "1년", "3년", "5년", "10년", "직접입력"];

interface PeriodSelectorProps {
  period: PeriodOption;
  customStart: string;
  customEnd: string;
  onPeriodChange: (period: PeriodOption) => void;
  onCustomStartChange: (date: string) => void;
  onCustomEndChange: (date: string) => void;
}

export function PeriodSelector({
  period,
  customStart,
  customEnd,
  onPeriodChange,
  onCustomStartChange,
  onCustomEndChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-1">
        {PERIODS.map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            className={cn("h-7 text-xs px-1", period === p && "font-semibold")}
            onClick={() => onPeriodChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {period === "직접입력" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">시작일</Label>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              max={customEnd}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">종료일</Label>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              min={customStart}
              max={new Date().toISOString().slice(0, 10)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}
