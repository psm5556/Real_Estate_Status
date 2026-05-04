import { subDays, parseISO, format } from "date-fns";

// datetime → ISO 주차 YYYYWW 형식 변환
export function dateToWeekFormat(date: Date): string {
  // ISO 주차 계산 (Python의 isocalendar()와 동일)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  const year = d.getUTCFullYear();
  return `${year}${String(weekNumber).padStart(2, "0")}`;
}

// 기간 선택 → (startWeek, endWeek) YYYYWW 형식
export function calculateDateRange(
  period: string,
  customStart?: string,
  customEnd?: string
): { startWeek: string; endWeek: string; startDate: Date; endDate: Date } {
  const today = new Date();
  let startDate: Date;
  const endDate = today;

  switch (period) {
    case "1년":
      startDate = subDays(today, 365);
      break;
    case "3년":
      startDate = subDays(today, 365 * 3);
      break;
    case "5년":
      startDate = subDays(today, 365 * 5);
      break;
    case "10년":
      startDate = subDays(today, 365 * 10);
      break;
    case "직접입력":
      startDate = customStart ? parseISO(customStart) : subDays(today, 365);
      return {
        startWeek: dateToWeekFormat(startDate),
        endWeek: dateToWeekFormat(customEnd ? parseISO(customEnd) : today),
        startDate,
        endDate: customEnd ? parseISO(customEnd) : today,
      };
    default:
      startDate = subDays(today, 365);
  }

  return {
    startWeek: dateToWeekFormat(startDate),
    endWeek: dateToWeekFormat(endDate),
    startDate,
    endDate,
  };
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy-MM-dd");
}

// datetime → YYYYMM 월 포맷 (전세가율 등 월단위 API용)
export function dateToMonthFormat(date: Date): string {
  return format(date, "yyyyMM");
}
