import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { POST } from "@/app/api/auth/register/route";

function makeRegisterRequest(body: object): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register (BFF)", () => {
  beforeEach(() => {
    vi.stubEnv("API_URL", "http://localhost:8000/api");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("retorna 201 com corpo sanitizado quando upstream registra usuário", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: 42,
            name: "Jane",
            email: "jane@example.com",
            extra: "omit",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRegisterRequest({
        name: "Jane",
        email: "jane@example.com",
        password: "secret123",
        password_confirmation: "secret123",
      }),
    );

    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { id: string; name: string; email: string } };
    expect(json.data).toEqual({ id: "42", name: "Jane", email: "jane@example.com" });
    expect(json.data).not.toHaveProperty("extra");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Jane",
          email: "jane@example.com",
          password: "secret123",
          password_confirmation: "secret123",
        }),
      }),
    );
  });

  it("repassa status quando upstream retorna erro de validação (422)", async () => {
    const payload = { message: "Unprocessable", errors: { email: ["duplicate"] } };
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
      makeRegisterRequest({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
      }),
    );

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual(payload);
  });
});
