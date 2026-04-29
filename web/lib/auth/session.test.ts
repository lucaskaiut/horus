import { describe, expect, it, vi } from "vitest";

import { verifyAuthentication } from "@/lib/auth/session";

function createStorageMock(token: string | null): Storage {
  const data = new Map<string, string>();
  if (token !== null) {
    data.set("elog:auth:token", token);
  }

  return {
    get length() {
      return data.size;
    },
    clear: vi.fn(() => data.clear()),
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(data.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => data.delete(key)),
    setItem: vi.fn((key: string, value: string) => data.set(key, String(value))),
  };
}

describe("verifyAuthentication", () => {
  it("retorna unauthenticated quando token não existe", async () => {
    const result = await verifyAuthentication(createStorageMock(null));
    expect(result.status).toBe("unauthenticated");
  });

  it("retorna authenticated quando /me responde OK", async () => {
    const storage = createStorageMock("token-123");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ data: { user: { name: "A", email: "a@a.com" } } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const result = await verifyAuthentication(storage);
    expect(result.status).toBe("authenticated");
    if (result.status === "authenticated") {
      expect(result.token).toBe("token-123");
      expect(result.user).toEqual({ name: "A", email: "a@a.com" });
    }
  });

  it("limpa token e retorna unauthenticated quando /me falha", async () => {
    const storage = createStorageMock("token-123");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }),
    );

    const result = await verifyAuthentication(storage);
    expect(result.status).toBe("unauthenticated");
    expect(storage.getItem("elog:auth:token")).toBeNull();
  });
});

