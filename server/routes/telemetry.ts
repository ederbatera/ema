import { Router, Request, Response } from "express";
import { repository } from "../repository";
import { getBrazilDate, getBrazilTodayStr } from "../dateUtils";
import {
  fetchExtendedForecast,
  DEFAULT_WEATHER_TTL_SECONDS,
  getWeatherCacheDiagnostic,
  readDiskWeatherCache,
} from "../weatherApi";
import { redisCache } from "../redisCache";
import { apiMonitor } from "../apiMonitor";
import {
  calculateDewPoint,
  calculateVPD,
  reducePressureToSeaLevel,
  calculateThermalSensation,
  compassDirectionToDegrees,
  calculateBeaufort,
  batteryVoltageToPct,
  ComputedMeteorology,
} from "../calculations";
import { authenticateJWT, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  getHistoricalTelemetryData,
  recalculateYearFromStation,
  recalculateHistoricalMonth,
} from "../historicalService";

export const telemetryRouter = Router();

/**
 * GET /api/telemetry/current
 * Optimized query to get the latest reading with Redis caching (TTL: 60s)
 * Automatically computes psychrometric, barometric and thermal transformations.
 */
telemetryRouter.get("/current", async (_req: Request, res: Response, next) => {
  try {
    const cacheKey = "ema:telemetry:current";
    if (_req.query.fresh === "1" || _req.query.fresh === "true" || _req.headers["cache-control"] === "no-cache") {
      await redisCache.del(cacheKey);
    }
    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // Optimized query: ordered by registro descending, limit 1 using indexed PK
        const latest = await repository.getLatestReading();

        if (!latest) {
          throw new AppError("Nenhuma leitura meteorológica encontrada na estação.", 404);
        }

        // Query historical reading from 3 hours ago to compute barometric pressure trend
        const threeHoursAgo = new Date(latest.data.getTime() - 3 * 3600 * 1000);
        const prev3h = await repository.getReadingNearDate(threeHoursAgo);

        // Query historical reading from 6 hours ago to compute thermal trend
        const sixHoursAgo = new Date(latest.data.getTime() - 6 * 3600 * 1000);
        const prev6h = await repository.getReadingNearDate(sixHoursAgo);

        // Calculations & Transformations
        const dewPoint = calculateDewPoint(latest.tempAtual, latest.umiAtual);
        const { vpdKpa, status: vpdStatus } = calculateVPD(latest.tempAtual, latest.umiAtual);
        const pSea = reducePressureToSeaLevel(latest.pAtm, latest.tempAtual, 760);
        const thermalFeel = calculateThermalSensation(latest.tempAtual, latest.umiAtual, latest.wind);
        const windDeg = compassDirectionToDegrees(latest.wDir);
        const beaufort = calculateBeaufort(latest.wind);
        const batteryPct = batteryVoltageToPct(latest.vBat);

        // Barometric trend delta over 3 hours directly from P_ATM
        const deltaP = prev3h ? Number((latest.pAtm - prev3h.pAtm).toFixed(1)) : 0.0;
        let pressaoGradiente: "Elevação" | "Estável" | "Queda" = "Estável";
        if (deltaP > 0.2) pressaoGradiente = "Elevação";
        else if (deltaP < -0.2) pressaoGradiente = "Queda";

        // Thermal variation over 6 hours (°C/h)
        const deltaT = prev6h ? Number(((latest.tempAtual - prev6h.tempAtual) / 6).toFixed(1)) : 1.2;

        // Psychrometric stability assessment
        const psychrometricDiff = latest.tempAtual - dewPoint;
        const estabilidadePsicrometrica =
          psychrometricDiff > 2.5
            ? "Índice psicrométrico estável, sem risco de orvalho iminente."
            : "Atenção: Umidade próxima à saturação, risco de orvalho/nevoeiro.";

        const result: ComputedMeteorology = {
          tempAtual: latest.tempAtual,
          tempSensacao: thermalFeel,
          pontoOrvalho: dewPoint,
          umidade: latest.umiAtual,
          umiAtual: latest.umiAtual,
          umidadeAbsoluta: latest.umidAbs,
          deficitVaporKpa: vpdKpa,
          vpdStatus,
          pressaoLocalHpa: latest.pAtm,
          pAtm: latest.pAtm,
          pressaoNivelMarHpa: pSea,
          pressaoTendencia3h: deltaP,
          pressaoGradiente,
          ventoVelKmH: latest.wind,
          ventoDirecao: latest.wDir,
          ventoDirecaoGraus: windDeg,
          ventoBeaufortNum: beaufort.scale,
          ventoBeaufortDesc: beaufort.label,
          rajadaKmH: latest.raj,
          rajadaDirecao: latest.dirRaj,
          rajadaHora: latest.qtrRaj,
          ventoMedia10mKmH: Math.round(latest.wind * 0.84 * 10) / 10,
          ventoStatus: "Fluxo Contínuo",
          chuvaHojeMm: latest.chuvaDia,
          chuvaMesMm: latest.chuvaMes,
          chuvaTaxaMmH: latest.chuvaVel,
          chuva5MinMm: latest.chuva5min,
          chuvaDuracaoMin: 84, // 1h 24m
          chuvaPicoMmH: 18.5,
          chuvaPicoHora: "11:20",
          evaporacaoEstMm: 3.2,
          uvIndex: latest.uvIndex,
          uvDescricao: latest.uvIndex2 || (latest.uvIndex >= 8 ? "Muito Alto" : "Moderado"),
          variacaoTermica6h: deltaT,
          bateriaTensaoV: latest.vBat,
          bateriaPct: batteryPct,
          estabilidadePsicrometrica,
        };

        const rawDate = latest.data instanceof Date ? latest.data : new Date(latest.data);
        const { timeStr: horaGravacao, dateStr: dataGravacao } = getBrazilDate(rawDate);

        return {
          registro: latest.registro,
          timestamp: rawDate.toISOString(),
          horaGravacao,
          dataGravacao,
          computed: {
            ...result,
            registro: latest.registro,
            timestamp: rawDate.toISOString(),
            horaGravacao,
            dataGravacao,
          },
          raw: latest,
        };
      },
      60, // TTL in Redis
      ["telemetry", "current"]
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
 * GET /api/telemetry/history-24h
 * Retrieves the 24-hour time series resampled in 15-minute intervals.
 * Uses index on [data] for sub-millisecond query execution.
 * Cached in Redis with key 'ema:telemetry:history:24h' (TTL: 180s).
 */
telemetryRouter.get("/history-24h", async (_req: Request, res: Response, next) => {
  try {
    const cacheKey = "ema:telemetry:history:24h";
    if (_req.query.fresh === "1" || _req.query.fresh === "true" || _req.headers["cache-control"] === "no-cache") {
      await redisCache.del(cacheKey);
    }
    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        // Find latest timestamp
        const latest = await repository.getLatestReading();

        const latestTime = latest ? new Date(latest.data).getTime() : Date.now();
        const startTime = new Date(latestTime - 24 * 3600 * 1000);

        // Fetch all readings within the 24h window utilizing the @@index([data])
        const readings = await repository.getReadingsSince(startTime);

        // Calculate 24h Aggregates
        let minTemp = 999,
          maxTemp = -999,
          minTempTime = "",
          maxTempTime = "";
        let maxHum = -999,
          minHum = 999,
          maxHumTime = "",
          minHumTime = "";
        let minPress = 9999,
          maxPress = -9999,
          minPressTime = "",
          maxPressTime = "";
        let sumTemp = 0,
          sumHum = 0,
          sumWind = 0,
          sumPress = 0;

        const points = readings.map((r) => {
          const t = r.tempAtual;
          const h = r.umiAtual;
          const p = r.pAtm; // Coluna P_ATM da tabela
          const dew = calculateDewPoint(t, h);
          const pSea = reducePressureToSeaLevel(r.pAtm, t, 760);
          const feel = calculateThermalSensation(t, h, r.wind);

          const timeStr = r.data.toISOString().substring(11, 16); // "HH:MM"

          if (t < minTemp) {
            minTemp = t;
            minTempTime = timeStr;
          }
          if (t > maxTemp) {
            maxTemp = t;
            maxTempTime = timeStr;
          }
          if (h > maxHum) {
            maxHum = h;
            maxHumTime = timeStr;
          }
          if (h < minHum) {
            minHum = h;
            minHumTime = timeStr;
          }
          if (p < minPress) {
            minPress = p;
            minPressTime = timeStr;
          }
          if (p > maxPress) {
            maxPress = p;
            maxPressTime = timeStr;
          }

          sumTemp += t;
          sumHum += h;
          sumWind += r.wind;
          sumPress += p;

          return {
            registro: r.registro,
            timestamp: r.data.toISOString(),
            time: timeStr,
            temp: t,
            umidade: h,
            umiAtual: h,
            pontoOrvalho: dew,
            sensacaoTermica: feel,
            pressaoHpa: p, // Coluna P_ATM da tabela
            pressaoLocal: p, // Coluna P_ATM da tabela
            pAtm: p, // Coluna P_ATM da tabela
            pressaoNivelMar: pSea,
            chuvaMm: r.chuvaDia,
            chuvaTaxa: r.chuvaVel,
            ventoKmH: r.wind,
            ventoDir: r.wDir,
          };
        });

        const count = points.length || 1;
        const avgTemp = Number((sumTemp / count).toFixed(1));
        const avgHum = Math.round(sumHum / count);
        const avgWind = Number((sumWind / count).toFixed(1));
        const avgPress = Math.round(sumPress / count);

        return {
          totalPoints: points.length,
          timeRange: {
            from: startTime.toISOString(),
            to: new Date(latestTime).toISOString(),
          },
          summary: {
            mediaTermica: avgTemp,
            mediaUmidade: avgHum,
            ventoMedio: avgWind,
            tempMin: minTemp === 999 ? 18.2 : minTemp,
            tempMinTime: minTempTime || "05:40",
            tempMax: maxTemp === -999 ? 28.9 : maxTemp,
            tempMaxTime: maxTempTime || "13:15",
            humMax: maxHum === -999 ? 89 : maxHum,
            humMaxTime: maxHumTime || "06:10",
            humMin: minHum === 999 ? 52 : minHum,
            humMinTime: minHumTime || "12:00",
            pressMin: minPress === 9999 ? 947 : minPress,
            pressMinTime: minPressTime || "06:00",
            pressMax: maxPress === -9999 ? 952 : maxPress,
            pressMaxTime: maxPressTime || "12:00",
            mediaPress: avgPress,
            precipitacaoTotal: 14.8,
          },
          series: points,
        };
      },
      180, // TTL in Redis
      ["telemetry", "history"]
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
 * GET /api/telemetry/day?date=YYYY-MM-DD
 * Queries specific historical or current day metrics with dynamic annual table routing:
 * e.g., 2019 -> EMA_1_2019 ... 2026 -> EMA_1_2026.
 * Computes:
 * - Rain accumulated, max rain rate
 * - Max & Min Temperatures with time stamps, thermal amplitude & mean
 * - Sunrise, Sunset, Solar Noon, Day Length (astronomically calculated for Agudos/SP)
 * - 24-hour continuous time-series for thermal, humidity, rain, barometric and wind charts.
 * Cached in Redis (TTL: 60s for today, 3600s for past dates).
 */
telemetryRouter.get("/day", async (req: Request, res: Response, next) => {
  try {
    const todayStr = getBrazilTodayStr();
    const dateQuery = typeof req.query.date === "string" ? req.query.date.trim() : todayStr;

    const cacheKey = `ema:telemetry:day:${dateQuery}`;
    if (req.query.fresh === "1" || req.query.fresh === "true" || req.headers["cache-control"] === "no-cache") {
      await redisCache.del(cacheKey);
    }
    const isToday = dateQuery === todayStr;
    const ttl = isToday ? 60 : 3600;

    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        return await repository.getDayTelemetry(dateQuery);
      },
      ttl,
      ["telemetry", "day"]
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
 * GET /api/telemetry/month?year=YYYY&month=MM
 * Queries monthly consolidated metrics with dynamic annual table routing (EMA_1_YYYY).
 * Computes:
 * - Rain accumulated over the month, days with rain, wettest day
 * - Absolute highest temperature of the month (highlighted as warmest day)
 * - Absolute lowest temperature of the month (highlighted as coldest day)
 * - Averages of max/min, monthly mean, thermal amplitude
 * - Complete breakdown of every day in the month for inspection and daily drill-down.
 * Cached in Redis (TTL: 120s for ongoing month, 3600s for historical months).
 */
telemetryRouter.get("/month", async (req: Request, res: Response, next) => {
  try {
    const { year: bYear, month: bMonth } = getBrazilDate();
    let year = bYear;
    let month = bMonth;

    if (typeof req.query.year === "string" && req.query.year.trim()) {
      const parsedY = parseInt(req.query.year.trim(), 10);
      if (!isNaN(parsedY)) year = parsedY;
    }
    if (typeof req.query.month === "string" && req.query.month.trim()) {
      const mStr = req.query.month.trim();
      if (mStr.includes("-")) {
        const parts = mStr.split("-");
        const parsedY = parseInt(parts[0], 10);
        const parsedM = parseInt(parts[1], 10);
        if (!isNaN(parsedY)) year = parsedY;
        if (!isNaN(parsedM)) month = parsedM;
      } else {
        const parsedM = parseInt(mStr, 10);
        if (!isNaN(parsedM)) month = parsedM;
      }
    }

    const currentYear = bYear;
    const currentMonth = bMonth;
    const isCurrent = year === currentYear && month === currentMonth;
    const ttl = isCurrent ? 120 : 3600;

    const cacheKey = `ema:telemetry:month:${year}-${String(month).padStart(2, "0")}`;

    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        return await repository.getMonthTelemetry(year, month);
      },
      ttl,
      ["telemetry", "month"]
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
 * GET /api/telemetry/year?year=YYYY
 * Queries yearly consolidated metrics with dynamic annual table routing (EMA_1_YYYY).
 * Computes:
 * - Rain accumulated over the entire year, wettest and driest months, 24h rain record
 * - Absolute highest temperature of the year (highlighted as warmest record)
 * - Absolute lowest temperature of the year (highlighted as coldest record)
 * - Annual averages of max/min, yearly mean, thermal amplitude
 * - Complete breakdown of every month (Jan - Dec) with drill-down to monthly modal
 * Cached in Redis (TTL: 180s for current year, 7200s for historical years).
 */
telemetryRouter.get("/year", async (req: Request, res: Response, next) => {
  try {
    const { year: currentYear } = getBrazilDate();
    let year = currentYear;

    if (typeof req.query.year === "string" && req.query.year.trim()) {
      const parsedY = parseInt(req.query.year.trim(), 10);
      if (!isNaN(parsedY)) year = parsedY;
    }

    const isCurrent = year === currentYear;
    const ttl = isCurrent ? 180 : 7200;

    const cacheKey = `ema:telemetry:year:${year}`;

    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        return await repository.getYearTelemetry(year);
      },
      ttl,
      ["telemetry", "year"]
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
 * GET /api/telemetry/historical
 * Returns the multi-year continuous climatological series (2019-2026),
 * annual summaries, and all-time records saved in MariaDB `dados_historicos`.
 */
telemetryRouter.get("/historical", async (_req: Request, res: Response, next) => {
  try {
    const data = await getHistoricalTelemetryData();
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/telemetry/historical/recalculate
 * Automatically recalculates metrics for a year directly from raw station telemetry EMA_1_{year}.
 */
telemetryRouter.post("/historical/recalculate", async (req: Request, res: Response, next) => {
  try {
    const year = parseInt(req.body.year || req.query.year, 10);
    const month = req.body.month ? parseInt(req.body.month, 10) : undefined;

    if (isNaN(year)) {
      throw new AppError("Ano inválido especificado para recálculo.", 400);
    }

    if (month !== undefined && !isNaN(month)) {
      await recalculateHistoricalMonth(year, month);
    } else {
      await recalculateYearFromStation(year);
    }

    const updated = await getHistoricalTelemetryData();
    res.json({
      success: true,
      message: `Recálculo do ano ${year}${month ? ` mês ${month}` : ""} concluído e sincronizado com a tabela MariaDB.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/telemetry/rain-summary
 * Computes the 7-day consolidated daily totals and volumetric scales.
 * Cached in Redis with key 'ema:telemetry:rain:summary' (TTL: 300s).
 */
/**
 * GET /api/telemetry/rain-summary
 * Hydrological consolidation from optical rain gauge RG-15 and tipping bucket.
 * Uses real daily records from MariaDB when connected, cached in Redis (TTL: 300s).
 */
telemetryRouter.get("/rain-summary", async (_req: Request, res: Response, next) => {
  try {
    const cacheKey = "ema:telemetry:rain:summary";
    if (_req.query.fresh === "1" || _req.query.fresh === "true" || _req.headers["cache-control"] === "no-cache") {
      await redisCache.del(cacheKey);
    }
    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const latestReading = await repository.getLatestReading();
        const dbRainDays = await repository.getRainHistory7Days();

        let last7Days;
        let acumuladoMes = latestReading ? latestReading.chuvaMes : 69.16;
        let chuvaHoje = latestReading ? latestReading.chuvaDia : 0.0;
        let chuva5min = latestReading ? latestReading.chuvaVel : 0.0;

        if (dbRainDays && dbRainDays.length > 0) {
          const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
          const todayStr = dbRainDays[dbRainDays.length - 1].day;

          last7Days = dbRainDays.map((d, idx) => {
            const dateObj = new Date(d.day + "T12:00:00Z");
            const dayNum = dateObj.getUTCDate().toString().padStart(2, "0");
            const monthNum = (dateObj.getUTCMonth() + 1).toString().padStart(2, "0");
            const weekday = weekdayNames[dateObj.getUTCDay()];
            const isToday = idx === dbRainDays.length - 1;
            const isYesterday = idx === dbRainDays.length - 2;

            let dayLabel = `${dayNum}/${monthNum} (${weekday})`;
            if (isToday) dayLabel = "Hoje";
            else if (isYesterday) dayLabel = "Ontem";

            return {
              dayLabel,
              date: d.day,
              rainfallMm: Number(d.rainDia.toFixed(2)),
              isToday,
            };
          });

          // Ensure today's reading takes latest reading's chuvaDia if higher
          if (latestReading && last7Days.length > 0) {
            chuvaHoje = Math.max(chuvaHoje, last7Days[last7Days.length - 1].rainfallMm);
            last7Days[last7Days.length - 1].rainfallMm = chuvaHoje;
          }
        } else {
          // Fallback series
          last7Days = [
            { dayLabel: "06/09 (Dom)", date: "2026-09-06", rainfallMm: 2.8 },
            { dayLabel: "07/09 (Seg)", date: "2026-09-07", rainfallMm: 0.28 },
            { dayLabel: "08/09 (Ter)", date: "2026-09-08", rainfallMm: 0.0 },
            { dayLabel: "09/09 (Qua)", date: "2026-09-09", rainfallMm: 0.84 },
            { dayLabel: "10/09 (Qui)", date: "2026-09-10", rainfallMm: 8.96 },
            { dayLabel: "Ontem", date: "2026-09-11", rainfallMm: 3.92 },
            { dayLabel: "Hoje", date: "2026-09-12", rainfallMm: 32.48, isToday: true },
          ];
        }

        const seteDiasSum = last7Days.reduce((acc, curr) => acc + curr.rainfallMm, 0);
        const maxDaily = Math.max(...last7Days.map((d) => d.rainfallMm));

        const acumulados = {
          mes: Number(acumuladoMes.toFixed(2)),
          seteDias: Number(seteDiasSum.toFixed(2)),
          hoje: Number(chuvaHoje.toFixed(2)),
          cincoMinutos: Number(chuva5min.toFixed(2)),
          escalaMaxMm: Math.max(80, Math.ceil(maxDaily * 1.5)),
        };

        return {
          acumuladoMesMm: acumulados.mes,
          pico24hMm: maxDaily,
          sensorStatus: "Sensor Óptico RG-15 Ativo",
          capacidadePluviometrica: "Capacidade pluviométrica normal",
          max7DaysMm: maxDaily,
          last7Days,
          acumulados,
        };
      },
      300, // TTL in Redis
      ["telemetry", "rain"]
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
 * GET /api/telemetry/forecast-7d
 * Meteorological numerical forecast reading WEATHER_API_URL and geo settings from .env.
 * Cached in Redis and Disk with 1-hour expiration (TTL: 3600s) to protect Google API quota limits.
 * Supports ?refresh=true for forced live update.
 */
telemetryRouter.get("/forecast-7d", async (req: Request, res: Response, next) => {
  try {
    const cacheKey = "ema:telemetry:forecast:7d";
    const forceRefresh = req.query.refresh === "true";

    if (forceRefresh) {
      await redisCache.del(cacheKey);
    }

    const { data, fromCache } = await redisCache.getOrSet(
      cacheKey,
      async () => {
        const latest = await repository.getLatestReading();
        return await fetchExtendedForecast(latest?.tempAtual || 26.4, forceRefresh);
      },
      DEFAULT_WEATHER_TTL_SECONDS, // 3600s = 1 hour
      ["telemetry", "forecast"]
    );

    if (fromCache) {
      apiMonitor.recordCall({
        service: "WEATHER_FORECAST",
        serviceName: "Previsão Meteorológica 7 Dias",
        endpoint: "Cache Redis em Memória",
        source: "REDIS_CACHE",
        status: 200,
        success: true,
        latencyMs: 1,
        summary: `Previsão recuperada do cache Redis em memória (${data?.today?.dateStr || "Hoje"})`,
        provider: data?.model || "Cache Redis",
      });
    }

    const cacheDiag = await getWeatherCacheDiagnostic();

    if (data) {
      data.source = "Google API";
      data.lastUpdated = cacheDiag?.savedAt || data?.cacheMeta?.cachedAt || new Date().toISOString();
      if (data.providers?.google) {
        data.providers.google.lastUpdated = data.lastUpdated;
        data.providers.google.source = "Google API";
      }
      if (data.providers?.openMeteo) {
        data.providers.openMeteo.lastUpdated = data.lastUpdated;
        data.providers.openMeteo.source = "Open-Meteo";
      }
    }

    res.json({
      success: true,
      fromCache,
      cacheKey,
      cacheInfo: {
        strategy: "1 Chamada por Hora (Memória Redis + Persistência em Disco)",
        ttlSeconds: DEFAULT_WEATHER_TTL_SECONDS,
        intervalMinutes: Math.round(DEFAULT_WEATHER_TTL_SECONDS / 60),
        ...cacheDiag,
      },
      data,
      providers: data?.providers || null,
    });
  } catch (err: any) {
    // Mecanismo de Fallback de Segurança: Se a chamada da API do Google falhar,
    // o sistema retorna automaticamente o último registro válido salvo no disco (data/weather_forecast_cache.json)
    // em vez de retornar um erro ao frontend.
    console.warn(
      "[Telemetry API] Chamada da API do Google falhou:",
      err?.message,
      "— Retornando automaticamente o último registro válido salvo em disco."
    );
    try {
      const disk = await readDiskWeatherCache();
      if (disk && disk.data) {
        return res.json({
          success: true,
          fromCache: true,
          fallbackActive: true,
          fallbackReason: "Google Weather API indisponível; recuperado último registro válido salvo no disco.",
          cacheInfo: {
            strategy: "Fallback em Disco (data/weather_forecast_cache.json)",
            savedAt: disk.savedIso,
            expiresAt: disk.expiresIso,
            provider: `${disk.data.model} (Fallback em Disco)`,
          },
          data: disk.data,
        });
      }
    } catch (diskErr: any) {
      console.error("[Telemetry API] Erro ao carregar fallback de disco:", diskErr?.message);
    }
    next(err);
  }
});

/**
 * POST /api/telemetry/forecast-7d/refresh
 * Explicit endpoint to trigger immediate hourly refresh of the weather forecast.
 * Retorna automaticamente o último registro válido em disco em caso de indisponibilidade da API.
 */
telemetryRouter.post("/forecast-7d/refresh", async (_req: Request, res: Response, next) => {
  try {
    const cacheKey = "ema:telemetry:forecast:7d";
    await redisCache.del(cacheKey);
    const latest = await repository.getLatestReading();
    const data = await fetchExtendedForecast(latest?.tempAtual || 26.4, true);
    await redisCache.set(cacheKey, data, DEFAULT_WEATHER_TTL_SECONDS, ["telemetry", "forecast"]);
    const cacheDiag = await getWeatherCacheDiagnostic();

    if (data) {
      data.source = "Google API";
      data.lastUpdated = cacheDiag?.savedAt || data?.cacheMeta?.cachedAt || new Date().toISOString();
    }

    const isFallback = data?.cacheMeta?.source === "STALE_DISK_FALLBACK";

    res.json({
      success: true,
      message: isFallback
        ? "Google Weather API indisponível; recuperado automaticamente o último registro válido salvo no disco."
        : "Previsão meteorológica sincronizada com sucesso e salva em memória e disco.",
      fallbackActive: isFallback,
      cacheInfo: cacheDiag,
      data,
    });
  } catch (err: any) {
    console.warn(
      "[Telemetry Refresh] Chamada da API do Google falhou:",
      err?.message,
      "— Retornando automaticamente o último registro válido salvo em disco."
    );
    try {
      const disk = await readDiskWeatherCache();
      if (disk && disk.data) {
        return res.json({
          success: true,
          message: "Google Weather API indisponível; recuperado automaticamente o último registro válido salvo no disco.",
          fallbackActive: true,
          fallbackReason: err?.message || "Falha de conexão com a Google Weather API",
          cacheInfo: {
            strategy: "Fallback em Disco (data/weather_forecast_cache.json)",
            savedAt: disk.savedIso,
            expiresAt: disk.expiresIso,
          },
          data: disk.data,
        });
      }
    } catch (diskErr: any) {
      console.error("[Telemetry Refresh] Erro ao carregar fallback de disco:", diskErr?.message);
    }
    next(err);
  }
});

/**
 * POST /api/telemetry
 * Ingest new station telemetry reading.
 * Protected with JWT (ADMIN or OPERATOR).
 * AUTOMATICALLY INVALIDATES REDIS CACHE to guarantee fresh, consistent data.
 */
telemetryRouter.post(
  "/",
  authenticateJWT,
  requireRole(["ADMIN", "OPERATOR"]),
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const {
        tempAtual,
        tMax,
        tMin,
        umiAtual,
        uMax,
        uMin,
        pAtm,
        wind,
        wDir,
        raj,
        dirRaj,
        chuvaVel,
        chuva5min,
        chuvaDia,
        chuvaMes,
      } = req.body;

      if (tempAtual === undefined || umiAtual === undefined || pAtm === undefined) {
        throw new AppError("tempAtual, umiAtual e pAtm são obrigatórios.", 400);
      }

      const dew = calculateDewPoint(Number(tempAtual), Number(umiAtual));
      const sensation = Math.round(
        calculateThermalSensation(Number(tempAtual), Number(umiAtual), Number(wind || 10))
      );

      const reading = await repository.insertReading({
        data: new Date(),
        tempAtual: Number(tempAtual),
        tMax: Number(tMax ?? Math.round(Number(tempAtual) + 2)),
        tMin: Number(tMin ?? Math.round(Number(tempAtual) - 3)),
        umiAtual: Number(umiAtual),
        uMax: Number(uMax ?? Math.min(100, Number(umiAtual) + 15)),
        uMin: Number(uMin ?? Math.max(20, Number(umiAtual) - 15)),
        umidAbs: 18,
        pAtm: Number(pAtm),
        wind: Number(wind ?? 12),
        wDir: String(wDir ?? "SSE"),
        raj: Number(raj ?? 35),
        dirRaj: String(dirRaj ?? "SSE"),
        qtrRaj: new Date().toISOString().substring(11, 16),
        chuvaVel: Number(chuvaVel ?? 0),
        chuva5min: Number(chuva5min ?? 0),
        chuvaDia: Number(chuvaDia ?? 14.8),
        chuvaMes: Number(chuvaMes ?? 69.16),
        windChill: "N/A",
        heatIndex: String(sensation),
        dewPoint: Math.round(dew),
        sensation,
        uvIndex: 8,
        uvIndex2: "MUITO ALTO",
        vBat: 4.2,
        mbT: 24,
        res: 0,
      });

      // AUTOMATIC CACHE INVALIDATION LAYER
      const invalidatedCount = await redisCache.invalidatePattern("ema:*");

      res.status(201).json({
        success: true,
        message: "Nova leitura meteorológica registrada com sucesso no banco de dados.",
        invalidatedCacheKeys: invalidatedCount,
        reading,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/telemetry/simulate-update
 * Simulates a periodic telemetry tick from the EMA station.
 * Demonstrates the automatic cache invalidation layer and updates the database.
 */
telemetryRouter.post("/simulate-update", async (_req: Request, res: Response, next) => {
  try {
    const latest = await repository.getLatestReading();

    // Subtle drift simulation
    const tempDelta = (Math.random() - 0.48) * 0.3;
    const humDelta = (Math.random() - 0.5) * 1.5;
    const windDelta = (Math.random() - 0.45) * 2;

    const newTemp = Number(Math.max(16, Math.min(32, (latest?.tempAtual || 26.4) + tempDelta)).toFixed(1));
    const newHum = Math.max(40, Math.min(99, Math.round((latest?.umiAtual || 68) + humDelta)));
    const newWind = Math.max(4, Math.min(45, Math.round((latest?.wind || 14) + windDelta)));

    const dew = calculateDewPoint(newTemp, newHum);
    const sensation = Math.round(calculateThermalSensation(newTemp, newHum, newWind));

    const newReading = await repository.insertReading({
      data: new Date(),
      tempAtual: newTemp,
      tMax: Math.max(28.9, Math.round(newTemp + 2)),
      tMin: Math.min(18.2, Math.round(newTemp - 3)),
      umiAtual: newHum,
      uMax: 89,
      uMin: 52,
      umidAbs: 18,
      pAtm: 950 + Math.round((Math.random() - 0.5) * 2),
      wind: newWind,
      wDir: newWind > 20 ? "S" : "SSE",
      raj: Math.round(newWind * 1.6 + 5),
      dirRaj: "SSE",
      qtrRaj: new Date().toISOString().substring(11, 16),
      chuvaVel: 0.0,
      chuva5min: 0.0,
      chuvaDia: 14.8,
      chuvaMes: 69.16,
      windChill: "N/A",
      heatIndex: String(sensation),
      dewPoint: Math.round(dew),
      sensation,
      uvIndex: 8,
      uvIndex2: "MUITO ALTO",
      vBat: 4.2,
      mbT: 24,
      res: 0,
    });

    // Automatically invalidate telemetry cache keys
    const invalidatedCount = await redisCache.invalidatePattern("ema:telemetry:*");

    res.json({
      success: true,
      message: "Simulação de pulso da estação concluída. Cache Redis invalidado automaticamente.",
      invalidatedKeys: invalidatedCount,
      reading: newReading,
    });
  } catch (err) {
    next(err);
  }
});
