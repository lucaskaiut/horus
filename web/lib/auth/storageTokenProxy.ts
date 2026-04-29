import { readAuthTokenFromStorage } from "@/lib/auth/storage";

export type StorageTokenProxyResult =
  | { ok: true; token: string }
  | { ok: false; reason: "missing_token" };

/**
 * Validação otimista (client-side) do token no storage.
 *
 * Importante: isso não valida o token no servidor; apenas garante que existe
 * algo armazenado antes de tentar chamar `/me`.
 */
export function proxyAuthTokenFromStorage(storage: Storage): StorageTokenProxyResult {
  const token = readAuthTokenFromStorage(storage);
  if (token === null) {
    return { ok: false, reason: "missing_token" };
  }

  return { ok: true, token };
}

