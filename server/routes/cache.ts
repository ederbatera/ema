import { Router, Request, Response } from "express";
import { redisCache } from "../redisCache";
import { getWeatherCacheDiagnostic } from "../weatherApi";

export const cacheRouter = Router();

/**
 * GET /api/cache/stats
 * Diagnostic and telemetry monitoring for the Redis & Disk cache layer
 */
cacheRouter.get("/stats", async (_req: Request, res: Response) => {
  const stats = redisCache.getStats();
  const weatherCache = await getWeatherCacheDiagnostic();
  res.json({
    success: true,
    data: {
      ...stats,
      weatherCache,
    },
  });
});

/**
 * POST /api/cache/clear
 * Invalidate specific key, pattern, or flush all
 */
cacheRouter.post("/clear", async (req: Request, res: Response) => {
  const { pattern, flushAll } = req.body;

  if (flushAll) {
    await redisCache.flush();
    res.json({
      success: true,
      message: "Cache Redis completamente esvaziado (FLUSHDB executado).",
      clearedKeys: "ALL",
    });
    return;
  }

  const targetPattern = pattern || "ema:*";
  const count = await redisCache.invalidatePattern(targetPattern);

  res.json({
    success: true,
    message: `Camada de invalidação acionada. ${count} chaves foram expurgadas com o padrão '${targetPattern}'.`,
    invalidatedKeysCount: count,
  });
});
