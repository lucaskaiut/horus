import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { POST } from "@/app/api/auth/login/route";

const { cookieSetMock } = vi.hoisted(() => ({
  cookieSetMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: cookieSetMock,
    delete: vi.fn(),
  })),
}));

function makeLoginRequest(body: object): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieSetMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("retorna 201, corpo sanitizado e define cookie HttpOnly quando upstream autentica", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            token: "plain-token",
            name: "Jane",
            email: "jane@example.com",
            extra: "should-not-leak",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeLoginRequest({
        login: "jane@example.com",
        password: "secret",
        google2faValidation: null,
      }),
    );

    expect(res.status).toBe(201);
    const json = (await res.json()) as {
      data: { token: string; user: { name: string; email: string } };
    };
    expect(json.data.token).toBe("plain-token");
    expect(json.data.user).toEqual({ name: "Jane", email: "jane@example.com" });
    expect(json.data).not.toHaveProperty("extra");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          login: "jane@example.com",
          password: "secret",
          google2faValidation: null,
        }),
      }),
    );

    expect(cookieSetMock).toHaveBeenCalledWith(
      "elog_auth_token",
      "plain-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
  });

  it("repassa status e corpo quando upstream retorna erro de validação (422)", async () => {
    const payload = { message: "Unprocessable", errors: { login: ["required"] } };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 422,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const res = await POST(
      makeLoginRequest({ login: "", password: "", google2faValidation: null }),
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(payload);
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it("retorna corpo genérico quando upstream falha sem JSON parseável", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Bad Gateway", { status: 502 })),
    );

    const res = await POST(
      makeLoginRequest({
        login: "a@a.com",
        password: "x",
        google2faValidation: null,
      }),
    );

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ message: "Login failed" });
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it("falha de forma explícita quando API_URL não está configurada", async () => {
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", vi.fn());

    await expect(
      POST(
        makeLoginRequest({
          login: "a@a.com",
          password: "x",
          google2faValidation: null,
        }),
      ),
    ).rejects.toThrow("Missing required env var: API_URL");
  });
});
