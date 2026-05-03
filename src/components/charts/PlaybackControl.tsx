"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackControlProps {
  dates: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function PlaybackControl({ dates, currentIndex, onIndexChange }: PlaybackControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const stop = useCallback(() => setIsPlaying(false), []);

  useEffect(() => {
    if (!isPlaying || dates.length === 0) return;
    const id = setInterval(() => {
      const next = currentIndexRef.current + 1;
      if (next >= dates.length) {
        stop();
      } else {
        onIndexChange(next);
      }
    }, 700);
    return () => clearInterval(id);
  }, [isPlaying, dates.length, onIndexChange, stop]);

  // 데이터 변경 시 재생 중지
  useEffect(() => {
    stop();
  }, [dates.length, stop]);

  if (dates.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-2 bg-muted/30 rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        title="처음으로"
        onClick={() => { stop(); onIndexChange(0); }}
      >
        <SkipBack className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        title={isPlaying ? "정지" : "재생"}
        onClick={() => setIsPlaying(p => !p)}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        title="마지막으로"
        onClick={() => { stop(); onIndexChange(dates.length - 1); }}
      >
        <SkipForward className="h-3.5 w-3.5" />
      </Button>

      <input
        type="range"
        min={0}
        max={Math.max(0, dates.length - 1)}
        value={currentIndex}
        onChange={e => {
          stop();
          onIndexChange(Number(e.target.value));
        }}
        className="flex-1 h-1.5 accent-primary cursor-pointer"
      />

      <span className="text-xs font-mono text-muted-foreground w-24 text-right shrink-0">
        {dates[currentIndex] ?? ""}
      </span>
    </div>
  );
}
