"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PriceRow } from "@/types/price-data";

interface DataTableProps {
  data: PriceRow[];
  loading?: boolean;
}

const columnHelper = createColumnHelper<PriceRow>();

const columns = [
  columnHelper.accessor("date", {
    header: "날짜",
    cell: (info) => info.getValue(),
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("regionName", {
    header: "지역",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("priceType", {
    header: "유형",
    cell: (info) => (
      <span
        className={cn(
          "text-xs px-1.5 py-0.5 rounded font-medium",
          info.getValue() === "매매"
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        )}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("value", {
    header: "지수",
    cell: (info) => info.getValue().toFixed(4),
    sortingFn: "basic",
  }),
];

function exportCsv(data: PriceRow[]) {
  const headers = ["날짜", "지역", "유형", "지수"];
  const rows = data.map((r) => [r.date, r.regionName, r.priceType, r.value.toFixed(4)]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const bom = "﻿"; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `price_index_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataTable({ data, loading }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const sortedData = useMemo(() => [...data], [data]);

  const table = useReactTable({
    data: sortedData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {data.length.toLocaleString()}개 데이터
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportCsv(data)}
          disabled={data.length === 0}
          className="h-8 text-xs"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          CSV 내보내기
        </Button>
      </div>

      <ScrollArea className="h-[480px] rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "h-9 px-3 text-left text-xs font-medium text-muted-foreground",
                      header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-40" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-1.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
