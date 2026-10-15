/**
 * API Monitor & Telemetry Call Audit Logger
 * Tracks external calls to Weather Forecast API and INMET Alerts API.
 * Provides live operational status, last call timestamps, latency metrics, and audit history.
 */

export interface ApiCallRecord {
  id: string;
  timestamp: string; // ISO
  formattedTime: string; // BRT
  service: "WEATHER_FORECAST" | "INMET_ALERTS";
  serviceName: string;
  endpoint: string;
  source: "API_LIVE" | "REDIS_CACHE" | "DISK_CACHE" | "SCHEDULER" | "MANUAL_TEST";
  status: number;
  success: boolean;
  latencyMs: number;
  summary: string;
  error?: string;
}

export interface ApiServiceStatus {
  service: "WEATHER_FORECAST" | "INMET_ALERTS";
  name: string;
  status: "ONLINE" | "DEGRADED" | "STANDBY";
  provider: string;
  lastCheckedIso: string | null;
  lastCheckedFormatted: string;
  lastLatencyMs: number;
  success: boolean;
  totalCalls: number;
  liveCalls: number;
  cacheHits: number;
  nextScheduledFormatted: string;
  details: string;
}

class ApiMonitorService {
  private static instance: ApiMonitorService;
  private history: ApiCallRecord[] = [];
  private maxHistoryLength = 60;

  private weatherStats = {
    totalCalls: 0,
    liveCalls: 0,
    cacheHits: 0,
    lastCheckedIso: null as string | null,
    lastLatencyMs: 0,
    success: true,
    provider: "Open-Meteo High-Res (ECMWF/GFS) + Google Weather",
    details: "Sincronização horária ativa (TTL: 3600s)",
    nextScheduledFormatted: "Agendado a cada 1 hora",
  };

  private alertsStats = {
    totalCalls: 0,
    liveCalls: 0,
    cacheHits: 0,
    lastCheckedIso: null as string | null,
    lastLatencyMs: 0,
    success: true,
    provider: "INMET / CPTEC Radar Meteorológico Oficial",
    details: "Monitoramento contínuo de avisos severos (TTL: 600s)",
    nextScheduledFormatted: "Agendado a cada 10 minutos",
    activeAlertsCount: 0,
  };

  private constructor() {}

  public static getInstance(): ApiMonitorService {
    if (!ApiMonitorService.instance) {
      ApiMonitorService.instance = new ApiMonitorService();
    }
    return ApiMonitorService.instance;
  }

  public recordCall(params: {
    service: "WEATHER_FORECAST" | "INMET_ALERTS";
    serviceName: string;
    endpoint: string;
    source: "API_LIVE" | "REDIS_CACHE" | "DISK_CACHE" | "SCHEDULER" | "MANUAL_TEST";
    status: number;
    success: boolean;
    latencyMs: number;
    summary: string;
    error?: string;
    provider?: string;
    activeAlertsCount?: number;
    nextScheduledFormatted?: string;
  }): ApiCallRecord {
    const now = new Date();
    const formattedTime = now.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const record: ApiCallRecord = {
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime,
      service: params.service,
      serviceName: params.serviceName,
      endpoint: params.endpoint,
      source: params.source,
      status: params.status,
      success: params.success,
      latencyMs: params.latencyMs,
      summary: params.summary,
      error: params.error,
    };

    // Add to history ring buffer
    this.history.unshift(record);
    if (this.history.length > this.maxHistoryLength) {
      this.history = this.history.slice(0, this.maxHistoryLength);
    }

    // Update service stats
    if (params.service === "WEATHER_FORECAST") {
      this.weatherStats.totalCalls++;
      if (params.source === "API_LIVE" || params.source === "MANUAL_TEST") {
        this.weatherStats.liveCalls++;
      } else {
        this.weatherStats.cacheHits++;
      }
      this.weatherStats.lastCheckedIso = now.toISOString();
      this.weatherStats.lastLatencyMs = params.latencyMs;
      this.weatherStats.success = params.success;
      if (params.provider) this.weatherStats.provider = params.provider;
      if (params.summary) this.weatherStats.details = params.summary;
      if (params.nextScheduledFormatted) {
        this.weatherStats.nextScheduledFormatted = params.nextScheduledFormatted;
      }
    } else {
      this.alertsStats.totalCalls++;
      if (params.source === "API_LIVE" || params.source === "MANUAL_TEST") {
        this.alertsStats.liveCalls++;
      } else {
        this.alertsStats.cacheHits++;
      }
      this.alertsStats.lastCheckedIso = now.toISOString();
      this.alertsStats.lastLatencyMs = params.latencyMs;
      this.alertsStats.success = params.success;
      if (params.provider) this.alertsStats.provider = params.provider;
      if (params.summary) this.alertsStats.details = params.summary;
      if (typeof params.activeAlertsCount === "number") {
        this.alertsStats.activeAlertsCount = params.activeAlertsCount;
      }
      if (params.nextScheduledFormatted) {
        this.alertsStats.nextScheduledFormatted = params.nextScheduledFormatted;
      }
    }

    return record;
  }

  public getStatus() {
    const formatBrt = (iso: string | null) => {
      if (!iso) return "Nenhuma consulta registrada";
      try {
        return new Date(iso).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      } catch {
        return iso;
      }
    };

    const weatherService: ApiServiceStatus = {
      service: "WEATHER_FORECAST",
      name: "API Previsão Meteorológica (7 Dias)",
      status: this.weatherStats.success ? "ONLINE" : "DEGRADED",
      provider: this.weatherStats.provider,
      lastCheckedIso: this.weatherStats.lastCheckedIso,
      lastCheckedFormatted: formatBrt(this.weatherStats.lastCheckedIso),
      lastLatencyMs: this.weatherStats.lastLatencyMs,
      success: this.weatherStats.success,
      totalCalls: this.weatherStats.totalCalls,
      liveCalls: this.weatherStats.liveCalls,
      cacheHits: this.weatherStats.cacheHits,
      nextScheduledFormatted: this.weatherStats.nextScheduledFormatted,
      details: this.weatherStats.details,
    };

    const alertsService: ApiServiceStatus = {
      service: "INMET_ALERTS",
      name: "API Alertas Meteorológicos (INMET)",
      status: this.alertsStats.success ? "ONLINE" : "DEGRADED",
      provider: this.alertsStats.provider,
      lastCheckedIso: this.alertsStats.lastCheckedIso,
      lastCheckedFormatted: formatBrt(this.alertsStats.lastCheckedIso),
      lastLatencyMs: this.alertsStats.lastLatencyMs,
      success: this.alertsStats.success,
      totalCalls: this.alertsStats.totalCalls,
      liveCalls: this.alertsStats.liveCalls,
      cacheHits: this.alertsStats.cacheHits,
      nextScheduledFormatted: this.alertsStats.nextScheduledFormatted,
      details: this.alertsStats.details,
    };

    return {
      weather: weatherService,
      alerts: alertsService,
      history: this.history,
      serverTimeBrt: new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  }

  public clearHistory(): void {
    this.history = [];
  }
}

export const apiMonitor = ApiMonitorService.getInstance();
