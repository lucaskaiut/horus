import { describe, expect, it } from "vitest";

import { resolveLogLevelLabelPt } from "./log-level-labels";

describe("resolveLogLevelLabelPt", () => {
  it("traduz níveis conhecidos", () => {
    expect(resolveLogLevelLabelPt("emergency")).toBe("emergência");
    expect(resolveLogLevelLabelPt("critical")).toBe("Crítico");
    expect(resolveLogLevelLabelPt("error")).toBe("Erro");
  });

  it("preserva texto customizado quando a chave é desconhecida", () => {
    expect(resolveLogLevelLabelPt("custom", "CUSTOM")).toBe("CUSTOM");
  });
});
