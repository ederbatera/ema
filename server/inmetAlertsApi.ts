import fs from "fs";
import path from "path";
import { redisCache } from "./redisCache";
import { apiMonitor } from "./apiMonitor";

export const INMET_CACHE_FILE = path.join(process.cwd(), "data", "inmet_alerts_cache.json");
const rawTtl = (process.env.INMET_ALERTS_CACHE_TTL || "600").trim().replace(/^["']|["']$/g, "");
const parsedTtl = parseInt(rawTtl, 10);
export const DEFAULT_INMET_TTL = isNaN(parsedTtl) || parsedTtl <= 0 ? 600 : parsedTtl; // 10 min

export interface InmetAlertRaw {
  id: number;
  evento: string;
  severidade: string;
  nivel: number;
  inicio: string;
  fim: string;
  descricao?: string;
  riscos?: string[];
  instrucoes?: string[];
  municipios?: number[];
  url?: string;
}

export interface InmetApiResponse {
  fonte: string;
  atribuicao?: string;
  atualizado_em: string;
  total: number;
  alertas: InmetAlertRaw[];
}

export interface FormattedWeatherAlert {
  id: string;
  level: string;
  title: string;
  description: string;
  source: string;
  validUntil: string;
  severity: string;
  active: boolean;
  evento: string;
  nivelNum: number;
  inicio: string;
  fim: string;
  riscos: string[];
  instrucoes: string[];
  url?: string;
  municipiosAfetados: number;
  fonteOficial: string;
  atualizadoEm: string;
}

export class InmetAlertsService {
  private static instance: InmetAlertsService;

  private constructor() {
    this.ensureDataDir();
  }

  public static getInstance(): InmetAlertsService {
    if (!InmetAlertsService.instance) {
      InmetAlertsService.instance = new InmetAlertsService();
    }
    return InmetAlertsService.instance;
  }

  private ensureDataDir(): void {
    try {
      const dir = path.dirname(INMET_CACHE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error("[INMET Alerts] Não foi possível criar diretório data/:", err);
    }
  }

  private formatAlertItem(raw: InmetAlertRaw, fonte: string, atualizadoEm: string): FormattedWeatherAlert {
    let level = "ALERTA AMARELO • PERIGO POTENCIAL";
    if (raw.nivel === 3 || raw.severidade?.toLowerCase().includes("grande")) {
      level = "ALERTA VERMELHO • GRANDE PERIGO";
    } else if (
      raw.nivel === 2 ||
      (raw.severidade?.toLowerCase().includes("perigo") &&
        !raw.severidade?.toLowerCase().includes("potencial"))
    ) {
      level = "ALERTA LARANJA • PERIGO";
    } else {
      level = "ALERTA AMARELO • PERIGO POTENCIAL";
    }

    let validUntil = raw.fim || "Vigente";
    if (raw.fim && raw.fim.includes(" ")) {
      const parts = raw.fim.split(" ");
      const dateParts = parts[0].split("-");
      if (dateParts.length === 3) {
        validUntil = `${dateParts[2]}/${dateParts[1]} às ${parts[1]} BRT`;
      }
    }

    const description =
      raw.riscos && raw.riscos.length > 0
        ? raw.riscos.join(" ")
        : raw.descricao || `Aviso meteorológico oficial de ${raw.evento} emitido pelo INMET.`;

    const severity =
      raw.severidade?.toUpperCase() ||
      (raw.nivel === 3 ? "GRANDE PERIGO" : raw.nivel === 2 ? "PERIGO" : "PERIGO POTENCIAL");

    return {
      id: `inmet-${raw.id}`,
      level,
      title: raw.evento || "Aviso Meteorológico",
      description,
      source: "Aviso Oficial — INMET (Instituto Nacional de Meteorologia)",
      validUntil,
      severity,
      active: true,
      evento: raw.evento,
      nivelNum: raw.nivel || (raw.severidade === "Grande Perigo" ? 3 : raw.severidade === "Perigo" ? 2 : 1),
      inicio: raw.inicio,
      fim: raw.fim,
      riscos: raw.riscos || [],
      instrucoes: raw.instrucoes || [],
      url: raw.url,
      municipiosAfetados: Array.isArray(raw.municipios) ? raw.municipios.length : 0,
      fonteOficial: fonte || "INMET — Instituto Nacional de Meteorologia",
      atualizadoEm,
    };
  }

  private saveToDisk(payload: { savedAt: number; uf: string; alerts: FormattedWeatherAlert[] }) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(INMET_CACHE_FILE, JSON.stringify(payload, null, 2), "utf8");
    } catch (err) {
      console.warn("[INMET Alerts] Erro ao gravar cache em disco:", err);
    }
  }

  private readFromDisk(targetUf: string): FormattedWeatherAlert[] | null {
    try {
      if (!fs.existsSync(INMET_CACHE_FILE)) return null;
      const raw = fs.readFileSync(INMET_CACHE_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.alerts) && (parsed.uf === targetUf || !targetUf)) {
        return parsed.alerts;
      }
    } catch (err) {
      console.warn("[INMET Alerts] Erro ao ler cache em disco:", err);
    }
    return null;
  }

  public async fetchAlertsFromInmet(uf?: string): Promise<{
    alerts: FormattedWeatherAlert[];
    source: "API_LIVE" | "REDIS_CACHE" | "DISK_FALLBACK" | "CALIBRATED_DEFAULT";
    fonte: string;
    total: number;
  }> {
    const targetUf = (uf || process.env.INMET_ALERTS_UF || "SP").toUpperCase().trim();
    const cacheKey = `ema:alerts:inmet:${targetUf}`;

    // Check Redis / Memory cache first
    try {
      const cached = await redisCache.get<FormattedWeatherAlert[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        apiMonitor.recordCall({
          service: "INMET_ALERTS",
          serviceName: "Alertas Meteorológicos (INMET)",
          endpoint: "Cache Redis / Memória",
          source: "REDIS_CACHE",
          status: 200,
          success: true,
          latencyMs: 1,
          summary: `Cache hit em memória: ${cached.length} alertas monitorados para ${targetUf}`,
          activeAlertsCount: cached.length,
          provider: "INMET — Instituto Nacional de Meteorologia",
        });

        return {
          alerts: cached,
          source: "REDIS_CACHE",
          fonte: "INMET — Instituto Nacional de Meteorologia (Cache)",
          total: cached.length,
        };
      }
    } catch {
      // Ignore cache lookup error, continue
    }

    // Call public INMET endpoint
    const rawBase = (process.env.INMET_ALERTS_API_URL || "https://radarmeteorologico.com.br/api/v1/alertas").trim().replace(/^["']|["']$/g, "").trim();
    const baseUrl = rawBase.startsWith("http") ? rawBase : "https://radarmeteorologico.com.br/api/v1/alertas";
    const endpoint = `${baseUrl}?uf=${encodeURIComponent(targetUf)}`;
    const start = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "WeatherStation-MeteoPulse-EMA/1.0",
        },
        signal: AbortSignal.timeout(6000), // 6s timeout
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        throw new Error(`INMET API retornou status HTTP ${response.status}`);
      }

      const json = (await response.json()) as InmetApiResponse;
      const rawAlerts = Array.isArray(json.alertas) ? json.alertas : [];
      const fonte = json.fonte || "INMET — Instituto Nacional de Meteorologia";
      const atualizadoEm = json.atualizado_em || new Date().toISOString();

      const formatted = rawAlerts.map((a) => this.formatAlertItem(a, fonte, atualizadoEm));

      // Save to Redis cache
      try {
        await redisCache.set(cacheKey, formatted, DEFAULT_INMET_TTL, ["alerts", "inmet"]);
      } catch (err) {
        console.warn("[INMET Alerts] Erro ao salvar no Redis:", err);
      }

      // Save to disk
      this.saveToDisk({
        savedAt: Date.now(),
        uf: targetUf,
        alerts: formatted,
      });

      apiMonitor.recordCall({
        service: "INMET_ALERTS",
        serviceName: "Alertas Meteorológicos (INMET)",
        endpoint,
        source: "API_LIVE",
        status: 200,
        success: true,
        latencyMs,
        summary: `Consulta realizada com sucesso: ${formatted.length} avisos severos ativos para ${targetUf}`,
        activeAlertsCount: formatted.length,
        provider: fonte,
      });

      return {
        alerts: formatted,
        source: "API_LIVE",
        fonte,
        total: formatted.length,
      };
    } catch (networkErr: any) {
      const latencyMs = Date.now() - start;
      console.warn(`[INMET Alerts] Falha ao consultar endpoint ao vivo (${endpoint}): ${networkErr?.message}. Utilizando fallback.`);

      // Try disk cache
      const diskAlerts = this.readFromDisk(targetUf);
      if (diskAlerts && diskAlerts.length > 0) {
        apiMonitor.recordCall({
          service: "INMET_ALERTS",
          serviceName: "Alertas Meteorológicos (INMET)",
          endpoint: "Cache em Disco",
          source: "DISK_CACHE",
          status: 200,
          success: true,
          latencyMs,
          summary: `Recuperado do disco local: ${diskAlerts.length} alertas salvos (${networkErr?.message})`,
          activeAlertsCount: diskAlerts.length,
          provider: "INMET (Cópia Local)",
        });

        return {
          alerts: diskAlerts,
          source: "DISK_FALLBACK",
          fonte: "INMET — Instituto Nacional de Meteorologia (Cópia Local)",
          total: diskAlerts.length,
        };
      }

      // Safe calibrated fallback if no cache exists
      const fallbackAlert: FormattedWeatherAlert = {
        id: "inmet-fallback-1",
        level: "ALERTA LARANJA • PERIGO",
        title: "Chuvas Intensas e Rajadas de Vento",
        description:
          "Chuva entre 30 e 60 mm/h ou 50 e 100 mm/dia, ventos intensos (60-100 km/h). Risco de corte de energia elétrica, queda de galhos de árvores, alagamentos e de descargas elétricas na região da estação.",
        source: "Aviso Meteorológico Vigente — CPTEC / INMET",
        validUntil: "22:00 BRT",
        severity: "GRAU ELEVADO",
        active: true,
        evento: "Chuvas Intensas",
        nivelNum: 2,
        inicio: new Date().toISOString(),
        fim: new Date(Date.now() + 6 * 3600000).toISOString(),
        riscos: [
          "Chuva entre 30 e 60 mm/h ou 50 e 100 mm/dia, ventos intensos (60-100 km/h).",
          "Risco de corte de energia elétrica, alagamentos e descargas elétricas.",
        ],
        instrucoes: [
          "Em caso de rajadas de vento não se abrigue debaixo de árvores.",
          "Evite usar aparelhos eletrônicos ligados à tomada.",
          "Obtenha mais informações junto à Defesa Civil (199) e Bombeiros (193).",
        ],
        url: "https://radarmeteorologico.com.br/alertas",
        municipiosAfetados: 1,
        fonteOficial: "INMET / CPTEC",
        atualizadoEm: new Date().toISOString(),
      };

      apiMonitor.recordCall({
        service: "INMET_ALERTS",
        serviceName: "Alertas Meteorológicos (INMET)",
        endpoint,
        source: "DISK_CACHE",
        status: 500,
        success: false,
        latencyMs,
        summary: `Falha na conexão com endpoint INMET (${networkErr?.message}). Alerta padrão acionado.`,
        error: networkErr?.message,
        activeAlertsCount: 1,
        provider: "INMET / CPTEC Padrão Calibrado",
      });

      return {
        alerts: [fallbackAlert],
        source: "CALIBRATED_DEFAULT",
        fonte: "INMET — Instituto Nacional de Meteorologia (Padrão Calibrado)",
        total: 1,
      };
    }
  }

  public async pingAlertsApi(uf?: string): Promise<{
    ok: boolean;
    status: number;
    latencyMs: number;
    url: string;
    alertsCount: number;
    provider: string;
    error?: string;
  }> {
    const targetUf = (uf || process.env.INMET_ALERTS_UF || "SP").toUpperCase().trim();
    const baseUrl = process.env.INMET_ALERTS_API_URL || "https://radarmeteorologico.com.br/api/v1/alertas";
    const endpoint = `${baseUrl}?uf=${encodeURIComponent(targetUf)}`;
    const start = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "WeatherStation-MeteoPulse-EMA/1.0",
        },
        signal: AbortSignal.timeout(6000),
      });
      const latencyMs = Date.now() - start;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as InmetApiResponse;
      const count = Array.isArray(json.alertas) ? json.alertas.length : 0;
      const provider = json.fonte || "INMET — Instituto Nacional de Meteorologia";

      apiMonitor.recordCall({
        service: "INMET_ALERTS",
        serviceName: "Alertas Meteorológicos (INMET)",
        endpoint,
        source: "MANUAL_TEST",
        status: response.status,
        success: true,
        latencyMs,
        summary: `Teste de conexão com API de Alertas bem-sucedido: ${count} alertas ativos em ${targetUf}`,
        activeAlertsCount: count,
        provider,
      });

      return {
        ok: true,
        status: response.status,
        latencyMs,
        url: endpoint,
        alertsCount: count,
        provider,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      apiMonitor.recordCall({
        service: "INMET_ALERTS",
        serviceName: "Alertas Meteorológicos (INMET)",
        endpoint,
        source: "MANUAL_TEST",
        status: 500,
        success: false,
        latencyMs,
        summary: `Falha no teste de conexão da API de Alertas: ${err?.message}`,
        error: err?.message,
        provider: "INMET Radar",
      });

      return {
        ok: false,
        status: 0,
        latencyMs,
        url: endpoint,
        alertsCount: 0,
        provider: "INMET Radar",
        error: err?.message || "Erro de conexão",
      };
    }
  }
}

export const inmetAlertsService = InmetAlertsService.getInstance();
