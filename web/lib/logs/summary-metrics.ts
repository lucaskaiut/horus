import type { LogsSummaryPayload } from "./summary-types";

const SEVERE_LEVELS = new Set(["error", "critical", "alert", "emergency"]);

/** Contagem de registros nos níveis considerados graves (servidor já agregou por nível). */
export function summarizeSevereTotal(summary: LogsSummaryPayload): number {
  return summary.by_level.reduce((acc, row) => {
    if (row.key === "(vazio)") {
      return acc;
    }

    return SEVERE_LEVELS.has(row.key.toLowerCase()) ? acc + row.count : acc;
  }, 0);
}
