/**
 * Synchronizer for 5-minute automated sensor telemetry.
 *
 * Sensors upload records to MariaDB on exact 5-minute intervals:
 * 00:00:00, 00:05:00, 00:10:00, ..., 00:55:00.
 *
 * To allow the database insertion and aggregation jobs to complete,
 * the frontend synchronizes with an offset (default +20 seconds):
 * 00:00:20, 00:05:20, 00:10:20, ..., 00:55:20.
 */

export interface SyncSchedule {
  delayMs: number;
  targetTimestamp: number;
  targetFormatted: string;
}

export const SENSOR_CYCLE_MINUTES = 5;
export const SYNC_OFFSET_SECONDS = 20;

/**
 * Calculates the exact millisecond delay and target timestamp for the next sync.
 */
export function getNextSyncSchedule(
  offsetSeconds: number = SYNC_OFFSET_SECONDS,
  intervalMinutes: number = SENSOR_CYCLE_MINUTES
): SyncSchedule {
  const now = new Date();
  const nowMs = now.getTime();
  const intervalMs = intervalMinutes * 60 * 1000; // 300,000 ms
  const offsetMs = offsetSeconds * 1000;          // 20,000 ms

  // Calculate the epoch start of the current 5-minute block
  const currentBucketStart = Math.floor(nowMs / intervalMs) * intervalMs;
  let targetMs = currentBucketStart + offsetMs;

  // If already at or past the target (with a 500ms safety window),
  // schedule for the target of the NEXT 5-minute block
  if (nowMs >= targetMs - 500) {
    targetMs += intervalMs;
  }

  const delayMs = Math.max(500, targetMs - nowMs);
  const targetDate = new Date(targetMs);
  const targetFormatted = targetDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return {
    delayMs,
    targetTimestamp: targetMs,
    targetFormatted,
  };
}

/**
 * Formats countdown time remaining in mm:ss
 */
export function formatCountdown(targetTimestamp: number): string {
  const diffMs = targetTimestamp - Date.now();
  if (diffMs <= 0) return "00:00";
  const totalSeconds = Math.ceil(diffMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Formats relative time since last sync (e.g. "agora mesmo", "1 min atrás", "3 min atrás")
 */
export function formatTimeAgo(date: Date | null): string {
  if (!date) return "sincronizando...";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 15) return "agora";
  if (diffSec < 60) return `${diffSec}s atrás`;
  const min = Math.floor(diffSec / 60);
  if (min === 1) return "1m atrás";
  return `${min}m atrás`;
}
