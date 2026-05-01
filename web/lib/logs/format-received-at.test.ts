import { describe, expect, it } from "vitest";

import { formatReceivedAtForDisplay } from "./format-received-at";

describe("formatReceivedAtForDisplay", () => {
  it("retorna traço para vazio ou nullish", () => {
    expect(formatReceivedAtForDisplay(null)).toBe("—");
    expect(formatReceivedAtForDisplay(undefined)).toBe("—");
    expect(formatReceivedAtForDisplay("")).toBe("—");
  });

  it("retorna o valor original quando não for data válida", () => {
    expect(formatReceivedAtForDisplay("não é data")).toBe("não é data");
  });

  it("formata instante ISO em string não vazia", () => {
    const out = formatReceivedAtForDisplay("2026-04-29T09:00:00.000Z");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toBe("—");
  });
});
