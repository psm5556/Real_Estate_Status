"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface NormalizeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function NormalizeToggle({ checked, onChange }: NormalizeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="normalize"
        checked={checked}
        onCheckedChange={(v) => onChange(!!v)}
      />
      <Label htmlFor="normalize" className="text-xs cursor-pointer leading-tight">
        기준일 보정{" "}
        <span className="text-muted-foreground">(2022-01-31 = 100)</span>
      </Label>
    </div>
  );
}
