import { describe, expect, it } from "vitest";

import { proxyAuthTokenFromStorage } from "@/lib/auth/storageTokenProxy";

function createStorageMock(token: string | null): Storage {
  return {
    length: 0,
    clear() {},
    getItem(key: string) {
      if (key !== "elog:auth:token") {
        return null;
      }
      return token;
    },
    key() {
      return null;
    },
    removeItem() {},
    setItem() {},
  };
}

describe("proxyAuthTokenFromStorage", () => {
  it("falha quando não existe token", () => {
    const result = proxyAuthTokenFromStorage(createStorageMock(null));
    expect(result).toEqual({ ok: false, reason: "missing_token" });
  });

  it("passa quando token existe", () => {
    const result = proxyAuthTokenFromStorage(createStorageMock("tkn"));
    expect(result).toEqual({ ok: true, token: "tkn" });
  });
});

