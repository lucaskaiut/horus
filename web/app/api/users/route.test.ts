import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/users/route";

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

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/users (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "session-token" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("encaminha querystring e Bearer a partir do cookie para o upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          data: [{ id: 1, name: "A", email: "a@a.com", created_at: null, updated_at: null }],
          links: {},
          meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
        },
        200,
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const req = new Request("http://localhost/api/users?page=2&per_page=15", { method: "GET" });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/users?page=2&per_page=15",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          authorization: "Bearer session-token",
        }),
      }),
    );
  });

  it("repassa status e corpo quando upstream retorna erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, 401)),
    );

    const res = await GET(new Request("http://localhost/api/users", { method: "GET" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ message: "Unauthorized" });
  });

  it("falha de forma explícita quando API_URL não está configurada", async () => {
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", vi.fn());

    await expect(GET(new Request("http://localhost/api/users", { method: "GET" }))).rejects.toThrow(
      "Missing required env var: API_URL",
    );
  });
});

describe("POST /api/users (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "session-token" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("encaminha corpo e token para o upstream e devolve o status do upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { id: 9, name: "Novo", email: "n@n.com" } }, 201),
    );
    vi.stubGlobal("fetch", fetchMock);

    const body = { name: "Novo", email: "n@n.com", password: "secret", password_confirmation: "secret" };
    const res = await POST(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: { id: 9, name: "Novo", email: "n@n.com" } });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/users",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer session-token",
          "content-type": "application/json",
        }),
        body: JSON.stringify(body),
      }),
    );
  });

  it("repassa 422 de validação do upstream", async () => {
    const payload = { message: "Unprocessable", errors: { email: ["invalid"] } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload, 422)));

    const res = await POST(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "", email: "" }),
      }),
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(payload);
  });
});
