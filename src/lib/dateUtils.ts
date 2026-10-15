/**
 * Date and Time utilities for the EMA weather station (Agudos, SP, Brazil).
 * All meteorological calculations and date selectors must respect the local timezone (America/Sao_Paulo / UTC-3).
 */

export interface BrazilDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  dateStr: string; // "YYYY-MM-DD"
  timeStr: string; // "HH:mm:ss"
  timeShortStr: string; // "HH:mm"
}

export function getBrazilDate(d: Date = new Date()): BrazilDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);

  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
  const timeShortStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return { year, month, day, hour, minute, second, dateStr, timeStr, timeShortStr };
}

export function getBrazilTodayStr(d: Date = new Date()): string {
  return getBrazilDate(d).dateStr;
}

/**
 * Shifts a YYYY-MM-DD date by offsetDays (e.g. -1 for yesterday, +1 for tomorrow)
 */
export function addDaysToDateStr(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return dateObj.toISOString().split("T")[0];
}
