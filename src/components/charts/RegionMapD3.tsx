"use client";

import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { CODE_TO_FULL_NAME } from "@/lib/data/regions";
import type { PriceRow } from "@/types/price-data";
import type { PriceTypeOption } from "@/lib/store/filter-store";

interface RegionNode {
  name: string;
  fullName?: string;
  code?: string;
  value?: number;
  children?: RegionNode[];
}

interface RegionMapD3Props {
  data: PriceRow[];
  date: string;
  priceType: PriceTypeOption;
}

function buildHierarchy(valueByCode: Map<string, number>): RegionNode {
  const root: RegionNode = { name: "전체", children: [] };
  const nodeMap = new Map<string, RegionNode>();
  nodeMap.set("", root);

  for (const [code, value] of valueByCode) {
    const fullName = CODE_TO_FULL_NAME[code] ?? code;
    const parts = fullName.split(">").map((p) => p.trim());

    let parentKey = "";
    for (let i = 0; i < parts.length; i++) {
      const key = parts.slice(0, i + 1).join(">");
      const isLeaf = i === parts.length - 1;

      if (!nodeMap.has(key)) {
        const node: RegionNode = {
          name: parts[i],
          fullName: key,
          ...(isLeaf
            ? { value, code, children: undefined }
            : { children: [] }),
        };
        nodeMap.set(key, node);
        const parent = nodeMap.get(parentKey)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else if (isLeaf) {
        const existing = nodeMap.get(key)!;
        existing.value = value;
        existing.code = code;
      }
      parentKey = key;
    }
  }

  return root;
}

function valueToColor(value: number | undefined): string {
  if (value === undefined) return "#e5e7eb";
  const diff = value - 100;
  if (Math.abs(diff) < 0.05) return "#f9fafb";
  const intensity = Math.min(Math.abs(diff) / 5, 1);
  if (diff > 0) {
    // 빨강: 상승
    const g = Math.round(200 - intensity * 150);
    const b = Math.round(180 - intensity * 150);
    return `rgb(239,${g},${b})`;
  } else {
    // 파랑: 하락
    const r = Math.round(200 - intensity * 160);
    const g = Math.round(200 - intensity * 80);
    return `rgb(${r},${g},246)`;
  }
}

const MARGIN = { top: 4, right: 4, bottom: 4, left: 4 };

export function RegionMapD3({ data, date, priceType }: RegionMapD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const valueByCode = useMemo(() => {
    const map = new Map<string, number>();
    const pt = priceType === "both" ? "매매" : priceType;
    for (const row of data) {
      if (row.date === date && row.priceType === pt) {
        map.set(row.regionCode, row.value);
      }
    }
    return map;
  }, [data, date, priceType]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || valueByCode.size === 0) return;

    const containerWidth = containerRef.current.clientWidth || 900;
    const nodeCount = valueByCode.size;
    const height = Math.max(360, Math.min(560, nodeCount * 36 + 80));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg
      .attr("width", containerWidth)
      .attr("height", height)
      .style("font-family", "inherit");

    const hierarchyData = buildHierarchy(valueByCode);

    const root = d3
      .hierarchy<RegionNode>(hierarchyData)
      .sum((d) => (!d.children || d.children.length === 0 ? 1 : 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    if ((root.value ?? 0) === 0) return;

    const treemapLayout = d3
      .treemap<RegionNode>()
      .size([
        containerWidth - MARGIN.left - MARGIN.right,
        height - MARGIN.top - MARGIN.bottom,
      ])
      .paddingOuter(6)
      .paddingTop(18)
      .paddingInner(2)
      .round(true);

    const treemapRoot = treemapLayout(root);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const tooltip = d3.select(tooltipRef.current);

    const nodes = g
      .selectAll<SVGGElement, d3.HierarchyRectangularNode<RegionNode>>("g")
      .data(treemapRoot.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    // 배경 사각형
    nodes
      .append("rect")
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d) =>
        d.depth === 0 ? "#f3f4f6" : valueToColor(d.data.value)
      )
      .attr("stroke", "white")
      .attr("stroke-width", (d) => (d.depth <= 1 ? 2 : 1))
      .attr("rx", 3)
      .style("cursor", (d) => (d.data.value !== undefined ? "pointer" : "default"))
      .on("mouseenter", (_ev, d) => {
        if (d.data.value === undefined && d.depth > 0) return;
        tooltip
          .style("display", "block")
          .html(
            `<div class="font-medium text-foreground">${d.data.fullName ?? d.data.name}</div>
             ${d.data.value !== undefined ? `<div class="font-mono text-sm">${d.data.value.toFixed(2)}</div>` : ""}`
          );
      })
      .on("mousemove", (ev) => {
        const rect = containerRef.current!.getBoundingClientRect();
        tooltip
          .style("left", `${ev.clientX - rect.left + 14}px`)
          .style("top", `${ev.clientY - rect.top - 50}px`);
      })
      .on("mouseleave", () => tooltip.style("display", "none"));

    // 지역명 레이블
    nodes
      .filter((d) => d.x1 - d.x0 > 22 && d.y1 - d.y0 > 14)
      .append("text")
      .attr("x", 4)
      .attr("y", (d) => (d.depth <= 1 ? 13 : 11))
      .attr("font-size", (d) => (d.depth <= 1 ? "11px" : "10px"))
      .attr("font-weight", (d) => (d.depth <= 1 ? "700" : "400"))
      .attr("fill", "#111827")
      .attr("pointer-events", "none")
      .text((d) => d.data.name)
      .each(function (d) {
        const maxW = d.x1 - d.x0 - 8;
        const el = d3.select(this);
        let txt = d.data.name;
        while (
          this.getComputedTextLength() > maxW &&
          txt.length > 1
        ) {
          txt = txt.slice(0, -1);
          el.text(txt + "…");
        }
      });

    // 값 레이블 (충분한 공간이 있을 때)
    nodes
      .filter(
        (d) =>
          d.data.value !== undefined &&
          d.x1 - d.x0 > 32 &&
          d.y1 - d.y0 > 28
      )
      .append("text")
      .attr("x", 4)
      .attr("y", (d) => (d.depth <= 1 ? 26 : 22))
      .attr("font-size", "10px")
      .attr("fill", "#374151")
      .attr("pointer-events", "none")
      .text((d) => d.data.value?.toFixed(2) ?? "");
  }, [valueByCode]);

  if (valueByCode.size === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        데이터가 없습니다. 지역을 선택하고 조회해 주세요.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <svg ref={svgRef} className="w-full" />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute hidden z-50 bg-background border rounded shadow-md text-xs p-2 min-w-[100px]"
        style={{ display: "none" }}
      />
    </div>
  );
}
