"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface NormalizeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  baseDate: string;
  onBaseDateChange: (date: string) => void;
}

export function NormalizeToggle({
  checked,
  onChange,
  baseDate,
  onBaseDateChange,
}: NormalizeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="normalize"
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
      />
      <Label htmlFor="normalize" className="text-xs cursor-pointer leading-tight">
        기준일 보정
      </Label>
      {checked ? (
        <>
          <input
            type="date"
            value={baseDate}
            onChange={(e) => e.target.value && onBaseDateChange(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="text-xs border border-input rounded px-1.5 py-0.5 bg-background text-foreground h-6"
          />
          <span className="text-xs text-muted-foreground">= 100</span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">({baseDate} = 100)</span>
      )}
    </div>
  );
}
