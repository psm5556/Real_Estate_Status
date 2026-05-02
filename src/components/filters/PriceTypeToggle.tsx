"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriceTypeOption } from "@/lib/store/filter-store";

const OPTIONS: { value: PriceTypeOption; label: string }[] = [
  { value: "매매", label: "매매" },
  { value: "전세", label: "전세" },
  { value: "both", label: "전체" },
];

interface PriceTypeToggleProps {
  value: PriceTypeOption;
  onChange: (value: PriceTypeOption) => void;
}

export function PriceTypeToggle({ value, onChange }: PriceTypeToggleProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "default" : "outline"}
          size="sm"
          className={cn("h-7 text-xs", value === opt.value && "font-semibold")}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
