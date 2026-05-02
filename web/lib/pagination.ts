export function safeInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

export function buildPaginationItems(current: number, last: number): Array<number | "…"> {
  if (last <= 1) {
    return [1];
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(last);

  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= last) {
      pages.add(p);
    }
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | "…"> = [];

  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i]!;
    const prev = sorted[i - 1];
    if (typeof prev === "number" && page - prev > 1) {
      items.push("…");
    }
    items.push(page);
  }

  return items;
}
