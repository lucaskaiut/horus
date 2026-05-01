import { describe, expect, it, vi } from "vitest";

import { AUTH_TOKEN_STORAGE_KEY } from "@/lib/auth/constants";
import {
  clearAuthTokenFromStorage,
  readAuthTokenFromStorage,
  writeAuthTokenToStorage,
} from "@/lib/auth/storage";

function createStorageMock(initial: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initial));

  return {
    get length() {
      return store.size;
    },
    clear: vi.fn(() => store.clear()),
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => store.delete(key)),
    setItem: vi.fn((key: string, value: string) => store.set(key, String(value))),
  };
}

describe("auth storage", () => {
  it("retorna null quando não há token", () => {
    const storage = createStorageMock();
    expect(readAuthTokenFromStorage(storage)).toBeNull();
  });

  it("normaliza token vazio para null", () => {
    const storage = createStorageMock({ [AUTH_TOKEN_STORAGE_KEY]: "   " });
    expect(readAuthTokenFromStorage(storage)).toBeNull();
  });

  it("escreve e lê token", () => {
    const storage = createStorageMock();
    writeAuthTokenToStorage(storage, "abc");
    expect(readAuthTokenFromStorage(storage)).toBe("abc");
  });

  it("remove token", () => {
    const storage = createStorageMock({ [AUTH_TOKEN_STORAGE_KEY]: "abc" });
    clearAuthTokenFromStorage(storage);
    expect(readAuthTokenFromStorage(storage)).toBeNull();
  });
});

