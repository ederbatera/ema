/**
 * Date and Time utilities for the EMA weather station (Agudos, SP, Brazil).
 * All database queries, telemetry synthesis, and reporting must respect the local timezone (America/Sao_Paulo / UTC-3).
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

/**
 * Extracts the exact recorded Date and Time from a database DATETIME record.
 * MariaDB stores timestamps already in local station time (America/Sao_Paulo / UTC-3).
 * When Prisma loads it as a Date object, it assigns UTC components matching the literal database values.
 * This helper retrieves the true pulse recording date and time without subtracting 3 hours again.
 */
export function getDbRecordDateTime(rawDate: Date | string | null | undefined): { dateStr: string; timeStr: string } {
  if (!rawDate) {
    const now = getBrazilDate();
    return { dateStr: now.dateStr, timeStr: now.timeStr };
  }

  if (typeof rawDate === "string") {
    const trimmed = rawDate.trim();
    const spaceMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (spaceMatch) {
      return { dateStr: spaceMatch[1], timeStr: spaceMatch[2] };
    }
    const tMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
    if (tMatch) {
      return { dateStr: tMatch[1], timeStr: tMatch[2] };
    }
  }

  const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
  if (isNaN(d.getTime())) {
    const now = getBrazilDate();
    return { dateStr: now.dateStr, timeStr: now.timeStr };
  }

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");

  return {
    dateStr: `${y}-${m}-${day}`,
    timeStr: `${h}:${min}:${s}`,
  };
}
