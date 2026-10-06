import { Router, Request, Response } from "express";
import { getSanitizedDbConfig, testDbConnection } from "../db";
import { getWeatherConfigFromEnv, pingWeatherApi, fetchExtendedForecast } from "../weatherApi";
import { inmetAlertsService } from "../inmetAlertsApi";
import { apiMonitor } from "../apiMonitor";

export const configRouter = Router();

/**
 * GET /api/config
 * Returns all runtime environment configurations (.env)
 * Credentials like passwords and API keys are masked for security.
 */
configRouter.get("/", (_req: Request, res: Response) => {
  const db = getSanitizedDbConfig();
  const weather = getWeatherConfigFromEnv();

  // Security sanitization guarantee: never expose raw secrets
  const sanitizedWeather = { ...weather };
  delete (sanitizedWeather as any).rawApiKey;

  const rawRedisUrl = process.env.REDIS_URL;
  const redisUrlMasked = rawRedisUrl
    ? rawRedisUrl.replace(/:([^:@]+)@/, ":••••••••@")
    : "Cache em memória ativo (fallback)";

  res.json({
    success: true,
    data: {
      database: db,
      weatherApi: sanitizedWeather,
      alertsApi: {
        apiUrl: process.env.INMET_ALERTS_API_URL || "https://radarmeteorologico.com.br/api/v1/alertas",
        uf: process.env.INMET_ALERTS_UF || "SP",
        cacheTtlSeconds: parseInt(process.env.INMET_ALERTS_CACHE_TTL || "600", 10),
      },
      system: {
        appVersion: process.env.APP_VERSION || process.env.VITE_APP_VERSION || "1.0.0",
        imageTag: `${process.env.IMAGE_REPOSITORY || "ederbatera/ema"}:${process.env.APP_VERSION || process.env.VITE_APP_VERSION || "1.0.0"}`,
        nodeEnv: process.env.NODE_ENV || "development",
        jwtConfigured: !!process.env.JWT_SECRET,
        redisUrlConfigured: !!process.env.REDIS_URL,
        redisHost: process.env.REDIS_HOST || "127.0.0.1",
        redisPort: process.env.REDIS_PORT || "6379",
        redisHasPassword: !!process.env.REDIS_PASSWORD,
        redisAuthDescription: process.env.REDIS_PASSWORD ? "Autenticação por senha ativa" : "Sem autenticação",
        redisRestrictedLocalhost: process.env.REDIS_RESTRICT_LOCALHOST !== "false",
        redisUrlMasked,
      },
    },
  });
});

/**
 * POST /api/config/test-db
 * Executes heartbeat test against MySQL / MariaDB using credentials from .env
 */
configRouter.post("/test-db", async (_req: Request, res: Response) => {
  const result = await testDbConnection();
  res.json({
    success: true,
    result,
  });
});

/**
 * POST /api/config/test-weather
 * Tests connection to the configured Weather Forecast API from .env / Open-Meteo
 */
configRouter.post("/test-weather", async (_req: Request, res: Response) => {
  const result = await pingWeatherApi();
  res.json({
    success: true,
    result,
  });
});

/**
 * POST /api/config/test-alerts
 * Tests connection to INMET Alerts API
 */
configRouter.post("/test-alerts", async (req: Request, res: Response) => {
  const uf = (req.body?.uf || req.query?.uf || "SP") as string;
  const result = await inmetAlertsService.pingAlertsApi(uf);
  res.json({
    success: true,
    result,
  });
});

/**
 * GET /api/config/api-monitor
 * Returns operational status, last call times, latencies, and recent call audit history for external APIs
 */
configRouter.get("/api-monitor", (_req: Request, res: Response) => {
  const status = apiMonitor.getStatus();
  res.json({
    success: true,
    data: status,
  });
});

/**
 * POST /api/config/api-monitor/clear-history
 * Clears the API call history ring buffer
 */
configRouter.post("/api-monitor/clear-history", (_req: Request, res: Response) => {
  apiMonitor.clearHistory();
  res.json({
    success: true,
    message: "Histórico de chamadas limpo com sucesso.",
  });
});

