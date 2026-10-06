import "dotenv/config";
import { PrismaClient } from "@prisma/client";

function cleanEnvString(val?: string, defaultVal = ""): string {
  if (!val) return defaultVal;
  const trimmed = val.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || defaultVal;
}

// Ensure DATABASE_URL is properly sanitized and constructed from discrete variables if needed
function ensureDatabaseUrl(): string {
  const host = cleanEnvString(process.env.DB_HOST, "localhost");
  const port = cleanEnvString(process.env.DB_PORT, "3306");
  const user = cleanEnvString(process.env.DB_USER, "root");
  const pass = cleanEnvString(process.env.DB_PASSWORD, "");
  const dbName = cleanEnvString(process.env.DB_NAME, "eder_estacao");
  const ssl = cleanEnvString(process.env.DB_SSL, "false") === "true";

  let url = cleanEnvString(process.env.DATABASE_URL);

  // If url does not start with mysql:// (e.g. wrapped in quotes or missing)
  if (!url || !url.startsWith("mysql://")) {
    const sslParam = ssl ? "?sslmode=prefer" : "";
    const authPart = pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}` : encodeURIComponent(user);
    url = `mysql://${authPart}@${host}:${port}/${dbName}${sslParam}`;
  } else if (process.env.DB_HOST && !url.includes(`@${host}:`)) {
    // DB_HOST was explicitly defined (e.g., direct IP or docker gateway), update host in existing URL
    url = url.replace(/@([^:/]+):(\d+)/, `@${host}:$2`);
  }

  // Ensure connection pool parameters are optimized for remote database over public internet
  if (!url.includes("pool_timeout=")) {
    url += (url.includes("?") ? "&" : "?") + "pool_timeout=30";
  }
  if (!url.includes("connect_timeout=")) {
    url += (url.includes("?") ? "&" : "?") + "connect_timeout=30";
  }
  if (!url.includes("connection_limit=")) {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=5";
  }

  const masked = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:••••••••@");
  console.log(`[Database] Alvo de conexão configurado: ${masked}`);

  // Ensure process.env.DATABASE_URL is cleanly set for Prisma Rust engine env lookup
  process.env.DATABASE_URL = url;
  return url;
}

const activeDbUrl = ensureDatabaseUrl();

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Returns a sanitized configuration object for UI diagnostics and verification.
 * Passwords and sensitive credentials are automatically obfuscated.
 */
export function getSanitizedDbConfig() {
  const host = cleanEnvString(process.env.DB_HOST, "localhost");
  const port = parseInt(cleanEnvString(process.env.DB_PORT, "3306"), 10);
  const user = cleanEnvString(process.env.DB_USER, "root");
  const dbName = cleanEnvString(process.env.DB_NAME, "eder_estacao");
  const dbUsers = cleanEnvString(process.env.DB_USERS_NAME, "usuarios");
  let table = cleanEnvString(process.env.DB_TABLE_READINGS, "EMA_1_2026");
  if (/^MA_1_/i.test(table)) {
    table = "E" + table.toUpperCase();
  }
  const tableUsers = cleanEnvString(process.env.DB_TABLE_USERS, "usuarios");
  const tableUsersLogs = cleanEnvString(process.env.DB_TABLE_USERS_LOGS, "usuarios_logs");
  const tableHistorical = cleanEnvString(process.env.DB_TABLE_HISTORICAL, "dados_historicos");
  const ssl = cleanEnvString(process.env.DB_SSL, "false") === "true";

  let maskedUrl = `mysql://${user}:••••••••@${host}:${port}/${dbName}`;
  if (process.env.DATABASE_URL) {
    maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":••••••••@");
  }

  return {
    provider: "MySQL / MariaDB",
    engine: "InnoDB",
    host,
    port,
    user,
    database: dbName,
    databaseUsers: dbUsers,
    tableReadings: table,
    tableUsers,
    tableUsersLogs,
    tableHistorical,
    ssl,
    maskedUrl,
    rawUrlConfigured: !!process.env.DATABASE_URL,
  };
}

/**
 * Executes a quick heartbeat query against MySQL/MariaDB to test connectivity and latency.
 */
export async function testDbConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  serverVersion?: string;
  error?: string;
  timestamp: string;
}> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() as version`;
    const latencyMs = Date.now() - start;
    const serverVersion = result[0]?.version || "MySQL/MariaDB";
    return {
      connected: true,
      latencyMs,
      serverVersion,
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const rawMsg = err?.message || "";
    const cleanError = rawMsg.includes("Authentication failed")
      ? "Servidor MariaDB respondeu em agudos.net:3306, mas as credenciais de 'react_page'@'%' precisam ser concedidas no MySQL/MariaDB."
      : rawMsg.includes("Can't reach database")
      ? "Não foi possível conectar ao servidor MySQL/MariaDB no endereço configurado."
      : (err?.message || "Não foi possível conectar ao servidor MySQL/MariaDB no endereço configurado.");
    return {
      connected: false,
      latencyMs,
      error: cleanError,
      timestamp,
    };
  }
}
