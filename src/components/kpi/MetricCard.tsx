import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number | null;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  delta,
  deltaLabel,
  loading,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <Skeleton className="h-3.5 w-20 mb-2" />
          <Skeleton className="h-7 w-28 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  const deltaPositive = delta !== undefined && delta > 0;
  const deltaNegative = delta !== undefined && delta < 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold tracking-tight">
          {value !== null && value !== undefined ? value : "—"}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {delta !== undefined && (
            <Badge
              variant={deltaPositive ? "default" : deltaNegative ? "destructive" : "secondary"}
              className={cn(
                "text-xs px-1.5 py-0 flex items-center gap-0.5",
                deltaPositive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0",
                !deltaPositive && !deltaNegative && "bg-secondary"
              )}
            >
              {deltaPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : deltaNegative ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {delta > 0 ? "+" : ""}
              {delta.toFixed(2)}%
            </Badge>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {deltaLabel && (
            <span className="text-xs text-muted-foreground">{deltaLabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
