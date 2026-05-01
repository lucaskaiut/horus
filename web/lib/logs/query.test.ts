import { describe, expect, it } from "vitest";

import { buildLogsSearchParams, parseLogsFiltersFromSearchParams } from "@/lib/logs/query";

describe("logs query", () => {
  it("buildLogsSearchParams deve serializar filtros e paginação", () => {
    const params = buildLogsSearchParams({
      page: 2,
      per_page: 20,
      sort: "received_at",
      order: "desc",
      filters: {
        level: "error",
        message: "timeout",
        channel: "http",
        has_exception: true,
        received_at_from: "2026-04-01",
        received_at_to: "2026-04-30",
      },
    });

    expect(params.get("page")).toBe("2");
    expect(params.get("per_page")).toBe("20");
    expect(params.get("sort")).toBe("received_at");
    expect(params.get("order")).toBe("desc");
    expect(params.get("filters[level]")).toBe("error");
    expect(params.get("filters[message]")).toBe("timeout");
    expect(params.get("filters[channel]")).toBe("http");
    expect(params.get("filters[has_exception]")).toBe("1");
    expect(params.get("filters[received_at][from]")).toBe("2026-04-01");
    expect(params.get("filters[received_at][to]")).toBe("2026-04-30");
  });

  it("parseLogsFiltersFromSearchParams deve ler filtros do URLSearchParams", () => {
    const params = new URLSearchParams();
    params.set("filters[level]", "warning");
    params.set("filters[has_exception]", "0");
    params.set("filters[received_at][from]", "2026-04-01");

    const parsed = parseLogsFiltersFromSearchParams(params);
    expect(parsed.level).toBe("warning");
    expect(parsed.has_exception).toBe(false);
    expect(parsed.received_at_from).toBe("2026-04-01");
  });
});

