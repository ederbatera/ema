import { Router, Request, Response } from "express";
import { repository } from "../repository";
import { redisCache } from "../redisCache";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const alertsRouter = Router();

/**
 * GET /api/alerts
 * Returns active weather warnings (cached in Redis)
 */
alertsRouter.get("/", async (req: Request, res: Response, next) => {
  try {
    const uf = typeof req.query.uf === "string" ? req.query.uf.toUpperCase().trim() : undefined;
    const cacheKey = uf ? `ema:alerts:active:${uf}` : "ema:alerts:active";

    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const alerts = await repository.getActiveAlerts(uf);
        return alerts;
      },
      300, // 5 min TTL in Redis
      ["alerts", "inmet"]
    );

    res.json({
      success: true,
      fromCache,
      cacheKey,
      total: Array.isArray(data) ? data.length : 0,
      fonte: "INMET — Instituto Nacional de Meteorologia (Tempo Real)",
      uf: uf || process.env.INMET_ALERTS_UF || "SP",
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/alerts
 * Publish a new alert (JWT protected - ADMIN or OPERATOR)
 * Automatically invalidates alert cache.
 */
alertsRouter.post(
  "/",
  authenticateJWT,
  requireRole(["ADMIN", "OPERATOR"]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const { level, title, description, source, validUntil, severity } = req.body;
      if (!title || !description) {
        throw new AppError("Título e descrição do alerta são obrigatórios.", 400);
      }

      const alert = await repository.createAlert({
        level: level || "ALERTA LARANJA • PERIGO",
        title,
        description,
        source: source || "Aviso Meteorológico Vigente — CPTEC / INMET",
        validUntil: validUntil || "22:00 BRT",
        severity: severity || "GRAU ELEVADO",
        active: true,
      });

      await redisCache.invalidatePattern("ema:alerts:*");

      res.status(201).json({
        success: true,
        message: "Alerta meteorológico publicado e cache invalidado.",
        alert,
      });
    } catch (err) {
      next(err);
    }
  }
);
