import "dotenv/config";
import "./server/db";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { authRouter } from "./server/routes/auth";
import { usersRouter } from "./server/routes/users";
import { telemetryRouter } from "./server/routes/telemetry";
import { alertsRouter } from "./server/routes/alerts";
import { cacheRouter } from "./server/routes/cache";
import { stationRouter } from "./server/routes/station";
import { configRouter } from "./server/routes/config";
import { errorHandler } from "./server/middleware/errorHandler";
import { seedDatabaseIfEmpty } from "./server/seedData";
import { initUserDatabase } from "./server/userService";
import { initWeatherHourlyScheduler } from "./server/weatherApi";
import { initHistoricalDatabase } from "./server/historicalService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Check (must be ready immediately for Docker swarm healthchecks)
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "MeteoPulse EMA Backend",
      timestamp: new Date().toISOString(),
      orm: "Prisma 5.22.0",
      cache: "Redis / In-Memory Cache with Auto-Invalidation",
      auth: "JWT (JSON Web Token)",
    });
  });

  // Mount RESTful Routers
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/telemetry", telemetryRouter);
  app.use("/api/alerts", alertsRouter);
  app.use("/api/cache", cacheRouter);
  app.use("/api/station", stationRouter);
  app.use("/api/config", configRouter);

  // Fallback 404 handler for unmatched /api/* routes so they NEVER fall through to Vite SPA HTML
  app.all("/api/*", (_req, res) => {
    res.status(404).json({
      success: false,
      error: "Endpoint da API não encontrado.",
    });
  });

  // Centralized Error Handling Middleware (must be after routes)
  app.use(errorHandler);

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`[EMA Backend] Servidor operacional em http://0.0.0.0:${PORT}`);

    // Asynchronous background boot tasks (non-blocking, ensuring healthcheck is instantly available)
    try {
      await initUserDatabase();
    } catch (err: any) {
      console.warn("[User Service] Background init warning:", err?.message || err);
    }

    try {
      await initHistoricalDatabase();
    } catch (err: any) {
      console.warn("[Historical] Background init warning:", err?.message || err);
    }

    try {
      await seedDatabaseIfEmpty();
    } catch (err: any) {
      console.warn("[EMA Seed] Background seed warning:", err?.message || err);
    }

    // Start hourly proactive weather synchronization scheduler (Google Weather API cache)
    initWeatherHourlyScheduler();
  });
}

startServer().catch((err) => {
  console.error("Falha fatal ao iniciar o servidor EMA:", err);
  process.exit(1);
});
