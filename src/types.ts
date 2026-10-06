export interface ComputedTelemetry {
  registro?: number;
  timestamp?: string;
  horaGravacao?: string;
  dataGravacao?: string;
  tempAtual: number;
  tempSensacao: number;
  pontoOrvalho: number;
  umidade: number; // Coluna UMI_ATUAL
  umiAtual?: number; // Coluna UMI_ATUAL
  umidadeAbsoluta: number;
  deficitVaporKpa: number;
  vpdStatus: "Baixo" | "Moderado" | "Alto";
  pressaoLocalHpa: number; // Coluna P_ATM
  pAtm?: number; // Coluna P_ATM
  pressaoNivelMarHpa: number;
  pressaoTendencia3h: number;
  pressaoGradiente: "Elevação" | "Estável" | "Queda";
  ventoVelKmH: number;
  ventoDirecao: string;
  ventoDirecaoGraus: number;
  ventoBeaufortNum: number;
  ventoBeaufortDesc: string;
  rajadaKmH: number;
  rajadaDirecao: string;
  rajadaHora: string;
  ventoMedia10mKmH: number;
  ventoStatus: string;
  chuvaHojeMm: number;
  chuvaMesMm: number;
  chuvaTaxaMmH: number;
  chuva5MinMm: number;
  chuvaDuracaoMin: number;
  chuvaPicoMmH: number;
  chuvaPicoHora: string;
  evaporacaoEstMm: number;
  uvIndex: number;
  uvDescricao: string;
  variacaoTermica6h: number;
  bateriaTensaoV: number;
  bateriaPct: number;
  estabilidadePsicrometrica: string;
}

export interface TelemetryPoint {
  registro: number;
  timestamp: string;
  time: string;
  temp: number;
  umidade: number; // Coluna UMI_ATUAL
  umiAtual?: number; // Coluna UMI_ATUAL
  pontoOrvalho: number;
  sensacaoTermica: number;
  pressaoHpa: number; // Coluna P_ATM
  pressaoLocal: number; // Coluna P_ATM
  pAtm?: number; // Coluna P_ATM
  pressaoNivelMar?: number;
  chuvaMm: number;
  chuvaTaxa: number;
  ventoKmH: number;
  ventoDir: string;
}

export interface History24hData {
  totalPoints: number;
  timeRange: { from: string; to: string };
  summary: {
    mediaTermica: number;
    mediaUmidade: number;
    ventoMedio: number;
    tempMin: number;
    tempMinTime: string;
    tempMax: number;
    tempMaxTime: string;
    humMax: number;
    humMaxTime: string;
    humMin: number;
    humMinTime?: string;
    pressMin?: number;
    pressMinTime?: string;
    pressMax?: number;
    pressMaxTime?: string;
    mediaPress?: number;
    precipitacaoTotal: number;
  };
  series: TelemetryPoint[];
}

export interface RainSummaryData {
  acumuladoMesMm: number;
  pico24hMm: number;
  sensorStatus: string;
  capacidadePluviometrica: string;
  max7DaysMm: number;
  last7Days: Array<{
    dayLabel: string;
    date: string;
    rainfallMm: number;
    isToday?: boolean;
  }>;
  acumulados: {
    mes: number;
    seteDias: number;
    hoje: number;
    cincoMinutos: number;
    escalaMaxMm: number;
  };
}

export interface ForecastDay {
  id: string;
  label: string;
  dayOfWeek: string;
  condition: string;
  tempMax: number;
  tempMin: number;
  probChuva: number;
  rainMm: number;
  windKmH: number;
  icon: string;
  badgeColor: string;
}

export interface WeatherCacheMeta {
  cachedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  source: "DISK_STORAGE" | "API_LIVE" | "STALE_DISK_FALLBACK";
  nextHourlyUpdate: string;
  updateIntervalMinutes: number;
  provider: string;
}

export interface ForecastData {
  model: string;
  confidence: string;
  source?: string;
  lastUpdated?: string;
  apiUrl?: string;
  resolvedFrom?: "EXTERNAL_API" | "CALIBRATED_FALLBACK";
  cacheMeta?: WeatherCacheMeta;
  providers?: {
    google?: ForecastData | null;
    openMeteo?: ForecastData | null;
  };
  today: {
    title: string;
    dateStr: string;
    tempCurrent: number;
    tempMax: number;
    tempMin: number;
    condition: string;
    description: string;
    probChuva: string;
    estChuva: string;
    ventoMedio: string;
    ventoDir: string;
    uvIndex: string;
    uvStatus: string;
    nascerDoSol: string;
    solAzimute: string;
    porDoSol: string;
    luzDiurna: string;
    faixaTermica: string;
    amplitude: string;
  };
  days: ForecastDay[];
}

export interface WeatherAlertItem {
  id: string;
  level: string;
  title: string;
  description: string;
  source: string;
  validUntil: string;
  severity: string;
  active: boolean;
  evento?: string;
  nivelNum?: number;
  inicio?: string;
  fim?: string;
  riscos?: string[];
  instrucoes?: string[];
  url?: string;
  municipiosAfetados?: number;
  fonteOficial?: string;
  atualizadoEm?: string;
}

export interface CacheKeyInfo {
  key: string;
  ttlSeconds: number;
  hits: number;
  tags: string[];
  createdAt: string;
}

export interface CacheStatsData {
  hits: number;
  misses: number;
  hitRatePct: number;
  totalKeys: number;
  estimatedMemoryKb: number;
  redisConnection?: {
    host: string;
    port: number;
    hasAuth: boolean;
    authStatus: string;
    restrictedToLocalhost: boolean;
    daemonDetected: boolean;
    securityPolicy: string;
    statusSummary: string;
  };
  keys: CacheKeyInfo[];
  weatherCache?: {
    filePath: string;
    exists: boolean;
    isFresh: boolean;
    ttlSeconds: number;
    updateIntervalMinutes: number;
    savedAt: string | null;
    expiresAt: string | null;
    remainingSeconds: number;
    nextScheduledHourlyUpdate: string;
    provider: string;
    sourceStrategy: string;
  };
}

export interface AuthUser {
  id: number | string;
  username: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  active?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

export interface DayMetricsSummary {
  tempMin: number;
  tempMinTime: string;
  tempMax: number;
  tempMaxTime: string;
  tempMedia: number;
  amplitudeTermica: number;
  chuvaTotalMm: number;
  chuvaPicoMmH: number;
  chuvaPicoHora: string;
  umiMin: number;
  umiMinTime: string;
  umiMax: number;
  umiMaxTime: string;
  umiMedia: number;
  pressaoMin: number;
  pressaoMinTime?: string;
  pressaoMax: number;
  pressaoMaxTime?: string;
  pressaoMedia: number;
  ventoMaxKmH: number;
  ventoMaxDirecao: string;
  rajadaMaxKmH: number;
  rajadaMaxDirecao: string;
  rajadaMaxHora: string;
  uvMax: number;
  totalRegistros: number;
}

export interface DaySunTimes {
  nascerDoSol: string;
  porDoSol: string;
  meioDiaSolar: string;
  duracaoLuzSolar: string;
  duracaoMinutos: number;
  crepusculoMatutino: string;
  crepusculoVespertino: string;
}

export interface DayTelemetryPoint {
  time: string;
  timestamp: string;
  tempAtual: number;
  sensacao: number;
  pontoOrvalho: number;
  umidade: number;
  pressaoHpa: number;
  ventoKmH: number;
  rajadaKmH: number;
  ventoDirecao: string;
  chuvaAcumuladaMm: number;
  chuvaTaxaMmH: number;
  uvIndex: number;
}

export interface DayTelemetryData {
  date: string;
  tableName: string;
  isLiveDatabase: boolean;
  sunTimes: DaySunTimes;
  summary: DayMetricsSummary;
  timeSeries: DayTelemetryPoint[];
}

export interface MonthDaySummary {
  date: string; // "YYYY-MM-DD"
  dayNumber: number; // 1..31
  dayOfWeek: string; // "Seg", "Ter", etc.
  tempMin: number;
  tempMinTime?: string;
  tempMax: number;
  tempMaxTime?: string;
  tempMedia: number;
  amplitudeTermica: number;
  chuvaTotalMm: number;
  chuvaPicoMmH?: number;
  chuvaPicoHora?: string;
  umiMin: number;
  umiMax: number;
  umiMedia: number;
  pressaoMedia: number;
  ventoMaxKmH: number;
  rajadaMaxKmH: number;
  rajadaMaxDirecao?: string;
  totalRegistros: number;
  isHottestDay?: boolean;
  isColdestDay?: boolean;
  hasRain?: boolean;
  isFuture?: boolean;
}

export interface MonthMetricsSummary {
  ano: number;
  mes: number;
  mesNome: string;
  totalDiasNoMes: number;
  diasRegistrados: number;
  chuvaAcumuladaMesMm: number;
  diasComChuva: number;
  maiorChuvaDiaMm: number;
  maiorChuvaData: string | null;
  tempMaxAbsoluta: number;
  tempMaxData: string | null;
  tempMaxHora?: string;
  tempMinAbsoluta: number;
  tempMinData: string | null;
  tempMinHora?: string;
  tempMediaMes: number;
  mediaDasMaximas: number;
  mediaDasMinimas: number;
  amplitudeMediaMes: number;
  rajadaMaxMes: number;
  rajadaMaxDirecao: string;
  rajadaMaxData: string | null;
  umiMediaMes: number;
  pressaoMediaMes: number;
}

export interface MonthTelemetryData {
  year: number;
  month: number;
  monthName: string;
  tableName: string;
  isLiveDatabase: boolean;
  summary: MonthMetricsSummary;
  days: MonthDaySummary[];
}

export interface YearMonthSummary {
  month: number;
  monthName: string;
  chuvaTotalMm: number;
  diasComChuva: number;
  maiorChuvaDiaMm: number;
  maiorChuvaData: string | null;
  tempMaxAbsoluta: number;
  tempMaxData: string | null;
  tempMaxHora: string;
  tempMinAbsoluta: number;
  tempMinData: string | null;
  tempMinHora: string;
  tempMedia: number;
  mediaDasMaximas: number;
  mediaDasMinimas: number;
  amplitudeMedia: number;
  rajadaMax: number;
  rajadaDir: string;
  rajadaData: string | null;
  umiMedia: number;
  pressaoMedia: number;
  totalDiasNoMes: number;
  diasRegistrados: number;
  hotDaysCount?: number;
  coldDaysCount?: number;
  isHottestMonth?: boolean;
  isColdestMonth?: boolean;
  isWettestMonth?: boolean;
  isDriestMonth?: boolean;
  isFuture?: boolean;
  isBeforeInception?: boolean;
}

export interface YearMetricsSummary {
  ano: number;
  totalMesesMonitorados: number;
  totalDiasMonitorados: number;
  chuvaAcumuladaAnoMm: number;
  diasComChuvaAno: number;
  mediaPluviometricaMensal: number;
  maiorChuva24hAnoMm: number;
  maiorChuva24hData: string | null;
  mesMaisChuvoso: {
    mes: number;
    nome: string;
    chuvaMm: number;
  } | null;
  mesMaisSeco: {
    mes: number;
    nome: string;
    chuvaMm: number;
  } | null;
  tempMaxAbsolutaAno: number;
  tempMaxData: string | null;
  tempMaxHora?: string;
  tempMinAbsolutaAno: number;
  tempMinData: string | null;
  tempMinHora?: string;
  tempMediaAno: number;
  mediaAnualDasMaximas: number;
  mediaAnualDasMinimas: number;
  amplitudeMediaAnual: number;
  amplitudeTermicaAno: number;
  mesMaisQuente: {
    mes: number;
    nome: string;
    tempMedia: number;
  } | null;
  mesMaisFrio: {
    mes: number;
    nome: string;
    tempMedia: number;
  } | null;
  diasCalorIntenso: number;
  diasFrio: number;
  rajadaMaxAno: number;
  rajadaMaxDir: string;
  rajadaMaxData: string | null;
  umiMediaAno: number;
  pressaoMediaAno: number;
}

export interface YearTelemetryData {
  year: number;
  tableName: string;
  isLiveDatabase: boolean;
  summary: YearMetricsSummary;
  months: YearMonthSummary[];
}

export interface ApiCallRecord {
  id: string;
  timestamp: string;
  formattedTime: string;
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

export interface ApiMonitorData {
  weather: ApiServiceStatus;
  alerts: ApiServiceStatus;
  history: ApiCallRecord[];
  serverTimeBrt: string;
}

export interface HistoricalYearSeries {
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

export interface HistoricalAnnualSummary {
  ano: number;
  chuvaTotal: number;
  tempMedia: number;
  tempMaxAbs: number;
  tempMinAbs: number;
  umiMedia: number;
  mesesValidos: number;
}

export interface HistoricalAllRecords {
  recordeChuvaMensal: { valor: number; mes: number; ano: number };
  recordeChuvaAnual: { valor: number; ano: number };
  recordeTempMax: { valor: number; mes: number; ano: number };
  recordeTempMin: { valor: number; mes: number; ano: number };
  anoMaisQuente: { valor: number; ano: number };
  anoMaisFrio: { valor: number; ano: number };
}

export interface HistoricalTelemetryData {
  series: Record<string, HistoricalYearSeries>;
  annualSummaries: HistoricalAnnualSummary[];
  records: HistoricalAllRecords;
  totalYears: number;
  databaseConnected: boolean;
  lastUpdated: string;
}



