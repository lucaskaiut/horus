import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PATCH, PUT } from "@/app/api/users/[id]/route";

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

function ctx(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/users/[id] (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "t" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("chama upstream com id codificado e Bearer", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { id: 5, name: "X", email: "x@x.com", created_at: null, updated_at: null } }, 200),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(new Request("http://localhost/api/users/5", { method: "GET" }), ctx("5"));

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/users/5",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ authorization: "Bearer t" }),
      }),
    );
  });
});

describe("PATCH /api/users/[id] (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "t" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("encaminha corpo JSON e método PATCH", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: 3, name: "Alt" } }, 200));
    vi.stubGlobal("fetch", fetchMock);

    const patchBody = { name: "Alt" };
    const res = await PATCH(
      new Request("http://localhost/api/users/3", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      }),
      ctx("3"),
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/users/3",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(patchBody),
        headers: expect.objectContaining({
          authorization: "Bearer t",
          "content-type": "application/json",
        }),
      }),
    );
  });
});

describe("PUT /api/users/[id] (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "t" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("encaminha PUT com corpo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }, 200));
    vi.stubGlobal("fetch", fetchMock);

    await PUT(
      new Request("http://localhost/api/users/2", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Full" }),
      }),
      ctx("2"),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/users/2",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({ "content-type": "application/json" }),
      }),
    );
  });
});

describe("DELETE /api/users/[id] (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
    cookieGetMock.mockReset();
    cookieGetMock.mockReturnValue({ value: "t" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("propaga querystring opcional para o upstream", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: "ok" }, 200));
    vi.stubGlobal("fetch", fetchMock);

    const res = await DELETE(
      new Request("http://localhost/api/users/7?dry_run=1", { method: "DELETE" }),
      ctx("7"),
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/users/7?dry_run=1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ authorization: "Bearer t" }),
      }),
    );
  });

  it("repassa erro do upstream", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Forbidden" }, 403)));

    const res = await DELETE(new Request("http://localhost/api/users/1", { method: "DELETE" }), ctx("1"));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "Forbidden" });
  });
});
