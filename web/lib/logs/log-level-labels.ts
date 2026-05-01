import type { LogLevel } from "./types";

/** Labels em português para exibição na UI (valor técnico da API continua em inglês). */
export const LOG_LEVEL_PT: Record<LogLevel, string> = {
  debug: "Depuração",
  info: "Informação",
  notice: "Observação",
  warning: "Aviso",
  error: "Erro",
  critical: "Crítico",
  alert: "Alerta",
  emergency: "emergência",
};

const KNOWN: Set<string> = new Set(Object.keys(LOG_LEVEL_PT));

export function resolveLogLevelLabelPt(canonicalEnglish: string, rawFromApi?: string): string {
  const key = canonicalEnglish.toLowerCase();
  if (!KNOWN.has(key)) {
    return rawFromApi != null && rawFromApi !== "" ? rawFromApi.trim() : canonicalEnglish;
  }
  return LOG_LEVEL_PT[key as LogLevel];
}

export function isKnownLogLevelKey(canonicalEnglish: string): boolean {
  return KNOWN.has(canonicalEnglish.toLowerCase());
}
