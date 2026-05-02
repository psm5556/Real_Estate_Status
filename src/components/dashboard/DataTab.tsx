"use client";

import { DataTable } from "@/components/tables/DataTable";
import type { PriceRow } from "@/types/price-data";

interface DataTabProps {
  data: PriceRow[];
  loading?: boolean;
}

export function DataTab({ data, loading }: DataTabProps) {
  return <DataTable data={data} loading={loading} />;
}
