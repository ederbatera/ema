/**
 * Meteorological Calculations and Data Transformations
 * Scientific formulas for psychrometric, barometric, wind and thermal parameters.
 */

export interface ComputedMeteorology {
  tempAtual: number;
  tempSensacao: number;
  pontoOrvalho: number;
  umidade: number; // Coluna UMI_ATUAL da tabela
  umiAtual: number; // Coluna UMI_ATUAL da tabela
  umidadeAbsoluta: number;
  deficitVaporKpa: number;
  vpdStatus: "Baixo" | "Moderado" | "Alto";
  pressaoLocalHpa: number; // Coluna P_ATM da tabela
  pAtm: number; // Coluna P_ATM da tabela
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
  variacaoTermica6h: number; // °C/h
  bateriaTensaoV: number;
  bateriaPct: number;
  estabilidadePsicrometrica: string;
}

/**
 * Calculates accurate Dew Point in °C using the Magnus-Tetens formula
 * @param temp Temperature in °C
 * @param rh Relative Humidity in % (0 - 100)
 */
export function calculateDewPoint(temp: number, rh: number): number {
  const a = 17.27;
  const b = 237.7;
  const clampedRh = Math.max(1, Math.min(100, rh));
  const alpha = (a * temp) / (b + temp) + Math.log(clampedRh / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  return Number(dewPoint.toFixed(1));
}

/**
 * Calculates Vapor Pressure Deficit (VPD) in kPa
 */
export function calculateVPD(temp: number, rh: number): { vpdKpa: number; status: "Baixo" | "Moderado" | "Alto" } {
  // Saturated Vapor Pressure (Tetens formula in kPa)
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  // Actual Vapor Pressure
  const ea = es * (Math.max(0, Math.min(100, rh)) / 100);
  const vpd = Math.max(0, es - ea);
  const vpdRounded = Number(vpd.toFixed(2));

  let status: "Baixo" | "Moderado" | "Alto" = "Moderado";
  if (vpdRounded < 0.8) status = "Baixo";
  else if (vpdRounded > 1.5) status = "Alto";

  return { vpdKpa: vpdRounded, status };
}

/**
 * Reduces station atmospheric pressure to Mean Sea Level (MSL) in hPa
 * @param stationPressLocal Local pressure in hPa
 * @param temp Current temperature in °C
 * @param altitudeM Station altitude in meters (Default: 760m for BR-EMA01)
 */
export function reducePressureToSeaLevel(
  stationPressLocal: number,
  temp: number,
  altitudeM: number = 760
): number {
  const lapseRate = 0.0065; // standard adiabatic lapse rate (K/m)
  const tempK = temp + 273.15;
  const factor = Math.pow(1 - (lapseRate * altitudeM) / (tempK + lapseRate * altitudeM), -5.257);
  const pMsl = stationPressLocal * factor;
  return Number(pMsl.toFixed(1));
}

/**
 * Calculates Perceived Thermal Sensation (Heat Index or Wind Chill)
 */
export function calculateThermalSensation(temp: number, rh: number, windKmH: number): number {
  // If cold and windy: Wind Chill (Environment Canada / NOAA)
  if (temp <= 15 && windKmH >= 5) {
    const windChill =
      13.12 + 0.6215 * temp - 11.37 * Math.pow(windKmH, 0.16) + 0.3965 * temp * Math.pow(windKmH, 0.16);
    return Number(windChill.toFixed(1));
  }

  // If warm and humid: Heat Index (Steadman / Rothfusz)
  if (temp >= 20 && rh >= 30) {
    // Convert to Fahrenheit for standard Rothfusz polynomial
    const tf = temp * 1.8 + 32;
    let hiF =
      -42.379 +
      2.04901523 * tf +
      10.14333127 * rh -
      0.22475541 * tf * rh -
      0.00683783 * tf * tf -
      0.05481717 * rh * rh +
      0.00122874 * tf * tf * rh +
      0.00085282 * tf * rh * rh -
      0.00000199 * tf * tf * rh * rh;

    if (rh < 13 && tf >= 80 && tf <= 112) {
      hiF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tf - 95)) / 17);
    } else if (rh > 85 && tf >= 80 && tf <= 87) {
      hiF += ((rh - 85) / 10) * ((87 - tf) / 5);
    }

    const hiC = (hiF - 32) / 1.8;
    return Number(hiC.toFixed(1));
  }

  // Australian apparent temperature approximation
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp));
  const at = temp + 0.33 * e - 0.7 * (windKmH / 3.6) - 4.0;
  return Number(at.toFixed(1));
}

/**
 * Maps compass direction abbreviations to degrees (0 - 360)
 */
export function compassDirectionToDegrees(direction: string): number {
  const map: Record<string, number> = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 158,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
  };
  const clean = direction.trim().toUpperCase();
  return map[clean] !== undefined ? map[clean] : 158;
}

/**
 * Calculates Beaufort wind scale and descriptor
 */
export function calculateBeaufort(windSpeedKmH: number): { scale: number; label: string } {
  if (windSpeedKmH < 1) return { scale: 0, label: "Calmo" };
  if (windSpeedKmH <= 5) return { scale: 1, label: "Aragem" };
  if (windSpeedKmH <= 11) return { scale: 2, label: "Brisa Leve" };
  if (windSpeedKmH <= 19) return { scale: 3, label: "Brisa Leve" };
  if (windSpeedKmH <= 28) return { scale: 4, label: "Brisa Moderada" };
  if (windSpeedKmH <= 38) return { scale: 5, label: "Brisa Fresca" };
  if (windSpeedKmH <= 49) return { scale: 6, label: "Vento Fresco" };
  if (windSpeedKmH <= 61) return { scale: 7, label: "Vento Forte" };
  if (windSpeedKmH <= 74) return { scale: 8, label: "Ventania" };
  if (windSpeedKmH <= 88) return { scale: 9, label: "Ventania Forte" };
  if (windSpeedKmH <= 102) return { scale: 10, label: "Tempestade" };
  if (windSpeedKmH <= 117) return { scale: 11, label: "Tempestade Violenta" };
  return { scale: 12, label: "Furacão" };
}

/**
 * Estimates battery percentage from voltage (3.0V - 4.2V lithium-ion curve)
 */
export function batteryVoltageToPct(voltage: number): number {
  if (voltage >= 4.2) return 100;
  if (voltage <= 3.2) return 5;
  const pct = ((voltage - 3.2) / (4.2 - 3.2)) * 100;
  return Math.min(100, Math.max(5, Math.round(pct)));
}

export interface SunTimesResult {
  nascerDoSol: string;
  porDoSol: string;
  meioDiaSolar: string;
  duracaoLuzSolar: string;
  duracaoMinutos: number;
  crepusculoMatutino: string;
  crepusculoVespertino: string;
}

/**
 * Calculates accurate astronomical Sunrise, Sunset, Solar Noon and Day Length
 * for Agudos/SP (Lat: -22.4694°, Lon: -48.9864°, Timezone: America/Sao_Paulo UTC-3)
 */
export function calculateSunTimes(
  date: Date,
  latitude = -22.4694,
  longitude = -48.9864
): SunTimesResult {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Day of year calculation
  const N1 = Math.floor((275 * m) / 9);
  const N2 = Math.floor((m + 9) / 12);
  const N3 = 1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3);
  const N = N1 - N2 * N3 + d - 30;

  const lngHour = longitude / 15;

  const computeEvent = (zenith: number, isSunrise: boolean) => {
    const t = N + (isSunrise ? 6 - lngHour : 18 - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    let L = M + 1.916 * Math.sin((M * Math.PI) / 180) + 0.02 * Math.sin((2 * M * Math.PI) / 180) + 282.634;
    L = ((L % 360) + 360) % 360;

    let RA = (Math.atan(0.91764 * Math.tan((L * Math.PI) / 180)) * 180) / Math.PI;
    RA = ((RA % 360) + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (Lquadrant - RAquadrant)) / 15;

    const sinDec = 0.39782 * Math.sin((L * Math.PI) / 180);
    const cosDec = Math.cos(Math.asin(sinDec));

    const cosH =
      (Math.cos((zenith * Math.PI) / 180) - sinDec * Math.sin((latitude * Math.PI) / 180)) /
      (cosDec * Math.cos((latitude * Math.PI) / 180));

    if (cosH > 1) return null; // Polar night
    if (cosH < -1) return null; // Midnight sun

    const H = isSunrise ? 360 - (Math.acos(cosH) * 180) / Math.PI : (Math.acos(cosH) * 180) / Math.PI;
    const H_hours = H / 15;

    const T = H_hours + RA - 0.06571 * t - 6.622;
    const UT = ((T - lngHour) % 24 + 24) % 24;

    // Convert UT to BRT (UTC-3)
    const localHours = ((UT - 3) % 24 + 24) % 24;
    const hh = Math.floor(localHours);
    const mm = Math.floor((localHours - hh) * 60);

    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const officialZenith = 90.833; // 90° 50' standard refraction
  const civilZenith = 96.0;      // civil twilight

  const sunrise = computeEvent(officialZenith, true) || "06:15";
  const sunset = computeEvent(officialZenith, false) || "18:05";
  const dawn = computeEvent(civilZenith, true) || "05:52";
  const dusk = computeEvent(civilZenith, false) || "18:28";

  const [sH, sM] = sunrise.split(":").map(Number);
  const [eH, eM] = sunset.split(":").map(Number);
  let totalMin = eH * 60 + eM - (sH * 60 + sM);
  if (totalMin < 0) totalMin += 24 * 60;
  const dH = Math.floor(totalMin / 60);
  const dM = totalMin % 60;

  const noonMin = sH * 60 + sM + Math.floor(totalMin / 2);
  const nH = Math.floor(noonMin / 60) % 24;
  const nM = noonMin % 60;
  const solarNoon = `${String(nH).padStart(2, "0")}:${String(nM).padStart(2, "0")}`;

  return {
    nascerDoSol: sunrise,
    porDoSol: sunset,
    meioDiaSolar: solarNoon,
    duracaoLuzSolar: `${dH}h ${String(dM).padStart(2, "0")}min`,
    duracaoMinutos: totalMin,
    crepusculoMatutino: dawn,
    crepusculoVespertino: dusk,
  };
}
