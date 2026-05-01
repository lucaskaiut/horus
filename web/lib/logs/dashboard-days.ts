/** Período exibido no dashboard (altura do histograma e janela de datas no backend). */

export function clampDashboardDays(raw: unknown, fallback = 14): number {
  let n =
    typeof raw === "string"
      ? parseInt(raw, 10)
      : typeof raw === "number"
        ? raw
        : fallback;
  if (!Number.isFinite(n)) {
    n = fallback;
  }
  n = Math.trunc(n);

  return Math.min(90, Math.max(7, n));
}
