import { Router, Request, Response } from "express";
import { repository } from "../repository";
import { redisCache } from "../redisCache";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";

export const stationRouter = Router();

/**
 * GET /api/station/diagnostics
 * Returns status of hardware sensors, firmware, battery, location
 */
stationRouter.get("/diagnostics", async (_req: Request, res: Response, next) => {
  try {
    const cacheKey = "ema:station:diagnostics";
    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const diag = await repository.getStationDiagnostics();
        return diag;
      },
      60,
      ["station"]
    );

    res.json({
      success: true,
      fromCache,
      cacheKey,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/station/version
 * Returns the active image tag and application version from environment (APP_VERSION)
 */
stationRouter.get("/version", (_req: Request, res: Response) => {
  const version = process.env.APP_VERSION || process.env.VITE_APP_VERSION || "1.0.0";
  const imageRepository = process.env.IMAGE_REPOSITORY || "ederbatera/ema";
  const imageTag = `${imageRepository}:${version}`;
  res.json({
    success: true,
    version,
    imageTag,
    imageRepository,
  });
});

/**
 * POST /api/station/calibrate
 * Calibrate zero of Barometer PTB330 (Protected)
 */
stationRouter.post(
  "/calibrate",
  authenticateJWT,
  requireRole(["ADMIN", "OPERATOR"]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const diag = await repository.calibrateStationSensors();

      await redisCache.invalidatePattern("ema:station:*");

      res.json({
        success: true,
        message: "Rotina de autodiagnóstico e calibração de zero do barômetro PTB330 executada com sucesso.",
        calibratedAt: new Date().toISOString(),
        operator: req.user?.email,
        diagnostic: diag,
      });
    } catch (err) {
      next(err);
    }
  }
);
