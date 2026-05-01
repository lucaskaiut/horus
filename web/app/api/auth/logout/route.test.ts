import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { POST } from "@/app/api/auth/logout/route";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const { cookieSetMock, cookieGetMock } = vi.hoisted(() => ({
  cookieSetMock: vi.fn(),
  cookieGetMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookieGetMock,
    set: cookieSetMock,
    delete: vi.fn(),
  })),
}));

describe("POST /api/auth/logout (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieSetMock.mockReset();
    cookieGetMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("chama logout no upstream com Bearer do cookie quando presente", async () => {
    cookieGetMock.mockReturnValueOnce({ value: "cookie-token" });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(new Request("http://localhost/api/auth/logout", { method: "POST" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer cookie-token",
        }),
      }),
    );

    expect(cookieSetMock).toHaveBeenCalledWith(
      AUTH_SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }),
    );
  });

  it("prefere Bearer do header Authorization quando informado", async () => {
    cookieGetMock.mockReturnValueOnce({ value: "cookie-token" });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: { authorization: "Bearer header-token" },
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          authorization: "Bearer header-token",
        }),
      }),
    );
  });

  it("não falha quando não há token: apenas limpa o cookie", async () => {
    cookieGetMock.mockReturnValueOnce(undefined);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(new Request("http://localhost/api/auth/logout", { method: "POST" }));

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieSetMock).toHaveBeenCalled();
  });
});
