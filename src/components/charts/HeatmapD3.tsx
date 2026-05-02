"use client";

import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { Skeleton } from "@/components/ui/skeleton";
import { buildHeatmapMatrix } from "@/lib/transforms/heatmap";
import { getShortName } from "@/lib/data/regions";
import type { PriceRow } from "@/types/price-data";
import type { HeatmapMode } from "@/lib/transforms/heatmap";
import type { PriceTypeOption } from "@/lib/store/filter-store";

interface HeatmapD3Props {
  data: PriceRow[];
  regions: string[];
  priceType: PriceTypeOption;
  mode: HeatmapMode;
  loading?: boolean;
}

const MARGIN = { top: 10, right: 20, bottom: 60, left: 110 };
const CELL_HEIGHT = 26;

export function HeatmapD3({ data, regions, priceType, mode, loading }: HeatmapD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (priceType === "both") return data.filter((r) => r.priceType === "매매");
    return data.filter((r) => r.priceType === priceType);
  }, [data, priceType]);

  const matrix = useMemo(
    () => buildHeatmapMatrix(filtered, regions, mode),
    [filtered, regions, mode]
  );

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || matrix.regions.length === 0) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const width = containerWidth - MARGIN.left - MARGIN.right;
    const height = matrix.regions.length * CELL_HEIGHT;
    const totalHeight = height + MARGIN.top + MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", totalHeight);

    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    // 스케일
    const xScale = d3
      .scaleBand()
      .domain(matrix.dates)
      .range([0, width])
      .padding(0.02);

    const yScale = d3
      .scaleBand()
      .domain(matrix.regions)
      .range([0, height])
      .padding(0.05);

    const zRange = mode === "cumulative" ? [-10, 10] : [-1, 1];
    const colorScale = d3
      .scaleSequential(d3.interpolateRdYlGn)
      .domain(zRange)
      .clamp(true);

    // X축 틱 간격
    const totalWeeks = matrix.dates.length;
    const tickEvery =
      totalWeeks <= 12 ? 1
      : totalWeeks <= 52 ? 4
      : totalWeeks <= 156 ? 8
      : 13;

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(matrix.dates.filter((_, i) => i % tickEvery === 0))
      .tickFormat((d) => d.toString().slice(0, 7));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .call((axis) => axis.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "10px")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em");

    // Y축
    g.append("g")
      .call(d3.axisLeft(yScale).tickFormat((d) => getShortName(d)))
      .call((axis) => axis.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "11px");

    // 셀
    const tooltip = d3.select(tooltipRef.current);

    matrix.regions.forEach((region, ri) => {
      matrix.dates.forEach((date, di) => {
        const value = matrix.values[ri]?.[di];
        if (value === undefined || value === null) return;

        g.append("rect")
          .attr("x", xScale(date) ?? 0)
          .attr("y", yScale(region) ?? 0)
          .attr("width", xScale.bandwidth())
          .attr("height", yScale.bandwidth())
          .attr("fill", colorScale(value))
          .attr("rx", 2)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .on("mouseenter", (_ev) => {
            tooltip
              .style("display", "block")
              .html(
                `<div class="font-medium">${getShortName(region)}</div>
                 <div class="text-muted-foreground">${date}</div>
                 <div class="font-mono">${value > 0 ? "+" : ""}${value.toFixed(3)}%</div>`
              );
          })
          .on("mousemove", (event) => {
            const rect = containerRef.current!.getBoundingClientRect();
            tooltip
              .style("left", `${event.clientX - rect.left + 12}px`)
              .style("top", `${event.clientY - rect.top - 40}px`);
          })
          .on("mouseleave", () => {
            tooltip.style("display", "none");
          });
      });
    });

    // 컬러 범례
    const legendWidth = Math.min(200, width * 0.4);
    const legendX = width - legendWidth;
    const legendY = height + 46;

    const legendScale = d3.scaleLinear().domain(zRange).range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale)
      .tickValues([zRange[0], 0, zRange[1]])
      .tickFormat((d) => `${d}%`);

    const defs = svg.append("defs");
    const gradId = "heatmap-gradient";
    const grad = defs
      .append("linearGradient")
      .attr("id", gradId)
      .attr("x1", "0%").attr("x2", "100%");

    const stops = d3.range(0, 1.01, 0.1);
    stops.forEach((t) => {
      const val = zRange[0] + t * (zRange[1] - zRange[0]);
      grad.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(val));
    });

    const legendG = g.append("g").attr("transform", `translate(${legendX},${legendY})`);
    legendG
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", 10)
      .attr("fill", `url(#${gradId})`);
    legendG
      .append("g")
      .attr("transform", "translate(0,10)")
      .call(legendAxis)
      .call((a) => a.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "10px");
  }, [matrix, mode]);

  if (loading) return <Skeleton className="w-full h-64 rounded-lg" />;

  if (matrix.regions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        데이터가 없습니다. 지역을 선택하고 조회해 주세요.
      </div>
    );
  }

  const svgHeight = matrix.regions.length * CELL_HEIGHT + MARGIN.top + MARGIN.bottom;

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} style={{ height: svgHeight }} />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute hidden z-50 bg-background border rounded shadow-md text-xs p-2 min-w-[120px]"
        style={{ display: "none" }}
      />
    </div>
  );
}
