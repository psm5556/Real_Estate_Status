"use client";

import type { CorrelationKey } from "@/lib/transforms/correlation";

interface CorrelationHeatmapProps {
  keys: CorrelationKey[];
  matrix: number[][];
}

function corrToColor(v: number): string {
  if (!isFinite(v)) return "#f3f4f6";
  const clamped = Math.max(-1, Math.min(1, v));
  if (clamped >= 0) {
    const t = clamped;
    return `rgb(${Math.round(239)}, ${Math.round(239 - t * 180)}, ${Math.round(239 - t * 230)})`;
  } else {
    const t = -clamped;
    return `rgb(${Math.round(239 - t * 230)}, ${Math.round(239 - t * 150)}, ${Math.round(239)})`;
  }
}

function corrToTextColor(v: number): string {
  if (!isFinite(v)) return "inherit";
  return Math.abs(v) > 0.6 ? "white" : "inherit";
}

export function CorrelationHeatmap({ keys, matrix }: CorrelationHeatmapProps) {
  if (keys.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        지역을 2개 이상 선택하고 조회해 주세요.
      </div>
    );
  }

  const n = keys.length;
  const cellSize = Math.max(36, Math.min(72, Math.floor(560 / (n + 1))));
  const fontSize = Math.max(8, Math.min(11, cellSize / 4.5));
  const labelWidth = Math.max(60, Math.min(120, cellSize * 1.8));

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-auto">
        <table className="border-collapse" style={{ fontSize }}>
          <thead>
            <tr>
              <th style={{ width: labelWidth, height: cellSize * 1.5 }} />
              {keys.map((k) => (
                <th
                  key={k.key}
                  style={{ width: cellSize, height: cellSize * 1.5, verticalAlign: "bottom", padding: 2 }}
                >
                  <div
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      maxHeight: cellSize * 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: "hsl(var(--muted-foreground))",
                      fontWeight: 500,
                    }}
                  >
                    {k.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((rowKey, i) => (
              <tr key={rowKey.key}>
                <td
                  style={{
                    width: labelWidth,
                    height: cellSize,
                    textAlign: "right",
                    paddingRight: 6,
                    whiteSpace: "nowrap",
                    color: "hsl(var(--muted-foreground))",
                    fontWeight: 500,
                  }}
                >
                  {rowKey.label}
                </td>
                {matrix[i].map((v, j) => (
                  <td
                    key={j}
                    title={`${keys[i].label} × ${keys[j].label}: ${isFinite(v) ? v.toFixed(3) : "—"}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: corrToColor(v),
                      color: corrToTextColor(v),
                      textAlign: "center",
                      fontVariantNumeric: "tabular-nums",
                      border: "1px solid hsl(var(--border) / 0.3)",
                    }}
                  >
                    {isFinite(v) ? v.toFixed(2) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>-1</span>
        <div
          style={{
            height: 8,
            width: 180,
            background:
              "linear-gradient(to right, rgb(9,89,239), rgb(239,239,239), rgb(239,59,9))",
            borderRadius: 4,
          }}
        />
        <span>+1</span>
        <span className="ml-2 text-muted-foreground/60">
          (Pearson 상관계수, WoW% 기준, 최소 3주 필요)
        </span>
      </div>
    </div>
  );
}
