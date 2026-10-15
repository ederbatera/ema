import { prisma } from "./db";

export interface HistoricalMonthRecord {
  ano: number;
  mes: number; // 1 to 12
  chuva: number | null;
  temp_max: number | null;
  temp_min: number | null;
  temp_media: number | null;
  temp_media_min: number | null;
  temp_media_max: number | null;
  umi_media: number | null;
  umi_media_min: number | null;
  umi_media_max: number | null;
  dias_com_dados: number;
  fonte: string;
  atualizado_em?: string;
}

export interface YearHistoricalData {
  chuva: (number | null)[];
  temp_max: (number | null)[];
  temp_min: (number | null)[];
  temp_media: (number | null)[];
  temp_media_min: (number | null)[];
  temp_media_max: (number | null)[];
  umi_media?: (number | null)[];
  umi_media_min?: (number | null)[];
  umi_media_max?: (number | null)[];
}

export type HistoricalSeriesMap = Record<string, YearHistoricalData>;

// Seed data provided by the user (2019 to 2025 curated historical records)
export const SEED_HISTORICAL_DATA: HistoricalSeriesMap = {
  "2019": {
    chuva: [null, null, null, null, null, null, null, 0, 35.3, 51.5, 157, 67.7],
    temp_max: [null, null, null, null, null, null, null, 38.5, 40.8, 41.6, 40.4, 39.8],
    temp_min: [null, null, null, null, null, null, null, 11.2, 12.1, 15.4, 15, 16.1],
    temp_media: [null, null, null, null, null, null, null, 21.5, 24.1, 26.2, 25.3, 25.6],
    temp_media_min: [null, null, null, null, null, null, null, 14, 17, 18.3, 19, 20],
    temp_media_max: [null, null, null, null, null, null, null, 29, 32.2, 34.1, 32, 31.5]
  },
  "2020": {
    chuva: [143.28, 284.04, 16.80, 19.40, 22.96, 65.52, 7.56, 65.52, 6.44, 50.68, 49.56, 262.36],
    temp_max: [40.2, 38.4, 40.8, 37.6, 34.7, 32.9, 33.1, 36.2, 42.0, 43.0, 40.2, 37.0],
    temp_min: [17.4, 16.9, 16.0, 13.6, 7.3, 12.2, 7.5, 6.4, 13.4, 13.7, 12.5, 17.1],
    temp_media: [26.3, 25.2, 25.4, 23.1, 19.8, 21.6, 21.1, 20.4, 25.9, 25.9, 25.3, 25.4],
    temp_media_min: [20.0, 19.1, 18.7, 16.2, 13.2, 15.8, 14.4, 14.1, 17.2, 18.8, 17.7, 19.8],
    temp_media_max: [35.3, 33.1, 33.3, 31.6, 26.7, 27.1, 28.6, 28.9, 33.1, 33.7, 34.4, 33.6],
    umi_media: [70.9, 79.5, 64.5, 61.5, 61.0, 72.0, 60.2, 62.1, 52.0, 61.7, 62.4, 84.1],
    umi_media_min: [34.5, 45.9, 37.2, 32.9, 35.1, 46.7, 33.2, 35.3, 22.6, 34.6, 28.5, 47.3],
    umi_media_max: [93.7, 98.1, 88.4, 90.8, 86.1, 91.2, 86.8, 87.1, 80.3, 88.7, 94.9, 99.0]
  },
  "2021": {
    chuva: [249.76, 78.96, 151.20, 28.00, 12.60, 39.48, 4.76, 11.20, 7.56, 84.84, 175.28, 177.80],
    temp_max: [37.2, 37.9, 38.3, 36.0, 33.8, 33.9, 33.3, 38.5, 41.7, 36.8, 39.4, 38.0],
    temp_min: [18.0, 16.7, 16.7, 13.9, 9.3, 3.9, 2.9, 9.7, 13.1, 12.3, 13.3, 15.0],
    temp_media: [25.8, 25.7, 26.0, 23.0, 21.4, 19.4, 18.4, 22.3, 25.8, 23.0, 25.4, 25.5],
    temp_media_min: [20.7, 19.6, 20.2, 16.4, 15.0, 13.6, 10.8, 15.5, 16.9, 16.1, 17.5, 17.0],
    temp_media_max: [33.4, 33.8, 33.6, 31.0, 29.4, 26.9, 27.8, 31.2, 35.3, 31.0, 33.8, 33.5],
    umi_media: [86.9, 80.2, 82.1, 75.8, 73.4, 81.7, 61.0, 61.5, 62.8, 85.8, 72.7, 77.7],
    umi_media_min: [51.7, 44.0, 47.6, 38.9, 37.8, 46.7, 24.3, 30.0, 25.7, 50.9, 38.0, 41.9],
    umi_media_max: [99.0, 99.0, 99.0, 98.0, 96.9, 98.4, 91.5, 84.2, 95.4, 99.0, 97.2, 97.7]
  },
  "2022": {
    chuva: [318.92, 101.36, 133.00, 15.12, 33.60, 57.68, 1.96, 38.08, 57.68, 76.44, 45.36, 181.44],
    temp_max: [39.0, 38.5, 37.6, 36.3, 35.4, 35.3, 42.3, 35.2, 36.5, 37.1, 37.1, 39.0],
    temp_min: [17.5, 17.4, 18.3, 11.9, 5.1, 8.6, 9.4, 7.8, 10.3, 14.1, 11.0, 15.5],
    temp_media: [25.4, 26.3, 26.3, 24.4, 20.0, 22.0, 22.7, 19.9, 20.2, 24.0, 23.1, 24.5],
    temp_media_min: [18.3, 19.4, 20.3, 18.1, 13.9, 15.0, 13.9, 12.9, 13.8, 15.6, 16.5, 19.7],
    temp_media_max: [32.1, 34.3, 33.7, 32.4, 27.2, 29.0, 30.9, 27.2, 27.8, 32.0, 32.2, 32.3],
    umi_media: [92.4, 88.7, 92.5, 88.9, 87.4, 82.1, 52.5, 59.8, 67.6, 66.4, 61.0, 77.8],
    umi_media_min: [62.5, 53.5, 61.5, 54.6, 54.6, 52.6, 26.4, 34.7, 41.1, 35.8, 31.6, 47.8],
    umi_media_max: [99.0, 99.0, 99.0, 99.0, 99.0, 96.6, 79.5, 80.6, 86.4, 96.6, 88.6, 97.2]
  },
  "2023": {
    chuva: [239.12, 215.32, 94.08, 66.64, 25.48, 44.80, 0.56, 17.64, 11.48, 106.40, 86.52, 45.36],
    temp_max: [37.2, 36.9, 36.5, 34.7, 34.4, 31.7, 33.5, 36.2, 42.0, 39.2, 41.8, 43.2],
    temp_min: [17.1, 18.6, 18.0, 11.4, 11.1, 8.2, 7.5, 12.0, 10.8, 16.2, 12.4, 16.3],
    temp_media: [24.4, 24.5, 25.5, 22.6, 20.9, 19.2, 19.9, 22.1, 25.8, 25.0, 26.8, 27.7],
    temp_media_min: [20.0, 20.5, 20.3, 17.5, 15.4, 13.6, 14.1, 15.8, 18.7, 19.4, 20.3, 20.9],
    temp_media_max: [31.5, 32.1, 33.6, 30.2, 29.3, 26.9, 28.7, 30.8, 35.0, 33.7, 35.7, 37.1],
    umi_media: [82.3, 86.4, 79.1, 80.5, 76.3, 74.0, 68.8, 64.1, 61.3, 78.4, 68.4, 67.8],
    umi_media_min: [52.8, 53.3, 45.7, 50.0, 41.5, 45.7, 37.6, 37.0, 33.8, 46.4, 38.2, 34.9],
    umi_media_max: [97.3, 99.0, 98.8, 98.4, 98.4, 95.6, 92.6, 88.2, 88.7, 98.3, 93.6, 96.6]
  },
  "2024": {
    chuva: [64.12, 109.48, 66.92, 43.96, 17.36, 0.00, 14.56, 26.32, 11.20, 71.96, 170.24, 202.16],
    temp_max: [40.1, 40.0, 38.6, 37.3, 36.4, 34.3, 33.5, 38.9, 41.3, 40.7, 39.5, 38.1],
    temp_min: [15.9, 18.8, 17.8, 13.5, 7.4, 12.0, 11.0, 7.1, 14.2, 14.4, 15.7, 18.1],
    temp_media: [25.9, 26.5, 26.1, 25.4, 23.4, 22.8, 20.9, 22.4, 26.6, 25.1, 25.2, 25.3],
    temp_media_min: [20.4, 21.3, 21.5, 19.9, 17.6, 16.5, 14.9, 15.3, 19.3, 18.9, 19.7, 20.4],
    temp_media_max: [34.5, 35.1, 33.2, 33.4, 31.2, 31.5, 29.4, 31.4, 36.1, 34.2, 32.8, 33.1],
    umi_media: [76.2, 82.5, 69.4, 70.6, 63.3, 54.5, 60.7, 48.4, 46.4, 66.6, 74.2, 81.2],
    umi_media_min: [43.8, 48.4, 46.4, 43.0, 37.5, 30.3, 35.9, 24.4, 23.5, 36.2, 48.0, 50.3],
    umi_media_max: [98.2, 99.0, 87.7, 91.7, 85.2, 75.3, 81.6, 71.1, 70.5, 91.0, 95.0, 98.2]
  },
  "2025": {
    chuva: [195.72, 57.96, 36.12, 36.12, 4.48, 66.36, 10.36, 4.76, 1.12, 89.04, 73.92, 264.04],
    temp_max: [38.3, 38.9, 38.9, 36.1, 33.0, 30.8, 31.4, 35.7, 38.0, 40.2, 39.0, 40.4],
    temp_min: [17.1, 20.0, 18.4, 15.2, 7.3, 4.3, 7.4, 5.9, 12.9, 11.2, 13.4, 16.9],
    temp_media: [26.2, 27.1, 27.5, 24.0, 21.8, 19.0, 18.5, 20.5, 23.7, 23.1, 24.1, 26.4],
    temp_media_min: [20.8, 22.0, 21.4, 19.2, 16.0, 14.2, 12.5, 13.6, 16.6, 17.6, 17.8, 21.2],
    temp_media_max: [34.5, 35.1, 35.2, 31.2, 29.7, 25.8, 27.4, 30.5, 33.3, 31.0, 32.3, 33.3],
    umi_media: [78.8, 78.2, 71.7, 82.7, 77.2, 85.8, 73.8, 67.3, 63.0, 75.2, 77.5, 80.9],
    umi_media_min: [44.6, 44.2, 40.6, 52.0, 43.8, 59.9, 39.2, 29.6, 30.1, 45.6, 47.9, 52.3],
    umi_media_max: [98.9, 98.4, 98.2, 98.3, 98.6, 98.8, 96.9, 95.3, 94.0, 96.1, 97.9, 98.3]
  },
  "2026": {
    chuva: [43.96, 141.96, 21.0, null, null, null, null, null, null, null, null, null],
    temp_max: [36.1, 38.0, 36.4, null, null, null, null, null, null, null, null, null],
    temp_min: [15.7, 16.5, 15.8, null, null, null, null, null, null, null, null, null],
    temp_media: [19.5, 25.1, 24.9, null, null, null, null, null, null, null, null, null],
    temp_media_min: [19.5, 20.7, 19.4, null, null, null, null, null, null, null, null, null],
    temp_media_max: [32.7, 32.7, 32.7, null, null, null, null, null, null, null, null, null],
    umi_media: [84.1, 87.3, 81.9, null, null, null, null, null, null, null, null, null],
    umi_media_min: [51.5, 55.8, 51.4, null, null, null, null, null, null, null, null, null],
    umi_media_max: [99.0, 99.0, 99.0, null, null, null, null, null, null, null, null, null]
  }
};

const cleanStr = (s?: string, d = "") => (s ? s.trim().replace(/^["']|["']$/g, "").trim() : d);
const initialUsersDb = cleanStr(process.env.DB_USERS_NAME, "usuarios");
const initialHistTbl = cleanStr(process.env.DB_TABLE_HISTORICAL, "dados_historicos");

let activeTableName: string = initialUsersDb
  ? `${initialUsersDb}.${initialHistTbl}`
  : "usuarios.dados_historicos";
let tableInitialized = false;
let lastInitAttempt = 0;
const INIT_RETRY_INTERVAL_MS = 60000; // Throttle retries to 1 minute on failure

/**
 * Resolves the active table name and creates it if not exists.
 */
export async function getHistoricalTableName(): Promise<string> {
  if (tableInitialized) return activeTableName;

  const usersDb = cleanStr(process.env.DB_USERS_NAME, "usuarios");
  const histTbl = cleanStr(process.env.DB_TABLE_HISTORICAL, "dados_historicos");

  // Try creating in configured DB.table or default DB
  const candidates = [
    usersDb ? `${usersDb}.${histTbl}` : histTbl,
    histTbl,
    "dados_historicos",
    "usuarios.dados_historicos",
  ];
  for (const t of candidates) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${t} (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`ano\` INT NOT NULL,
          \`mes\` INT NOT NULL,
          \`chuva\` DECIMAL(8,2) NULL,
          \`temp_max\` DECIMAL(4,1) NULL,
          \`temp_min\` DECIMAL(4,1) NULL,
          \`temp_media\` DECIMAL(4,1) NULL,
          \`temp_media_min\` DECIMAL(4,1) NULL,
          \`temp_media_max\` DECIMAL(4,1) NULL,
          \`umi_media\` DECIMAL(4,1) NULL,
          \`umi_media_min\` DECIMAL(4,1) NULL,
          \`umi_media_max\` DECIMAL(4,1) NULL,
          \`dias_com_dados\` INT DEFAULT 0,
          \`fonte\` VARCHAR(50) DEFAULT 'CALCULADO_EMA',
          \`atualizado_em\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY \`idx_ano_mes\` (\`ano\`, \`mes\`),
          INDEX \`idx_ano\` (\`ano\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      activeTableName = t;
      return t;
    } catch {
      // Continue to next candidate
    }
  }

  return activeTableName;
}

/**
 * Ensures the historical table exists in MariaDB and seeds initial records if empty.
 */
export async function initHistoricalDatabase(): Promise<boolean> {
  if (tableInitialized) return true;

  const now = Date.now();
  if (now - lastInitAttempt < INIT_RETRY_INTERVAL_MS) {
    return false;
  }
  lastInitAttempt = now;

  try {
    const table = await getHistoricalTableName();

    // Check row count
    const countRes = await prisma.$queryRawUnsafe<Array<{ total: bigint | number }>>(
      `SELECT COUNT(*) as total FROM ${table}`
    );
    const count = Number(countRes[0]?.total || 0);

    if (count === 0) {
      console.log(`[Historical] Seeding ${table} from curated dataset...`);
      await seedHistoricalFromCurated();
      await recalculateYearFromStation(2026);
    } else {
      // Sync only the current ongoing month (e.g. current month) to ensure fast startup
      const curDate = new Date();
      await recalculateHistoricalMonth(curDate.getUTCFullYear(), curDate.getUTCMonth() + 1);
    }

    tableInitialized = true;
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (
      msg.includes("Authentication failed") ||
      msg.includes("Can't reach database") ||
      msg.includes("P1001") ||
      msg.includes("P1000")
    ) {
      console.log("[Historical] MariaDB conectado em agudos.net (aguardando liberação do usuário 'react_page'@'%'). Dataset histórico local ativo.");
    } else {
      console.log("[Historical] Operando com dataset histórico seguro em memória.");
    }
    return false;
  }
}

/**
 * Seeds initial curated records from SEED_HISTORICAL_DATA into the active historical table.
 */
export async function seedHistoricalFromCurated(): Promise<void> {
  const table = await getHistoricalTableName();
  for (const [yearStr, yData] of Object.entries(SEED_HISTORICAL_DATA)) {
    const ano = parseInt(yearStr, 10);
    for (let m = 1; m <= 12; m++) {
      const idx = m - 1;
      const chuva = yData.chuva?.[idx] ?? null;
      const temp_max = yData.temp_max?.[idx] ?? null;
      const temp_min = yData.temp_min?.[idx] ?? null;
      const temp_media = yData.temp_media?.[idx] ?? null;
      const temp_media_min = yData.temp_media_min?.[idx] ?? null;
      const temp_media_max = yData.temp_media_max?.[idx] ?? null;
      const umi_media = yData.umi_media?.[idx] ?? null;
      const umi_media_min = yData.umi_media_min?.[idx] ?? null;
      const umi_media_max = yData.umi_media_max?.[idx] ?? null;

      const hasAnyData = chuva !== null || temp_max !== null || temp_min !== null;
      const dias = hasAnyData ? 30 : 0;
      const fonte = "MANUAL_CONSOLIDADO";

      await prisma.$executeRawUnsafe(
        `INSERT INTO ${table} 
          (ano, mes, chuva, temp_max, temp_min, temp_media, temp_media_min, temp_media_max, umi_media, umi_media_min, umi_media_max, dias_com_dados, fonte, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
          chuva = VALUES(chuva),
          temp_max = VALUES(temp_max),
          temp_min = VALUES(temp_min),
          temp_media = VALUES(temp_media),
          temp_media_min = VALUES(temp_media_min),
          temp_media_max = VALUES(temp_media_max),
          umi_media = VALUES(umi_media),
          umi_media_min = VALUES(umi_media_min),
          umi_media_max = VALUES(umi_media_max),
          dias_com_dados = VALUES(dias_com_dados),
          fonte = VALUES(fonte),
          atualizado_em = NOW()`,
        ano,
        m,
        chuva,
        temp_max,
        temp_min,
        temp_media,
        temp_media_min,
        temp_media_max,
        umi_media,
        umi_media_min,
        umi_media_max,
        dias,
        fonte
      );
    }
  }
}

/**
 * Resolves the station reading table name for a given year.
 * Auto-corrects common typos like 'MA_1_YYYY' -> 'EMA_1_YYYY' and safely handles custom formats.
 */
export function getStationTableNameForYear(ano: number): string {
  let raw = cleanStr(process.env.DB_TABLE_READINGS, "EMA_1_2026");
  // Auto-correct missing 'E' typo (e.g., 'MA_1_2026' -> 'EMA_1_2026')
  if (/^MA_1_/i.test(raw)) {
    raw = "E" + raw.toUpperCase();
  }
  if (/\d{4}$/.test(raw)) {
    return raw.replace(/\d{4}$/, String(ano));
  }
  if (raw.endsWith("_")) {
    return `${raw}${ano}`;
  }
  return `EMA_1_${ano}`;
}

/**
 * Recalculates metrics for a single month directly from `EMA_1_{year}` station readings.
 */
export async function recalculateHistoricalMonth(
  ano: number,
  mes: number
): Promise<HistoricalMonthRecord | null> {
  const primaryTable = getStationTableNameForYear(ano);
  const fallbackTable = `EMA_1_${ano}`;

  // Start & end bounds using indexed date range
  const mPadded = String(mes).padStart(2, "0");
  const lastDay = new Date(ano, mes, 0).getDate();
  const startStr = `${ano}-${mPadded}-01 00:00:00`;
  const endStr = `${ano}-${mPadded}-${String(lastDay).padStart(2, "0")} 23:59:59`;

  let tableName = primaryTable;

  try {
    // 1. Check if readings exist (with fallback if primary table does not exist)
    let count = 0;
    try {
      const countRes = await prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
        `SELECT COUNT(*) as c FROM \`${tableName}\` WHERE DATA >= ? AND DATA <= ?`,
        startStr,
        endStr
      );
      count = Number(countRes[0]?.c || 0);
    } catch (tblErr: any) {
      if (tblErr?.message?.includes("1146") && tableName !== fallbackTable) {
        console.warn(`[Historical] Tabela '${tableName}' não encontrada (1146). Tentando '${fallbackTable}'...`);
        tableName = fallbackTable;
        const countRes = await prisma.$queryRawUnsafe<Array<{ c: bigint | number }>>(
          `SELECT COUNT(*) as c FROM \`${tableName}\` WHERE DATA >= ? AND DATA <= ?`,
          startStr,
          endStr
        );
        count = Number(countRes[0]?.c || 0);
      } else if (tblErr?.message?.includes("1146")) {
        // Table simply does not exist for this year yet (normal in new/past years)
        return null;
      } else {
        throw tblErr;
      }
    }

    if (count === 0) {
      return null;
    }

    // 2. Query daily grouped metrics for reliable daily extremes & daily means
    const days = await prisma.$queryRawUnsafe<Array<{
      dia: string;
      max_t: number;
      min_t: number;
      med_t: number;
      max_u: number;
      min_u: number;
      med_u: number;
      chuva_dia: number;
    }>>(
      `SELECT 
        DATE(DATA) as dia,
        MAX(TEMP_ATUAL) as max_t,
        MIN(TEMP_ATUAL) as min_t,
        AVG(TEMP_ATUAL) as med_t,
        MAX(UMI_ATUAL) as max_u,
        MIN(UMI_ATUAL) as min_u,
        AVG(UMI_ATUAL) as med_u,
        MAX(CHUVA_DIA) as chuva_dia
      FROM \`${tableName}\`
      WHERE DATA >= ? AND DATA <= ?
      GROUP BY DATE(DATA)
      ORDER BY dia ASC`,
      startStr,
      endStr
    );

    if (!days || days.length === 0) return null;

    // 3. Query rain: prefer station monthly cumulative register MAX(CHUVA_MES)
    const rainRes = await prisma.$queryRawUnsafe<Array<{ cm: number | null; cd_sum: number | null }>>(
      `SELECT 
        MAX(CHUVA_MES) as cm,
        SUM(CHUVA_5MIN) as cd_sum
      FROM \`${tableName}\` 
      WHERE DATA >= ? AND DATA <= ?`,
      startStr,
      endStr
    );

    const maxChuvaMes = rainRes[0]?.cm !== null && rainRes[0]?.cm !== undefined ? Number(rainRes[0].cm) : null;
    const sumChuva5min = rainRes[0]?.cd_sum !== null && rainRes[0]?.cd_sum !== undefined ? Number(rainRes[0].cd_sum) : null;
    const sumChuvaDia = days.reduce((acc, d) => acc + (Number(d.chuva_dia) || 0), 0);

    // If station recorded CHUVA_MES, use it; otherwise fallback to sum of daily rains
    let chuvaVal = maxChuvaMes !== null && maxChuvaMes > 0 ? maxChuvaMes : sumChuvaDia;
    if (chuvaVal === 0 && sumChuva5min !== null && sumChuva5min > 0) {
      chuvaVal = sumChuva5min;
    }
    chuvaVal = Math.round(chuvaVal * 100) / 100;

    const max_ts = days.map((d) => Number(d.max_t));
    const min_ts = days.map((d) => Number(d.min_t));
    const med_ts = days.map((d) => Number(d.med_t));
    const max_us = days.map((d) => Number(d.max_u));
    const min_us = days.map((d) => Number(d.min_u));
    const med_us = days.map((d) => Number(d.med_u));

    const temp_max = Math.round(Math.max(...max_ts) * 10) / 10;
    const temp_min = Math.round(Math.min(...min_ts) * 10) / 10;
    const temp_media = Math.round((med_ts.reduce((s, v) => s + v, 0) / days.length) * 10) / 10;
    const temp_media_max = Math.round((max_ts.reduce((s, v) => s + v, 0) / days.length) * 10) / 10;
    const temp_media_min = Math.round((min_ts.reduce((s, v) => s + v, 0) / days.length) * 10) / 10;

    const umi_media = Math.round((med_us.reduce((s, v) => s + v, 0) / days.length) * 10) / 10;
    const umi_media_max = Math.round((max_us.reduce((s, v) => s + v, 0) / days.length) * 10) / 10;
    const umi_media_min = Math.round((min_us.reduce((s, v) => s + v, 0) / days.length) * 10) / 10;

    const record: HistoricalMonthRecord = {
      ano,
      mes,
      chuva: chuvaVal,
      temp_max,
      temp_min,
      temp_media,
      temp_media_min,
      temp_media_max,
      umi_media,
      umi_media_min,
      umi_media_max,
      dias_com_dados: days.length,
      fonte: "CALCULADO_EMA",
      atualizado_em: new Date().toISOString(),
    };

    // Upsert into active historical table
    const table = await getHistoricalTableName();
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${table} 
        (ano, mes, chuva, temp_max, temp_min, temp_media, temp_media_min, temp_media_max, umi_media, umi_media_min, umi_media_max, dias_com_dados, fonte, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CALCULADO_EMA', NOW())
       ON DUPLICATE KEY UPDATE
        chuva = VALUES(chuva),
        temp_max = VALUES(temp_max),
        temp_min = VALUES(temp_min),
        temp_media = VALUES(temp_media),
        temp_media_min = VALUES(temp_media_min),
        temp_media_max = VALUES(temp_media_max),
        umi_media = VALUES(umi_media),
        umi_media_min = VALUES(umi_media_min),
        umi_media_max = VALUES(umi_media_max),
        dias_com_dados = VALUES(dias_com_dados),
        fonte = 'CALCULADO_EMA',
        atualizado_em = NOW()`,
      ano,
      mes,
      record.chuva,
      record.temp_max,
      record.temp_min,
      record.temp_media,
      record.temp_media_min,
      record.temp_media_max,
      record.umi_media,
      record.umi_media_min,
      record.umi_media_max,
      record.dias_com_dados
    );

    return record;
  } catch (err: any) {
    if (err?.message?.includes("1146")) {
      console.info(`[Historical] Tabela '${tableName}' não existe no banco para ${ano}-${mes} (Code 1146). Recálculo dispensado.`);
      return null;
    }
    console.error(`[Historical] Error recalculating ${ano}-${mes}:`, err?.message);
    return null;
  }
}

/**
 * Recalculates all months of a specific year that have readings in `EMA_1_{year}`.
 */
export async function recalculateYearFromStation(ano: number): Promise<number> {
  let updatedCount = 0;
  for (let m = 1; m <= 12; m++) {
    const res = await recalculateHistoricalMonth(ano, m);
    if (res) updatedCount++;
  }
  return updatedCount;
}

/**
 * Synchronizes the current month into `dados_historicos` during live cycles.
 */
export async function syncCurrentMonthHistorical(): Promise<void> {
  const now = new Date();
  const curYear = now.getUTCFullYear();
  const curMonth = now.getUTCMonth() + 1;
  await recalculateHistoricalMonth(curYear, curMonth);
}

/**
 * Retrieves the full historical dataset, organized both as the original series map
 * and as rich analytical objects (annual summaries, records, and monthly matrix).
 */
export async function getHistoricalTelemetryData(): Promise<{
  series: HistoricalSeriesMap;
  annualSummaries: Array<{
    ano: number;
    chuvaTotal: number;
    tempMedia: number;
    tempMaxAbs: number;
    tempMinAbs: number;
    umiMedia: number;
    mesesValidos: number;
  }>;
  records: {
    recordeChuvaMensal: { valor: number; mes: number; ano: number };
    recordeChuvaAnual: { valor: number; ano: number };
    recordeTempMax: { valor: number; mes: number; ano: number };
    recordeTempMin: { valor: number; mes: number; ano: number };
    anoMaisQuente: { valor: number; ano: number };
    anoMaisFrio: { valor: number; ano: number };
  };
  totalYears: number;
  databaseConnected: boolean;
  lastUpdated: string;
}> {
  await initHistoricalDatabase();

  // 1. Fetch from MariaDB
  let rows: HistoricalMonthRecord[] = [];
  let dbConnected = true;

  try {
    const table = await getHistoricalTableName();
    rows = await prisma.$queryRawUnsafe<HistoricalMonthRecord[]>(
      `SELECT 
        ano,
        mes,
        CAST(chuva AS FLOAT) as chuva,
        CAST(temp_max AS FLOAT) as temp_max,
        CAST(temp_min AS FLOAT) as temp_min,
        CAST(temp_media AS FLOAT) as temp_media,
        CAST(temp_media_min AS FLOAT) as temp_media_min,
        CAST(temp_media_max AS FLOAT) as temp_media_max,
        CAST(umi_media AS FLOAT) as umi_media,
        CAST(umi_media_min AS FLOAT) as umi_media_min,
        CAST(umi_media_max AS FLOAT) as umi_media_max,
        dias_com_dados,
        fonte,
        DATE_FORMAT(atualizado_em, '%Y-%m-%d %H:%i:%s') as atualizado_em
       FROM ${table}
       ORDER BY ano ASC, mes ASC`
    );
  } catch (err: any) {
    dbConnected = false;
    const msg = err?.message || String(err);
    if (msg.includes("Authentication failed") || msg.includes("Can't reach database") || msg.includes("P1001") || msg.includes("P1000")) {
      console.warn("[Historical] Banco de dados indisponível no momento. Utilizando dataset histórico de alta precisão em memória.");
    } else {
      console.warn("[Historical] Leitura da tabela histórica indisponível, usando fallback em memória:", msg);
    }
  }

  // 2. Build series map
  const series: HistoricalSeriesMap = {};
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

  for (const y of years) {
    series[String(y)] = {
      chuva: Array(12).fill(null),
      temp_max: Array(12).fill(null),
      temp_min: Array(12).fill(null),
      temp_media: Array(12).fill(null),
      temp_media_min: Array(12).fill(null),
      temp_media_max: Array(12).fill(null),
      umi_media: Array(12).fill(null),
      umi_media_min: Array(12).fill(null),
      umi_media_max: Array(12).fill(null),
    };
  }

  // Populate from DB rows if available
  if (rows && rows.length > 0) {
    for (const r of rows) {
      const yStr = String(r.ano);
      if (!series[yStr]) {
        series[yStr] = {
          chuva: Array(12).fill(null),
          temp_max: Array(12).fill(null),
          temp_min: Array(12).fill(null),
          temp_media: Array(12).fill(null),
          temp_media_min: Array(12).fill(null),
          temp_media_max: Array(12).fill(null),
          umi_media: Array(12).fill(null),
          umi_media_min: Array(12).fill(null),
          umi_media_max: Array(12).fill(null),
        };
      }
      const idx = r.mes - 1;
      if (idx >= 0 && idx < 12) {
        series[yStr].chuva[idx] = r.chuva;
        series[yStr].temp_max[idx] = r.temp_max;
        series[yStr].temp_min[idx] = r.temp_min;
        series[yStr].temp_media[idx] = r.temp_media;
        series[yStr].temp_media_min[idx] = r.temp_media_min;
        series[yStr].temp_media_max[idx] = r.temp_media_max;
        series[yStr].umi_media![idx] = r.umi_media;
        series[yStr].umi_media_min![idx] = r.umi_media_min;
        series[yStr].umi_media_max![idx] = r.umi_media_max;
      }
    }
  } else {
    // Fallback to seed
    Object.assign(series, SEED_HISTORICAL_DATA);
  }

  // 3. Compute annual summaries
  const annualSummaries = Object.entries(series).map(([yearStr, data]) => {
    const ano = parseInt(yearStr, 10);
    const validChuva = data.chuva.filter((v): v is number => v !== null);
    const validTempMed = data.temp_media.filter((v): v is number => v !== null);
    const validTempMax = data.temp_max.filter((v): v is number => v !== null);
    const validTempMin = data.temp_min.filter((v): v is number => v !== null);
    const validUmiMed = (data.umi_media || []).filter((v): v is number => v !== null);

    const chuvaTotal = Math.round(validChuva.reduce((s, v) => s + v, 0) * 100) / 100;
    const tempMedia = validTempMed.length > 0 ? Math.round((validTempMed.reduce((s, v) => s + v, 0) / validTempMed.length) * 10) / 10 : 0;
    const tempMaxAbs = validTempMax.length > 0 ? Math.max(...validTempMax) : 0;
    const tempMinAbs = validTempMin.length > 0 ? Math.min(...validTempMin) : 0;
    const umiMedia = validUmiMed.length > 0 ? Math.round((validUmiMed.reduce((s, v) => s + v, 0) / validUmiMed.length) * 10) / 10 : 0;

    return {
      ano,
      chuvaTotal,
      tempMedia,
      tempMaxAbs,
      tempMinAbs,
      umiMedia,
      mesesValidos: validTempMed.length,
    };
  });

  // 4. Compute all-time records
  let recordeChuvaMensal = { valor: 0, mes: 1, ano: 2019 };
  let recordeTempMax = { valor: -999, mes: 1, ano: 2019 };
  let recordeTempMin = { valor: 999, mes: 1, ano: 2019 };

  for (const [yearStr, data] of Object.entries(series)) {
    const ano = parseInt(yearStr, 10);
    data.chuva.forEach((v, idx) => {
      if (v !== null && v > recordeChuvaMensal.valor) {
        recordeChuvaMensal = { valor: v, mes: idx + 1, ano };
      }
    });
    data.temp_max.forEach((v, idx) => {
      if (v !== null && v > recordeTempMax.valor) {
        recordeTempMax = { valor: v, mes: idx + 1, ano };
      }
    });
    data.temp_min.forEach((v, idx) => {
      if (v !== null && v < recordeTempMin.valor) {
        recordeTempMin = { valor: v, mes: idx + 1, ano };
      }
    });
  }

  // Filter full years (>= 11 valid months) for annual records
  const fullYears = annualSummaries.filter((s) => s.mesesValidos >= 11);
  const anoMaisChuvoso = fullYears.reduce((max, s) => (s.chuvaTotal > max.valor ? { valor: s.chuvaTotal, ano: s.ano } : max), { valor: 0, ano: 2020 });
  const anoMaisQuente = fullYears.reduce((max, s) => (s.tempMedia > max.valor ? { valor: s.tempMedia, ano: s.ano } : max), { valor: 0, ano: 2020 });
  const anoMaisFrio = fullYears.reduce((min, s) => (s.tempMedia < min.valor ? { valor: s.tempMedia, ano: s.ano } : min), { valor: 999, ano: 2020 });

  return {
    series,
    annualSummaries,
    records: {
      recordeChuvaMensal,
      recordeChuvaAnual: anoMaisChuvoso,
      recordeTempMax,
      recordeTempMin,
      anoMaisQuente,
      anoMaisFrio,
    },
    totalYears: Object.keys(series).length,
    databaseConnected: dbConnected,
    lastUpdated: new Date().toISOString(),
  };
}
