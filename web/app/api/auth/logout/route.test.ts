import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/auth/logout/route";

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

describe("POST /api/auth/logout (BFF)", () => {
  beforeEach(() => {
    cookieSetMock.mockReset();
  });

  it("limpa cookie de sessão e retorna 200", async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(cookieSetMock).toHaveBeenCalledWith(
      "elog_auth_token",
      "",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }),
    );
  });
});
