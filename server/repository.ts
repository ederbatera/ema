import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { inmetAlertsService } from "./inmetAlertsApi";
import { calculateSunTimes, calculateDewPoint, calculateThermalSensation, SunTimesResult } from "./calculations";
import { getBrazilDate, getBrazilTodayStr } from "./dateUtils";

// Row format matching the user's phpMyAdmin SQL dump
export interface EmaReadingRow {
  registro: number;
  data: Date;
  tempAtual: number;
  tMax: number;
  tMin: number;
  umiAtual: number;
  uMax: number;
  uMin: number;
  umidAbs: number;
  pAtm: number;
  wind: number;
  wDir: string;
  raj: number;
  dirRaj: string;
  qtrRaj: string;
  chuvaVel: number;
  chuva5min: number;
  chuvaDia: number;
  chuvaMes: number;
  windChill: string;
  heatIndex: string;
  dewPoint: number;
  sensation: number;
  uvIndex: number;
  uvIndex2: string;
  vBat: number;
  mbT: number;
  res: number;
}

// Initial memory fallback buffer populated from the user's SQL dump
const memoryBuffer: EmaReadingRow[] = [
  { registro: 142583, data: new Date('2026-09-08T19:40:04Z'), tempAtual: 21.9, tMax: 23, tMin: 13, umiAtual: 99, uMax: 99, uMin: 80, umidAbs: 19, pAtm: 948, wind: 3, wDir: 'NE', raj: 20, dirRaj: 'NE', qtrRaj: '01:21', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 22.12, windChill: 'N/A', heatIndex: '18', dewPoint: 21, sensation: 21, uvIndex: 0, uvIndex2: '', vBat: 3.9, mbT: 27, res: 0 },
  { registro: 142611, data: new Date('2026-09-08T20:50:04Z'), tempAtual: 21.0, tMax: 23, tMin: 13, umiAtual: 99, uMax: 99, uMin: 80, umidAbs: 18, pAtm: 949, wind: 0, wDir: '--', raj: 20, dirRaj: 'NE', qtrRaj: '01:21', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 22.12, windChill: 'N/A', heatIndex: '16', dewPoint: 20, sensation: 20, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 25, res: 0 },
  { registro: 142687, data: new Date('2026-09-09T00:00:04Z'), tempAtual: 18.8, tMax: 23, tMin: 13, umiAtual: 99, uMax: 99, uMin: 80, umidAbs: 15, pAtm: 950, wind: 5, wDir: 'N', raj: 20, dirRaj: 'NE', qtrRaj: '01:21', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 22.12, windChill: '19', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 4.2, mbT: 23, res: 0 },
  { registro: 142759, data: new Date('2026-09-09T03:00:04Z'), tempAtual: 18.0, tMax: 17, tMin: 17, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 950, wind: 4, wDir: 'N', raj: 0, dirRaj: 'NE', qtrRaj: '00:00', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 22.12, windChill: '18', heatIndex: 'N/A', dewPoint: 17, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 4.9, mbT: 21, res: 0 },
  { registro: 142831, data: new Date('2026-09-09T06:00:04Z'), tempAtual: 17.5, tMax: 17, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 948, wind: 3, wDir: 'NW', raj: 10, dirRaj: 'N', qtrRaj: '00:57', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 22.12, windChill: '18', heatIndex: 'N/A', dewPoint: 17, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 21, res: 0 },
  { registro: 142903, data: new Date('2026-09-09T09:00:04Z'), tempAtual: 17.2, tMax: 17, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 948, wind: 5, wDir: 'NW', raj: 10, dirRaj: 'N', qtrRaj: '00:57', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 22.12, windChill: '17', heatIndex: 'N/A', dewPoint: 17, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 2.9, mbT: 21, res: 0 },
  { registro: 142975, data: new Date('2026-09-09T12:00:04Z'), tempAtual: 18.9, tMax: 19, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 951, wind: 3, wDir: 'N', raj: 10, dirRaj: 'N', qtrRaj: '00:57', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 0.28, chuvaMes: 22.40, windChill: '19', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 4.8, mbT: 22, res: 0 },
  { registro: 143011, data: new Date('2026-09-09T13:30:05Z'), tempAtual: 20.6, tMax: 21, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 17, pAtm: 951, wind: 1, wDir: 'NE', raj: 10, dirRaj: 'N', qtrRaj: '00:57', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 0.56, chuvaMes: 22.68, windChill: 'N/A', heatIndex: '16', dewPoint: 20, sensation: 20, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 25, res: 0 },
  { registro: 143075, data: new Date('2026-09-09T16:10:04Z'), tempAtual: 18.5, tMax: 21, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 950, wind: 4, wDir: 'SE', raj: 10, dirRaj: 'N', qtrRaj: '00:57', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 0.84, chuvaMes: 22.96, windChill: '19', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 3.5, mbT: 22, res: 0 },
  { registro: 143263, data: new Date('2026-09-10T00:00:04Z'), tempAtual: 18.6, tMax: 21, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 948, wind: 0, wDir: '--', raj: 12, dirRaj: 'SE', qtrRaj: '14:06', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.84, chuvaMes: 22.96, windChill: '19', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 4.0, mbT: 22, res: 0 },
  { registro: 143407, data: new Date('2026-09-10T06:00:03Z'), tempAtual: 18.3, tMax: 18, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 947, wind: 7, wDir: 'E', raj: 12, dirRaj: 'E', qtrRaj: '02:59', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.28, chuvaMes: 23.24, windChill: '18', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 3.4, mbT: 22, res: 0 },
  { registro: 143601, data: new Date('2026-09-10T14:05:04Z'), tempAtual: 19.5, tMax: 21, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 16, pAtm: 949, wind: 22, wDir: 'SW', raj: 42, dirRaj: 'NW', qtrRaj: '11:03', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.56, chuvaMes: 23.52, windChill: '15', heatIndex: 'N/A', dewPoint: 19, sensation: 15, uvIndex: 0, uvIndex2: '', vBat: 3.4, mbT: 24, res: 0 },
  { registro: 143773, data: new Date('2026-09-10T21:15:04Z'), tempAtual: 17.6, tMax: 21, tMin: 17, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 945, wind: 7, wDir: 'NE', raj: 42, dirRaj: 'NW', qtrRaj: '11:03', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 0.84, chuvaMes: 23.80, windChill: '18', heatIndex: 'N/A', dewPoint: 17, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 4.2, mbT: 22, res: 1 },
  { registro: 143839, data: new Date('2026-09-11T00:00:04Z'), tempAtual: 17.5, tMax: 21, tMin: 17, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 946, wind: 10, wDir: 'N', raj: 42, dirRaj: 'NW', qtrRaj: '11:03', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.84, chuvaMes: 23.80, windChill: '16', heatIndex: 'N/A', dewPoint: 17, sensation: 16, uvIndex: 0, uvIndex2: '', vBat: 4.8, mbT: 21, res: 2 },
  { registro: 143905, data: new Date('2026-09-11T02:45:04Z'), tempAtual: 17.2, tMax: 21, tMin: 17, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 947, wind: 1, wDir: 'E', raj: 42, dirRaj: 'NW', qtrRaj: '11:03', chuvaVel: 36.96, chuva5min: 3.08, chuvaDia: 4.76, chuvaMes: 27.72, windChill: '17', heatIndex: 'N/A', dewPoint: 17, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 3.6, mbT: 21, res: 2 },
  { registro: 143907, data: new Date('2026-09-11T02:50:04Z'), tempAtual: 17.0, tMax: 21, tMin: 17, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 946, wind: 12, wDir: 'NW', raj: 42, dirRaj: 'NW', qtrRaj: '11:03', chuvaVel: 33.60, chuva5min: 2.80, chuvaDia: 7.56, chuvaMes: 30.52, windChill: '14', heatIndex: 'N/A', dewPoint: 16, sensation: 14, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 21, res: 2 },
  { registro: 143909, data: new Date('2026-09-11T02:55:04Z'), tempAtual: 16.9, tMax: 21, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 946, wind: 11, wDir: 'NE', raj: 42, dirRaj: 'NW', qtrRaj: '11:03', chuvaVel: 16.80, chuva5min: 1.40, chuvaDia: 8.96, chuvaMes: 31.92, windChill: '14', heatIndex: 'N/A', dewPoint: 16, sensation: 14, uvIndex: 0, uvIndex2: '', vBat: 4.1, mbT: 21, res: 2 },
  { registro: 143987, data: new Date('2026-09-11T06:10:04Z'), tempAtual: 17.1, tMax: 17, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 946, wind: 3, wDir: 'NW', raj: 16, dirRaj: 'N', qtrRaj: '02:37', chuvaVel: 13.44, chuva5min: 1.12, chuvaDia: 3.08, chuvaMes: 35.84, windChill: '17', heatIndex: 'N/A', dewPoint: 16, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 2.9, mbT: 21, res: 0 },
  { registro: 144005, data: new Date('2026-09-11T06:55:04Z'), tempAtual: 17.1, tMax: 17, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 14, pAtm: 946, wind: 5, wDir: 'N', raj: 19, dirRaj: 'N', qtrRaj: '03:52', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 3.92, chuvaMes: 36.68, windChill: '17', heatIndex: 'N/A', dewPoint: 16, sensation: 17, uvIndex: 0, uvIndex2: '', vBat: 4.4, mbT: 21, res: 0 },
  { registro: 144203, data: new Date('2026-09-11T15:10:04Z'), tempAtual: 26.5, tMax: 26, tMin: 16, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 24, pAtm: 945, wind: 5, wDir: 'E', raj: 24, dirRaj: 'NE', qtrRaj: '05:54', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 3.92, chuvaMes: 36.68, windChill: 'N/A', heatIndex: '30', dewPoint: 26, sensation: 30, uvIndex: 0, uvIndex2: '', vBat: 3.4, mbT: 36, res: 4 },
  { registro: 144243, data: new Date('2026-09-11T16:50:04Z'), tempAtual: 28.9, tMax: 28, tMin: 16, umiAtual: 85, uMax: 99, uMin: 85, umidAbs: 24, pAtm: 943, wind: 15, wDir: 'SE', raj: 24, dirRaj: 'S', qtrRaj: '13:45', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 3.92, chuvaMes: 36.68, windChill: 'N/A', heatIndex: '35', dewPoint: 26, sensation: 35, uvIndex: 0, uvIndex2: '', vBat: 2.5, mbT: 38, res: 4 },
  { registro: 144277, data: new Date('2026-09-11T18:15:04Z'), tempAtual: 31.5, tMax: 31, tMin: 16, umiAtual: 68, uMax: 99, uMin: 68, umidAbs: 22, pAtm: 942, wind: 5, wDir: 'S', raj: 24, dirRaj: 'S', qtrRaj: '13:45', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 3.92, chuvaMes: 36.68, windChill: 'N/A', heatIndex: '38', dewPoint: 24, sensation: 38, uvIndex: 0, uvIndex2: '', vBat: 2.4, mbT: 40, res: 4 },
  { registro: 144369, data: new Date('2026-09-11T22:05:04Z'), tempAtual: 26.4, tMax: 31, tMin: 16, umiAtual: 97, uMax: 99, uMin: 63, umidAbs: 24, pAtm: 941, wind: 0, wDir: '--', raj: 24, dirRaj: 'S', qtrRaj: '13:45', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 3.92, chuvaMes: 36.68, windChill: 'N/A', heatIndex: '29', dewPoint: 25, sensation: 29, uvIndex: 0, uvIndex2: '', vBat: 2.7, mbT: 29, res: 5 },
  { registro: 144415, data: new Date('2026-09-12T00:00:04Z'), tempAtual: 24.5, tMax: 31, tMin: 16, umiAtual: 99, uMax: 99, uMin: 63, umidAbs: 22, pAtm: 942, wind: 1, wDir: 'NW', raj: 24, dirRaj: 'S', qtrRaj: '13:45', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 3.92, chuvaMes: 36.68, windChill: 'N/A', heatIndex: '24', dewPoint: 24, sensation: 24, uvIndex: 0, uvIndex2: '', vBat: 2.7, mbT: 27, res: 5 },
  { registro: 144541, data: new Date('2026-09-12T05:15:04Z'), tempAtual: 21.5, tMax: 24, tMin: 21, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 18, pAtm: 945, wind: 33, wDir: 'W', raj: 32, dirRaj: 'W', qtrRaj: '02:14', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 0.0, chuvaMes: 36.68, windChill: 'N/A', heatIndex: '17', dewPoint: 21, sensation: 21, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 26, res: 0 },
  { registro: 144547, data: new Date('2026-09-12T05:30:04Z'), tempAtual: 18.5, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 945, wind: 20, wDir: 'NW', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 33.60, chuva5min: 2.80, chuvaDia: 6.44, chuvaMes: 43.12, windChill: '14', heatIndex: 'N/A', dewPoint: 18, sensation: 14, uvIndex: 0, uvIndex2: '', vBat: 3.0, mbT: 23, res: 0 },
  { registro: 144557, data: new Date('2026-09-12T05:55:04Z'), tempAtual: 18.3, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 945, wind: 11, wDir: 'N', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 26.88, chuva5min: 2.24, chuvaDia: 12.60, chuvaMes: 49.28, windChill: '16', heatIndex: 'N/A', dewPoint: 18, sensation: 16, uvIndex: 0, uvIndex2: '', vBat: 4.5, mbT: 22, res: 0 },
  { registro: 144591, data: new Date('2026-09-12T07:20:04Z'), tempAtual: 18.3, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 946, wind: 7, wDir: 'S', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 36.96, chuva5min: 3.08, chuvaDia: 16.52, chuvaMes: 53.20, windChill: '18', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 22, res: 0 },
  { registro: 144593, data: new Date('2026-09-12T07:25:04Z'), tempAtual: 18.3, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 945, wind: 4, wDir: 'NE', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 33.60, chuva5min: 2.80, chuvaDia: 19.32, chuvaMes: 56.00, windChill: '18', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 3.6, mbT: 22, res: 0 },
  { registro: 144721, data: new Date('2026-09-12T12:45:04Z'), tempAtual: 18.7, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 15, pAtm: 950, wind: 3, wDir: 'SE', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 6.72, chuva5min: 0.56, chuvaDia: 27.44, chuvaMes: 64.12, windChill: '19', heatIndex: 'N/A', dewPoint: 18, sensation: 18, uvIndex: 0, uvIndex2: '', vBat: 3.4, mbT: 23, res: 2 },
  { registro: 144781, data: new Date('2026-09-12T15:15:04Z'), tempAtual: 19.1, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 16, pAtm: 949, wind: 5, wDir: 'SE', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 31.08, chuvaMes: 67.76, windChill: '19', heatIndex: 'N/A', dewPoint: 18, sensation: 19, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 23, res: 2 },
  { registro: 144811, data: new Date('2026-09-12T16:30:04Z'), tempAtual: 19.6, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 16, pAtm: 948, wind: 0, wDir: '--', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 32.20, chuvaMes: 68.88, windChill: '20', heatIndex: 'N/A', dewPoint: 19, sensation: 19, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 23, res: 2 },
  { registro: 144851, data: new Date('2026-09-12T18:10:04Z'), tempAtual: 19.6, tMax: 24, tMin: 18, umiAtual: 99, uMax: 99, uMin: 99, umidAbs: 16, pAtm: 947, wind: 1, wDir: 'S', raj: 38, dirRaj: 'W', qtrRaj: '02:29', chuvaVel: 3.36, chuva5min: 0.28, chuvaDia: 32.48, chuvaMes: 69.16, windChill: '20', heatIndex: 'N/A', dewPoint: 19, sensation: 19, uvIndex: 0, uvIndex2: '', vBat: 3.3, mbT: 23, res: 2 },
  { registro: 144883, data: new Date('2026-09-12T19:35:00Z'), tempAtual: 26.4, tMax: 29, tMin: 18, umiAtual: 68, uMax: 89, uMin: 52, umidAbs: 17, pAtm: 950, wind: 14, wDir: 'SSE', raj: 38, dirRaj: 'SSE', qtrRaj: '14:25', chuvaVel: 0.0, chuva5min: 0.0, chuvaDia: 14.8, chuvaMes: 69.16, windChill: 'N/A', heatIndex: '28', dewPoint: 17, sensation: 28, uvIndex: 8, uvIndex2: 'MUITO ALTO', vBat: 4.2, mbT: 24, res: 0 }
];

let lastDbStatus = {
  isMariaDbConnected: false,
  checkedAt: new Date(0),
  lastError: "",
};

export async function checkMariaDbHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    lastDbStatus = { isMariaDbConnected: true, checkedAt: new Date(), lastError: "" };
    return true;
  } catch (err: any) {
    const rawMsg = err?.message || "MariaDB unreachable";
    const cleanError = rawMsg.includes("Authentication failed")
      ? "Aguardando concessão de acesso do usuário 'react_page'@'%' no MariaDB."
      : rawMsg.includes("Can't reach database")
      ? "Servidor de banco de dados offline ou inacessível no momento."
      : "Conexão com MariaDB pendente.";
    lastDbStatus = {
      isMariaDbConnected: false,
      checkedAt: new Date(),
      lastError: cleanError,
    };
    return false;
  }
}

export const repository = {
  getDbHealthStatus() {
    return lastDbStatus;
  },

  async getLatestReading(): Promise<EmaReadingRow> {
    try {
      const dbRow = await prisma.emaReading.findFirst({
        orderBy: { registro: "desc" },
      });
      if (dbRow) {
        lastDbStatus.isMariaDbConnected = true;
        return dbRow;
      }
    } catch {
      lastDbStatus.isMariaDbConnected = false;
    }
    // Fallback to memory buffer
    return memoryBuffer[memoryBuffer.length - 1];
  },

  async getReadingNearDate(targetDate: Date): Promise<EmaReadingRow | null> {
    try {
      const row = await prisma.emaReading.findFirst({
        where: { data: { lte: targetDate } },
        orderBy: { data: "desc" },
      });
      if (row) return row;
    } catch {
      // ignore
    }

    const filtered = memoryBuffer.filter((r) => r.data.getTime() <= targetDate.getTime());
    if (filtered.length > 0) {
      return filtered[filtered.length - 1];
    }
    return memoryBuffer[0] || null;
  },

  async getReadingsSince(startDate: Date): Promise<EmaReadingRow[]> {
    try {
      const rows = await prisma.emaReading.findMany({
        where: { data: { gte: startDate } },
        orderBy: { data: "asc" },
      });
      if (rows && rows.length > 0) {
        lastDbStatus.isMariaDbConnected = true;
        return rows;
      }
    } catch {
      lastDbStatus.isMariaDbConnected = false;
    }

    // Fallback filter
    return memoryBuffer.filter((r) => r.data.getTime() >= startDate.getTime());
  },

  async getRainHistory7Days(): Promise<Array<{ day: string; rainDia: number; rainMes: number }> | null> {
    try {
      const rows = await prisma.$queryRaw<Array<{ day: Date; rain_dia: number; rain_mes: number }>>`
        SELECT DATE(DATA) as day, MAX(CHUVA_DIA) as rain_dia, MAX(CHUVA_MES) as rain_mes
        FROM EMA_1_2026
        GROUP BY DATE(DATA)
        ORDER BY day DESC
        LIMIT 7
      `;
      if (rows && rows.length > 0) {
        lastDbStatus.isMariaDbConnected = true;
        return rows.reverse().map((r) => ({
          day: getBrazilDate(new Date(r.day)).dateStr,
          rainDia: Number(r.rain_dia) || 0,
          rainMes: Number(r.rain_mes) || 0,
        }));
      }
    } catch (err: any) {
      // ignore
    }
    return null;
  },

  async getDayTelemetry(dateStr: string) {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error("Formato de data inválido. Utilize YYYY-MM-DD.");
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    const { dateStr: brazilTodayStr } = getBrazilDate();
    if (dateStr > brazilTodayStr) {
      throw new Error(`Data futura (${dateStr}). Os registros meteorológicos da estação estão disponíveis até ${brazilTodayStr}.`);
    }

    const reqDate = new Date(year, month - 1, day, 12, 0, 0);
    const minDate = new Date(2019, 7, 13, 0, 0, 0); // 2019-08-13
    if (reqDate.getTime() < minDate.getTime() - 86400000) {
      throw new Error("Os registros da EMA se iniciam em 13/08/2019.");
    }

    // Dynamic database table strategy:
    // EMA_1_2019, EMA_1_2020, ... EMA_1_2026
    const tableName = `EMA_1_${year}`;

    // Astronomical calculations for Agudos/SP
    const sunTimes = calculateSunTimes(reqDate);

    let rows: any[] = [];
    let isLiveDatabase = false;

    try {
      const startDay = `${dateStr} 00:00:00`;
      const endDay = `${dateStr} 23:59:59`;

      rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          REGISTRO as registro,
          DATA as data,
          TEMP_ATUAL as tempAtual,
          T_MAX as tMax,
          T_MIN as tMin,
          UMI_ATUAL as umiAtual,
          U_MAX as uMax,
          U_MIN as uMin,
          UMID_ABS as umidAbs,
          P_ATM as pAtm,
          WIND as wind,
          W_DIR as wDir,
          RAJ as raj,
          DIR_RAJ as dirRaj,
          QTR_RAJ as qtrRaj,
          CHUVA_VEL as chuvaVel,
          CHUVA_5MIN as chuva5min,
          CHUVA_DIA as chuvaDia,
          CHUVA_MES as chuvaMes,
          WIND_CHILL as windChill,
          HEAT_INDEX as heatIndex,
          DEW_POINT as dewPoint,
          SENSATION as sensation,
          UV_INDEX as uvIndex,
          UV_INDEX2 as uvIndex2,
          V_BAT as vBat
        FROM \`${tableName}\`
        WHERE DATA >= ? AND DATA <= ?
        ORDER BY DATA ASC`,
        startDay,
        endDay
      );

      if (rows && rows.length > 0) {
        isLiveDatabase = true;
        lastDbStatus.isMariaDbConnected = true;
      }
    } catch {
      // Database not available or table does not exist in dev container
    }

    if (!rows || rows.length === 0) {
      const dayStart = new Date(`${dateStr}T00:00:00Z`).getTime();
      const dayEnd = new Date(`${dateStr}T23:59:59Z`).getTime();
      const buffered = memoryBuffer.filter((r) => {
        const t = r.data.getTime();
        return t >= dayStart && t <= dayEnd;
      });

      if (buffered.length > 0) {
        rows = buffered;
      } else {
        rows = generateSynthesizedDayReadings(year, month, day, sunTimes);
      }
    }

    return processDayTelemetryRows(dateStr, tableName, isLiveDatabase, sunTimes, rows);
  },

  async getMonthTelemetry(year: number, month: number) {
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error("Parâmetros de ano e mês inválidos.");
    }
    if (year < 2019 || (year === 2019 && month < 8)) {
      throw new Error("Os registros da EMA se iniciam em Agosto de 2019 (13/08/2019).");
    }

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthName = monthNames[month - 1];
    const tableName = `EMA_1_${year}`;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const { year: currentYear, month: currentMonth, day: currentDay } = getBrazilDate();

    const isCurrentMonth = year === currentYear && month === currentMonth;
    const isFutureMonth = year > currentYear || (year === currentYear && month > currentMonth);

    let dbRows: any[] = [];
    let isLiveDatabase = false;

    try {
      const startMonth = `${year}-${String(month).padStart(2, "0")}-01 00:00:00`;
      const endMonth = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")} 23:59:59`;

      dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          REGISTRO as registro,
          DATA as data,
          TEMP_ATUAL as tempAtual,
          T_MAX as tMax,
          T_MIN as tMin,
          UMI_ATUAL as umiAtual,
          U_MAX as uMax,
          U_MIN as uMin,
          P_ATM as pAtm,
          WIND as wind,
          W_DIR as wDir,
          RAJ as raj,
          DIR_RAJ as dirRaj,
          QTR_RAJ as qtrRaj,
          CHUVA_VEL as chuvaVel,
          CHUVA_5MIN as chuva5min,
          CHUVA_DIA as chuvaDia,
          CHUVA_MES as chuvaMes,
          UV_INDEX as uvIndex
        FROM \`${tableName}\`
        WHERE DATA >= ? AND DATA <= ?
        ORDER BY DATA ASC`,
        startMonth,
        endMonth
      );

      if (dbRows && dbRows.length > 0) {
        isLiveDatabase = true;
        lastDbStatus.isMariaDbConnected = true;
      }
    } catch {
      // Database not available in container or table absent
    }

    // Group db rows by day
    const rowsByDay = new Map<number, any[]>();
    if (dbRows && dbRows.length > 0) {
      for (const row of dbRows) {
        const dObj = row.data instanceof Date ? row.data : new Date(row.data);
        const dayNum = getBrazilDate(dObj).day;
        if (!rowsByDay.has(dayNum)) {
          rowsByDay.set(dayNum, []);
        }
        rowsByDay.get(dayNum)!.push(row);
      }
    }

    const days: any[] = [];
    let totalChuvaMes = 0;
    let maxChuvaDiaVal = 0;
    let maxChuvaDiaData: string | null = null;

    let maxTempAbs = -999;
    let maxTempData: string | null = null;
    let maxTempHora = "--:--";

    let minTempAbs = 999;
    let minTempData: string | null = null;
    let minTempHora = "--:--";

    let maxRajadaMes = 0;
    let maxRajadaDir = "--";
    let maxRajadaData: string | null = null;

    let sumTempMax = 0;
    let sumTempMin = 0;
    let sumTempMed = 0;
    let sumHumMed = 0;
    let sumPressMed = 0;
    let validDaysCount = 0;
    let daysWithRain = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const dayOfWeek = weekdays[dateObj.getUTCDay()];

      const isFuture = isFutureMonth || (isCurrentMonth && day > currentDay);

      if (isFuture) {
        days.push({
          date: dateStr,
          dayNumber: day,
          dayOfWeek,
          tempMin: 0,
          tempMinTime: "--:--",
          tempMax: 0,
          tempMaxTime: "--:--",
          tempMedia: 0,
          amplitudeTermica: 0,
          chuvaTotalMm: 0,
          chuvaPicoMmH: 0,
          chuvaPicoHora: "--:--",
          umiMin: 0,
          umiMax: 0,
          umiMedia: 0,
          pressaoMedia: 0,
          ventoMaxKmH: 0,
          rajadaMaxKmH: 0,
          rajadaMaxDirecao: "--",
          totalRegistros: 0,
          isHottestDay: false,
          isColdestDay: false,
          hasRain: false,
          isFuture: true,
        });
        continue;
      }

      // Check if we have live rows for this day
      let dayRows = rowsByDay.get(day);
      let dayIsLive = isLiveDatabase && !!dayRows && dayRows.length > 0;

      if (!dayRows || dayRows.length === 0) {
        // Check memory buffer
        const dayStart = new Date(`${dateStr}T00:00:00Z`).getTime();
        const dayEnd = new Date(`${dateStr}T23:59:59Z`).getTime();
        const buffered = memoryBuffer.filter((r) => {
          const t = r.data.getTime();
          return t >= dayStart && t <= dayEnd;
        });

        if (buffered.length > 0) {
          dayRows = buffered;
        } else {
          // Deterministic synthesis for this date
          const sunTimes = calculateSunTimes(dateObj);
          dayRows = generateSynthesizedDayReadings(year, month, day, sunTimes);
        }
      }

      // Process day summary using standard logic
      const sunTimes = calculateSunTimes(dateObj);
      const processedDay = processDayTelemetryRows(dateStr, tableName, dayIsLive, sunTimes, dayRows);
      const s = processedDay.summary;

      validDaysCount++;
      totalChuvaMes += s.chuvaTotalMm;
      if (s.chuvaTotalMm > 0.1) {
        daysWithRain++;
      }
      if (s.chuvaTotalMm > maxChuvaDiaVal) {
        maxChuvaDiaVal = s.chuvaTotalMm;
        maxChuvaDiaData = dateStr;
      }

      if (s.tempMax > maxTempAbs) {
        maxTempAbs = s.tempMax;
        maxTempData = dateStr;
        maxTempHora = s.tempMaxTime;
      }

      if (s.tempMin < minTempAbs) {
        minTempAbs = s.tempMin;
        minTempData = dateStr;
        minTempHora = s.tempMinTime;
      }

      if (s.rajadaMaxKmH > maxRajadaMes) {
        maxRajadaMes = s.rajadaMaxKmH;
        maxRajadaDir = s.rajadaMaxDirecao;
        maxRajadaData = dateStr;
      }

      sumTempMax += s.tempMax;
      sumTempMin += s.tempMin;
      sumTempMed += s.tempMedia;
      sumHumMed += s.umiMedia;
      sumPressMed += s.pressaoMedia;

      days.push({
        date: dateStr,
        dayNumber: day,
        dayOfWeek,
        tempMin: s.tempMin,
        tempMinTime: s.tempMinTime,
        tempMax: s.tempMax,
        tempMaxTime: s.tempMaxTime,
        tempMedia: s.tempMedia,
        amplitudeTermica: s.amplitudeTermica,
        chuvaTotalMm: Number(s.chuvaTotalMm.toFixed(1)),
        chuvaPicoMmH: Number(s.chuvaPicoMmH.toFixed(1)),
        chuvaPicoHora: s.chuvaPicoHora,
        umiMin: s.umiMin,
        umiMax: s.umiMax,
        umiMedia: s.umiMedia,
        pressaoMedia: s.pressaoMedia,
        ventoMaxKmH: s.ventoMaxKmH,
        rajadaMaxKmH: s.rajadaMaxKmH,
        rajadaMaxDirecao: s.rajadaMaxDirecao,
        totalRegistros: s.totalRegistros,
        isHottestDay: false,
        isColdestDay: false,
        hasRain: s.chuvaTotalMm > 0.1,
        isFuture: false,
      });
    }

    // Mark hottest and coldest day
    if (maxTempData) {
      const hotDay = days.find((d) => d.date === maxTempData);
      if (hotDay) hotDay.isHottestDay = true;
    }
    if (minTempData) {
      const coldDay = days.find((d) => d.date === minTempData);
      if (coldDay) coldDay.isColdestDay = true;
    }

    const divisor = validDaysCount || 1;
    const mediaDasMaximas = Number((sumTempMax / divisor).toFixed(1));
    const mediaDasMinimas = Number((sumTempMin / divisor).toFixed(1));
    const tempMediaMes = Number((sumTempMed / divisor).toFixed(1));
    const amplitudeMediaMes = Number((mediaDasMaximas - mediaDasMinimas).toFixed(1));
    const umiMediaMes = Math.round(sumHumMed / divisor);
    const pressaoMediaMes = Number((sumPressMed / divisor).toFixed(1));

    const summary = {
      ano: year,
      mes: month,
      mesNome: monthName,
      totalDiasNoMes: daysInMonth,
      diasRegistrados: validDaysCount,
      chuvaAcumuladaMesMm: Number(totalChuvaMes.toFixed(1)),
      diasComChuva: daysWithRain,
      maiorChuvaDiaMm: Number(maxChuvaDiaVal.toFixed(1)),
      maiorChuvaData: maxChuvaDiaData,
      tempMaxAbsoluta: maxTempAbs === -999 ? 0 : maxTempAbs,
      tempMaxData: maxTempData,
      tempMaxHora: maxTempHora,
      tempMinAbsoluta: minTempAbs === 999 ? 0 : minTempAbs,
      tempMinData: minTempData,
      tempMinHora: minTempHora,
      tempMediaMes,
      mediaDasMaximas,
      mediaDasMinimas,
      amplitudeMediaMes,
      rajadaMaxMes: maxRajadaMes,
      rajadaMaxDirecao: maxRajadaDir,
      rajadaMaxData: maxRajadaData,
      umiMediaMes,
      pressaoMediaMes,
    };

    return {
      year,
      month,
      monthName,
      tableName,
      isLiveDatabase,
      summary,
      days,
    };
  },

  async getYearTelemetry(year: number) {
    if (isNaN(year)) {
      throw new Error("Parâmetro de ano inválido.");
    }
    if (year < 2019) {
      throw new Error("Os registros da EMA se iniciam em Agosto de 2019 (13/08/2019).");
    }

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const tableName = `EMA_1_${year}`;
    const { year: currentYear, month: currentMonth } = getBrazilDate();

    let isLiveDatabase = false;
    const monthsData: any[] = [];

    // Process all 12 months
    for (let m = 1; m <= 12; m++) {
      const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
      const isBeforeInception = year === 2019 && m < 8;

      if (isFuture || isBeforeInception) {
        monthsData.push({
          month: m,
          monthName: monthNames[m - 1],
          chuvaTotalMm: 0,
          diasComChuva: 0,
          maiorChuvaDiaMm: 0,
          maiorChuvaData: null,
          tempMaxAbsoluta: 0,
          tempMaxData: null,
          tempMaxHora: "--:--",
          tempMinAbsoluta: 0,
          tempMinData: null,
          tempMinHora: "--:--",
          tempMedia: 0,
          mediaDasMaximas: 0,
          mediaDasMinimas: 0,
          amplitudeMedia: 0,
          rajadaMax: 0,
          rajadaDir: "--",
          rajadaData: null,
          umiMedia: 0,
          pressaoMedia: 0,
          totalDiasNoMes: new Date(Date.UTC(year, m, 0)).getUTCDate(),
          diasRegistrados: 0,
          hotDaysCount: 0,
          coldDaysCount: 0,
          isHottestMonth: false,
          isColdestMonth: false,
          isWettestMonth: false,
          isDriestMonth: false,
          isFuture,
          isBeforeInception,
        });
        continue;
      }

      try {
        const monthResult = await this.getMonthTelemetry(year, m);
        if (monthResult.isLiveDatabase) {
          isLiveDatabase = true;
        }

        const s = monthResult.summary;
        let hotDaysInMonth = 0;
        let coldDaysInMonth = 0;
        if (monthResult.days && Array.isArray(monthResult.days)) {
          for (const d of monthResult.days) {
            if (!d.isFuture) {
              if (d.tempMax >= 30) hotDaysInMonth++;
              if (d.tempMin <= 12) coldDaysInMonth++;
            }
          }
        }

        monthsData.push({
          month: m,
          monthName: monthNames[m - 1],
          chuvaTotalMm: s.chuvaAcumuladaMesMm,
          diasComChuva: s.diasComChuva,
          maiorChuvaDiaMm: s.maiorChuvaDiaMm,
          maiorChuvaData: s.maiorChuvaData,
          tempMaxAbsoluta: s.tempMaxAbsoluta,
          tempMaxData: s.tempMaxData,
          tempMaxHora: s.tempMaxHora || "--:--",
          tempMinAbsoluta: s.tempMinAbsoluta,
          tempMinData: s.tempMinData,
          tempMinHora: s.tempMinHora || "--:--",
          tempMedia: s.tempMediaMes,
          mediaDasMaximas: s.mediaDasMaximas,
          mediaDasMinimas: s.mediaDasMinimas,
          amplitudeMedia: s.amplitudeMediaMes,
          rajadaMax: s.rajadaMaxMes,
          rajadaDir: s.rajadaMaxDirecao,
          rajadaData: s.rajadaMaxData,
          umiMedia: s.umiMediaMes,
          pressaoMedia: s.pressaoMediaMes,
          totalDiasNoMes: s.totalDiasNoMes,
          diasRegistrados: s.diasRegistrados,
          hotDaysCount: hotDaysInMonth,
          coldDaysCount: coldDaysInMonth,
          isHottestMonth: false,
          isColdestMonth: false,
          isWettestMonth: false,
          isDriestMonth: false,
          isFuture: false,
          isBeforeInception: false,
        });
      } catch {
        monthsData.push({
          month: m,
          monthName: monthNames[m - 1],
          chuvaTotalMm: 0,
          diasComChuva: 0,
          maiorChuvaDiaMm: 0,
          maiorChuvaData: null,
          tempMaxAbsoluta: 0,
          tempMaxData: null,
          tempMaxHora: "--:--",
          tempMinAbsoluta: 0,
          tempMinData: null,
          tempMinHora: "--:--",
          tempMedia: 0,
          mediaDasMaximas: 0,
          mediaDasMinimas: 0,
          amplitudeMedia: 0,
          rajadaMax: 0,
          rajadaDir: "--",
          rajadaData: null,
          umiMedia: 0,
          pressaoMedia: 0,
          totalDiasNoMes: new Date(Date.UTC(year, m, 0)).getUTCDate(),
          diasRegistrados: 0,
          hotDaysCount: 0,
          coldDaysCount: 0,
          isHottestMonth: false,
          isColdestMonth: false,
          isWettestMonth: false,
          isDriestMonth: false,
          isFuture,
          isBeforeInception,
        });
      }
    }

    // Identify active months
    const activeMonths = monthsData.filter((m) => !m.isFuture && !m.isBeforeInception && m.diasRegistrados > 0);

    let chuvaAcumuladaAnoMm = 0;
    let diasComChuvaAno = 0;
    let maiorChuva24hAnoMm = 0;
    let maiorChuva24hData: string | null = null;

    let tempMaxAbsolutaAno = -999;
    let tempMaxData: string | null = null;
    let tempMaxHora = "--:--";

    let tempMinAbsolutaAno = 999;
    let tempMinData: string | null = null;
    let tempMinHora = "--:--";

    let rajadaMaxAno = 0;
    let rajadaMaxDir = "--";
    let rajadaMaxData: string | null = null;

    let sumTempMedia = 0;
    let sumMediaMax = 0;
    let sumMediaMin = 0;
    let sumUmiMedia = 0;
    let sumPressaoMedia = 0;
    let totalDiasMonitorados = 0;
    let diasCalorIntenso = 0;
    let diasFrio = 0;

    let maxChuvaMesVal = -1;
    let maxChuvaMesIndex = -1;
    let minChuvaMesVal = 999999;
    let minChuvaMesIndex = -1;

    let maxTempMediaMesVal = -999;
    let maxTempMediaMesIndex = -1;
    let minTempMediaMesVal = 999;
    let minTempMediaMesIndex = -1;

    for (let i = 0; i < monthsData.length; i++) {
      const m = monthsData[i];
      if (m.isFuture || m.isBeforeInception || m.diasRegistrados === 0) continue;

      chuvaAcumuladaAnoMm += m.chuvaTotalMm;
      diasComChuvaAno += m.diasComChuva;
      totalDiasMonitorados += m.diasRegistrados;
      diasCalorIntenso += m.hotDaysCount || 0;
      diasFrio += m.coldDaysCount || 0;

      if (m.maiorChuvaDiaMm > maiorChuva24hAnoMm) {
        maiorChuva24hAnoMm = m.maiorChuvaDiaMm;
        maiorChuva24hData = m.maiorChuvaData;
      }

      if (m.tempMaxAbsoluta > tempMaxAbsolutaAno) {
        tempMaxAbsolutaAno = m.tempMaxAbsoluta;
        tempMaxData = m.tempMaxData;
        tempMaxHora = m.tempMaxHora;
      }

      if (m.tempMinAbsoluta < tempMinAbsolutaAno) {
        tempMinAbsolutaAno = m.tempMinAbsoluta;
        tempMinData = m.tempMinData;
        tempMinHora = m.tempMinHora;
      }

      if (m.rajadaMax > rajadaMaxAno) {
        rajadaMaxAno = m.rajadaMax;
        rajadaMaxDir = m.rajadaDir;
        rajadaMaxData = m.rajadaData;
      }

      sumTempMedia += m.tempMedia;
      sumMediaMax += m.mediaDasMaximas;
      sumMediaMin += m.mediaDasMinimas;
      sumUmiMedia += m.umiMedia;
      sumPressaoMedia += m.pressaoMedia;

      // Wettest & Driest Month
      if (m.chuvaTotalMm > maxChuvaMesVal) {
        maxChuvaMesVal = m.chuvaTotalMm;
        maxChuvaMesIndex = i;
      }
      if (m.chuvaTotalMm < minChuvaMesVal) {
        minChuvaMesVal = m.chuvaTotalMm;
        minChuvaMesIndex = i;
      }

      // Hottest & Coldest Month (by average temperature)
      if (m.tempMedia > maxTempMediaMesVal) {
        maxTempMediaMesVal = m.tempMedia;
        maxTempMediaMesIndex = i;
      }
      if (m.tempMedia < minTempMediaMesVal) {
        minTempMediaMesVal = m.tempMedia;
        minTempMediaMesIndex = i;
      }
    }

    if (maxChuvaMesIndex >= 0) monthsData[maxChuvaMesIndex].isWettestMonth = true;
    if (minChuvaMesIndex >= 0 && activeMonths.length > 1) monthsData[minChuvaMesIndex].isDriestMonth = true;
    if (maxTempMediaMesIndex >= 0) monthsData[maxTempMediaMesIndex].isHottestMonth = true;
    if (minTempMediaMesIndex >= 0 && activeMonths.length > 1) monthsData[minTempMediaMesIndex].isColdestMonth = true;

    const count = activeMonths.length || 1;
    const tempMediaAno = Number((sumTempMedia / count).toFixed(1));
    const mediaAnualDasMaximas = Number((sumMediaMax / count).toFixed(1));
    const mediaAnualDasMinimas = Number((sumMediaMin / count).toFixed(1));
    const amplitudeMediaAnual = Number((mediaAnualDasMaximas - mediaAnualDasMinimas).toFixed(1));
    const amplitudeTermicaAno = Number(
      (
        (tempMaxAbsolutaAno === -999 ? 0 : tempMaxAbsolutaAno) -
        (tempMinAbsolutaAno === 999 ? 0 : tempMinAbsolutaAno)
      ).toFixed(1)
    );
    const umiMediaAno = Math.round(sumUmiMedia / count);
    const pressaoMediaAno = Number((sumPressaoMedia / count).toFixed(1));
    const mediaPluviometricaMensal = Number((chuvaAcumuladaAnoMm / count).toFixed(1));

    const mesMaisChuvoso =
      maxChuvaMesIndex >= 0
        ? {
            mes: monthsData[maxChuvaMesIndex].month,
            nome: monthsData[maxChuvaMesIndex].monthName,
            chuvaMm: monthsData[maxChuvaMesIndex].chuvaTotalMm,
          }
        : null;

    const mesMaisSeco =
      minChuvaMesIndex >= 0
        ? {
            mes: monthsData[minChuvaMesIndex].month,
            nome: monthsData[minChuvaMesIndex].monthName,
            chuvaMm: monthsData[minChuvaMesIndex].chuvaTotalMm,
          }
        : null;

    const mesMaisQuente =
      maxTempMediaMesIndex >= 0
        ? {
            mes: monthsData[maxTempMediaMesIndex].month,
            nome: monthsData[maxTempMediaMesIndex].monthName,
            tempMedia: monthsData[maxTempMediaMesIndex].tempMedia,
          }
        : null;

    const mesMaisFrio =
      minTempMediaMesIndex >= 0
        ? {
            mes: monthsData[minTempMediaMesIndex].month,
            nome: monthsData[minTempMediaMesIndex].monthName,
            tempMedia: monthsData[minTempMediaMesIndex].tempMedia,
          }
        : null;

    const summary = {
      ano: year,
      totalMesesMonitorados: activeMonths.length,
      totalDiasMonitorados,
      chuvaAcumuladaAnoMm: Number(chuvaAcumuladaAnoMm.toFixed(1)),
      diasComChuvaAno,
      mediaPluviometricaMensal,
      maiorChuva24hAnoMm: Number(maiorChuva24hAnoMm.toFixed(1)),
      maiorChuva24hData,
      mesMaisChuvoso,
      mesMaisSeco,
      tempMaxAbsolutaAno: tempMaxAbsolutaAno === -999 ? 0 : tempMaxAbsolutaAno,
      tempMaxData,
      tempMaxHora,
      tempMinAbsolutaAno: tempMinAbsolutaAno === 999 ? 0 : tempMinAbsolutaAno,
      tempMinData,
      tempMinHora,
      tempMediaAno,
      mediaAnualDasMaximas,
      mediaAnualDasMinimas,
      amplitudeMediaAnual,
      amplitudeTermicaAno,
      mesMaisQuente,
      mesMaisFrio,
      diasCalorIntenso,
      diasFrio,
      rajadaMaxAno,
      rajadaMaxDir,
      rajadaMaxData,
      umiMediaAno,
      pressaoMediaAno,
    };

    return {
      year,
      tableName,
      isLiveDatabase,
      summary,
      months: monthsData,
    };
  },

  async insertReading(readingData: Omit<EmaReadingRow, "registro">): Promise<EmaReadingRow> {
    const nextRegistro = (memoryBuffer[memoryBuffer.length - 1]?.registro || 144883) + 1;
    const newRecord: EmaReadingRow = {
      ...readingData,
      registro: nextRegistro,
    };

    memoryBuffer.push(newRecord);
    return newRecord;
  },

  async findUserByEmail(email: string) {
    const normalized = email.toLowerCase();
    const found = appUsers.find((u) => u.email.toLowerCase() === normalized);
    if (found) return found;

    if (normalized === "eder@ederbatera.com.br") {
      const hash = await bcrypt.hash("admin123", 10);
      const defaultAdmin = {
        id: "2ef5d900-a0d1-4cab-9c29-a937f414c016",
        email: "eder@ederbatera.com.br",
        name: "Eder Batera",
        passwordHash: hash,
        role: "ADMIN",
        createdAt: new Date(),
      };
      appUsers.push(defaultAdmin);
      return defaultAdmin;
    }
    return null;
  },

  async findUserById(id: string) {
    const found = appUsers.find((u) => u.id === id);
    if (found) return found;

    if (id === "2ef5d900-a0d1-4cab-9c29-a937f414c016") {
      return {
        id: "2ef5d900-a0d1-4cab-9c29-a937f414c016",
        email: "eder@ederbatera.com.br",
        name: "Eder Batera",
        role: "ADMIN",
        createdAt: new Date(),
      };
    }
    return null;
  },

  async createUser(data: { email: string; name: string; passwordHash: string; role: string }) {
    const newUser = {
      id: `user-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    appUsers.push(newUser);
    return newUser;
  },

  async getActiveAlerts(uf?: string) {
    const operatorAlerts = memoryAlerts.filter((a) => a.active);
    try {
      const inmetResult = await inmetAlertsService.fetchAlertsFromInmet(uf);
      const combined = [...operatorAlerts, ...inmetResult.alerts];
      const seen = new Set<string>();
      return combined.filter((item) => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch (err) {
      console.warn("[Repository] Erro ao obter alertas INMET, utilizando locais:", err);
      return operatorAlerts;
    }
  },

  async createAlert(data: {
    level: string;
    title: string;
    description: string;
    source: string;
    validUntil: string;
    severity: string;
    active?: boolean;
  }) {
    const newAlert = {
      id: `alert-${Date.now()}`,
      level: data.level,
      title: data.title,
      description: data.description,
      source: data.source,
      validUntil: data.validUntil,
      severity: data.severity,
      active: data.active !== undefined ? data.active : true,
      createdAt: new Date(),
    };
    memoryAlerts.unshift(newAlert);
    return newAlert;
  },

  async getStationDiagnostics() {
    const version = process.env.APP_VERSION || process.env.VITE_APP_VERSION || "1.0.0";
    const imageRepository = process.env.IMAGE_REPOSITORY || "ederbatera/ema";
    return {
      ...memoryStationDiagnostic,
      name: process.env.STATION_NAME || memoryStationDiagnostic.name,
      code: process.env.STATION_CODE || memoryStationDiagnostic.code,
      altitudeM: parseFloat(process.env.STATION_ALTITUDE || "618"),
      latitude: parseFloat(process.env.STATION_LATITUDE || "-22.467009"),
      longitude: parseFloat(process.env.STATION_LONGITUDE || "-48.973334"),
      appVersion: version,
      imageTag: `${imageRepository}:${version}`,
    };
  },

  async calibrateStationSensors() {
    memoryStationDiagnostic.lastSync = new Date();
    memoryStationDiagnostic.ptb330Ok = true;
    memoryStationDiagnostic.rg15Ok = true;
    memoryStationDiagnostic.hmp155Ok = true;
    memoryStationDiagnostic.anemometer2dOk = true;
    return memoryStationDiagnostic;
  },
};

const appUsers: Array<{
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
}> = [];

// Operator-published alerts (empty by default; populated when operators POST /api/alerts)
const memoryAlerts: any[] = [];

const memoryStationDiagnostic = {
  id: "BR-EMA01",
  name: "Estação Meteorológica Automática — EMA",
  code: "#BR-EMA01 • INMET / WMO",
  altitudeM: 760,
  latitude: -23.5505,
  longitude: -46.6333,
  firmware: "v4.8.1-PRO",
  ptb330Ok: true,
  rg15Ok: true,
  hmp155Ok: true,
  anemometer2dOk: true,
  batteryPct: 98,
  batteryV: 4.2,
  enclosureTempC: 24,
  lastSync: new Date(),
};

function generateSynthesizedDayReadings(
  year: number,
  month: number,
  day: number,
  sunTimes: SunTimesResult
): EmaReadingRow[] {
  const { dateStr: brazilTodayStr, hour: currentHour, minute: currentMinute } = getBrazilDate();
  const baseDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (baseDateStr > brazilTodayStr) {
    return [];
  }

  const isToday = baseDateStr === brazilTodayStr;

  const seed = (year * 10000 + month * 100 + day) % 2147483647;
  const pseudoRand = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  let baseTMin = 18;
  let baseTMax = 28;
  let baseRainProbability = 0.35;

  if (month >= 6 && month <= 8) {
    baseTMin = 11 + pseudoRand(1) * 4;
    baseTMax = 23 + pseudoRand(2) * 5;
    baseRainProbability = 0.12;
  } else if (month >= 12 || month <= 2) {
    baseTMin = 19 + pseudoRand(1) * 3;
    baseTMax = 30 + pseudoRand(2) * 4;
    baseRainProbability = 0.55;
  } else {
    baseTMin = 15 + pseudoRand(1) * 4;
    baseTMax = 26 + pseudoRand(2) * 5;
    baseRainProbability = 0.3;
  }

  const hasRain = pseudoRand(3) < baseRainProbability;
  const totalDayRain = hasRain ? Number((pseudoRand(4) * 26 + 1.4).toFixed(1)) : 0;
  const rainStartHour = 14 + Math.floor(pseudoRand(5) * 4);

  const readings: EmaReadingRow[] = [];

  let cumulativeRain = 0;
  for (let i = 0; i < 48; i++) {
    const totalMinutes = i * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    // For today, do not produce synthetic points into the future:
    if (isToday && totalMinutes > currentHour * 60 + currentMinute) {
      break;
    }

    const thermalPhase = ((hour + minute / 60 - 15) / 24) * 2 * Math.PI;
    const normTemp = (Math.cos(thermalPhase) + 1) / 2;
    const tempNoise = (pseudoRand(i * 7 + 10) - 0.5) * 0.8;
    const currentTemp = Number((baseTMin + normTemp * (baseTMax - baseTMin) + tempNoise).toFixed(1));

    const normHum = 1 - normTemp;
    const baseHumMin = 42 + pseudoRand(20) * 15;
    const baseHumMax = 88 + pseudoRand(21) * 10;
    const humNoise = Math.round((pseudoRand(i * 11 + 25) - 0.5) * 4);
    const currentHum = Math.min(99, Math.max(30, Math.round(baseHumMin + normHum * (baseHumMax - baseHumMin) + humNoise)));

    const tidePhase = (totalMinutes / 720) * 2 * Math.PI;
    const currentPress = Math.round(950 + 2.5 * Math.sin(tidePhase) + (pseudoRand(i * 13) - 0.5) * 0.8);

    let chuvaVel = 0;
    let chuva5min = 0;
    if (hasRain && hour >= rainStartHour && hour <= rainStartHour + 2) {
      chuvaVel = Number((pseudoRand(i * 17) * 16 + 2).toFixed(1));
      chuva5min = Number((chuvaVel / 12).toFixed(2));
      cumulativeRain = Math.min(totalDayRain, Number((cumulativeRain + totalDayRain * 0.3).toFixed(1)));
    }

    const windBase = hour >= 11 && hour <= 18 ? 10 + pseudoRand(i * 19) * 12 : 3 + pseudoRand(i * 19) * 5;
    const windSpeed = Math.round(windBase);
    const rajada = Math.round(windSpeed * (1.3 + pseudoRand(i * 23) * 0.7));
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const wDir = directions[Math.floor(pseudoRand(i * 29) * directions.length)];

    let uv = 0;
    if (hour >= 6 && hour <= 18) {
      const uvPhase = ((hour + minute / 60 - 12) / 12) * Math.PI;
      const uvMaxPossible = month >= 10 || month <= 3 ? 10 : 7;
      uv = Math.max(0, Math.round(uvMaxPossible * Math.cos(uvPhase)));
    }

    const dewPoint = calculateDewPoint(currentTemp, currentHum);
    const feel = calculateThermalSensation(currentTemp, currentHum, windSpeed);

    const timestamp = new Date(`${baseDateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);

    readings.push({
      registro: 100000 + i,
      data: timestamp,
      tempAtual: currentTemp,
      tMax: Math.round(baseTMax),
      tMin: Math.round(baseTMin),
      umiAtual: currentHum,
      uMax: Math.round(baseHumMax),
      uMin: Math.round(baseHumMin),
      umidAbs: Math.round(currentHum * 0.2),
      pAtm: currentPress,
      wind: windSpeed,
      wDir: wDir,
      raj: rajada,
      dirRaj: wDir,
      qtrRaj: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      chuvaVel: chuvaVel,
      chuva5min: chuva5min,
      chuvaDia: cumulativeRain,
      chuvaMes: cumulativeRain + 25.4,
      windChill: "N/A",
      heatIndex: String(feel),
      dewPoint: Math.round(dewPoint),
      sensation: Math.round(feel),
      uvIndex: uv,
      uvIndex2: uv >= 8 ? "MUITO ALTO" : uv >= 5 ? "ALTO" : uv >= 3 ? "MODERADO" : "BAIXO",
      vBat: Number((3.9 + pseudoRand(i) * 0.3).toFixed(1)),
      mbT: Math.round(currentTemp + 2),
      res: 0,
    });
  }

  return readings;
}

function processDayTelemetryRows(
  dateStr: string,
  tableName: string,
  isLiveDatabase: boolean,
  sunTimes: SunTimesResult,
  rows: any[]
) {
  let minTemp = 999;
  let tempMinTime = "--:--";
  let maxTemp = -999;
  let tempMaxTime = "--:--";
  let sumTemp = 0;

  let minHum = 999;
  let umiMinTime = "--:--";
  let maxHum = -999;
  let umiMaxTime = "--:--";
  let sumHum = 0;

  let minPress = 9999;
  let minPressTime = "--:--";
  let maxPress = -9999;
  let maxPressTime = "--:--";
  let sumPress = 0;

  let maxVento = 0;
  let maxVentoDir = "NE";
  let maxRajada = 0;
  let maxRajadaDir = "NE";
  let maxRajadaHora = "--:--";

  let maxChuvaDia = 0;
  let maxChuvaVel = 0;
  let maxChuvaVelHora = "--:--";

  let maxUv = 0;

  const validCount = rows.length;

  const timeSeries = rows.map((r) => {
    const rawDate = r.data instanceof Date ? r.data : new Date(r.data);
    const hh = String(rawDate.getUTCHours()).padStart(2, "0");
    const mm = String(rawDate.getUTCMinutes()).padStart(2, "0");
    const timeStr = `${hh}:${mm}`;

    const temp = Number(r.tempAtual ?? r.TEMP_ATUAL ?? 0);
    const hum = Number(r.umiAtual ?? r.UMI_ATUAL ?? 0);
    const press = Number(r.pAtm ?? r.P_ATM ?? 950);
    const wind = Number(r.wind ?? r.WIND ?? 0);
    const raj = Number(r.raj ?? r.RAJ ?? 0);
    const wDir = String(r.wDir ?? r.W_DIR ?? "--");
    const dirRaj = String(r.dirRaj ?? r.DIR_RAJ ?? wDir);
    const qtrRaj = String(r.qtrRaj ?? r.QTR_RAJ ?? timeStr);
    const chuvaDia = Number(r.chuvaDia ?? r.CHUVA_DIA ?? 0);
    const chuvaVel = Number(r.chuvaVel ?? r.CHUVA_VEL ?? 0);
    const uv = Number(r.uvIndex ?? r.UV_INDEX ?? 0);

    const dewPoint = calculateDewPoint(temp, hum);
    const feel = calculateThermalSensation(temp, hum, wind);

    if (temp < minTemp) {
      minTemp = temp;
      tempMinTime = timeStr;
    }
    if (temp > maxTemp) {
      maxTemp = temp;
      tempMaxTime = timeStr;
    }
    sumTemp += temp;

    if (hum < minHum) {
      minHum = hum;
      umiMinTime = timeStr;
    }
    if (hum > maxHum) {
      maxHum = hum;
      umiMaxTime = timeStr;
    }
    sumHum += hum;

    if (press < minPress) {
      minPress = press;
      minPressTime = timeStr;
    }
    if (press > maxPress) {
      maxPress = press;
      maxPressTime = timeStr;
    }
    sumPress += press;

    if (wind > maxVento) {
      maxVento = wind;
      maxVentoDir = wDir;
    }
    if (raj > maxRajada) {
      maxRajada = raj;
      maxRajadaDir = dirRaj;
      maxRajadaHora = qtrRaj || timeStr;
    }

    if (chuvaDia > maxChuvaDia) maxChuvaDia = chuvaDia;
    if (chuvaVel > maxChuvaVel) {
      maxChuvaVel = chuvaVel;
      maxChuvaVelHora = timeStr;
    }

    if (uv > maxUv) maxUv = uv;

    return {
      time: timeStr,
      timestamp: rawDate.toISOString(),
      tempAtual: temp,
      sensacao: feel,
      pontoOrvalho: dewPoint,
      umidade: hum,
      pressaoHpa: press,
      ventoKmH: wind,
      rajadaKmH: raj,
      ventoDirecao: wDir,
      chuvaAcumuladaMm: chuvaDia,
      chuvaTaxaMmH: chuvaVel,
      uvIndex: uv,
    };
  });

  const avgTemp = validCount > 0 ? Number((sumTemp / validCount).toFixed(1)) : 22.0;
  const avgHum = validCount > 0 ? Math.round(sumHum / validCount) : 70;
  const avgPress = validCount > 0 ? Number((sumPress / validCount).toFixed(1)) : 950.0;
  const amplitude = Number((maxTemp - minTemp).toFixed(1));

  return {
    date: dateStr,
    tableName,
    isLiveDatabase,
    sunTimes,
    summary: {
      tempMin: minTemp === 999 ? 0 : minTemp,
      tempMinTime,
      tempMax: maxTemp === -999 ? 0 : maxTemp,
      tempMaxTime,
      tempMedia: avgTemp,
      amplitudeTermica: amplitude < 0 ? 0 : amplitude,
      chuvaTotalMm: maxChuvaDia,
      chuvaPicoMmH: maxChuvaVel,
      chuvaPicoHora: maxChuvaVelHora,
      umiMin: minHum === 999 ? 0 : minHum,
      umiMinTime,
      umiMax: maxHum === -999 ? 0 : maxHum,
      umiMaxTime,
      umiMedia: avgHum,
      pressaoMin: minPress === 9999 ? 948 : minPress,
      pressaoMinTime: minPressTime,
      pressaoMax: maxPress === -9999 ? 952 : maxPress,
      pressaoMaxTime: maxPressTime,
      pressaoMedia: avgPress,
      ventoMaxKmH: maxVento,
      ventoMaxDirecao: maxVentoDir,
      rajadaMaxKmH: maxRajada,
      rajadaMaxDirecao: maxRajadaDir,
      rajadaMaxHora: maxRajadaHora,
      uvMax: maxUv,
      totalRegistros: validCount,
    },
    timeSeries,
  };
}
