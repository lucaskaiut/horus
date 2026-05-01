import { describe, expect, it, vi, afterEach } from "vitest";

import { verifyAuthentication } from "@/lib/auth/session";

describe("verifyAuthentication", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retorna unauthenticated quando /me falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/auth/me")) {
          return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }
        if (url.includes("/api/auth/logout")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response("not found", { status: 404 });
      }),
    );

    const result = await verifyAuthentication();
    expect(result.status).toBe("unauthenticated");
    expect(fetch).toHaveBeenCalled();
  });

  it("retorna authenticated quando /me responde OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = typeof input === "string" ? input : input.url;
        if (!url.includes("/api/auth/me")) {
          return new Response("bad", { status: 404 });
        }
        return new Response(JSON.stringify({ data: { user: { name: "A", email: "a@a.com" } } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const result = await verifyAuthentication();
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.user).toEqual({ name: "A", email: "a@a.com" });
    }
  });
});
