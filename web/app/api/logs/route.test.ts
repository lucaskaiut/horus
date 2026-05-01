import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/logs/route";

const { cookieGetMock } = vi.hoisted(() => ({
  cookieGetMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieGetMock,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("GET /api/logs (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "cookie-token" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("encaminha querystring e token via cookie para o upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [{ tracking_id: "t1", level: "error", message: "x", received_at: "2026-04-29" }],
          meta: { total: 1, page: 1, per_page: 20 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request(
      "http://localhost/api/logs?filters[level]=error&page=1&per_page=20&sort=received_at&order=desc",
      { method: "GET" },
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/logs?filters[level]=error&page=1&per_page=20&sort=received_at&order=desc",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          authorization: "Bearer cookie-token",
        }),
      }),
    );
  });

  it("repassa status e corpo quando upstream retorna erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const req = new Request("http://localhost/api/logs", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthorized" });
  });

  it("falha de forma explícita quando API_URL não está configurada", async () => {
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", vi.fn());

    await expect(GET(new Request("http://localhost/api/logs", { method: "GET" }))).rejects.toThrow(
      "Missing required env var: API_URL",
    );
  });
});

