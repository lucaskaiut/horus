import { clearAuthTokenFromStorage, writeAuthTokenToStorage } from "@/lib/auth/storage";
import { fetchMeViaBff, loginViaBff, logoutViaBff } from "@/lib/auth/client";
import { proxyAuthTokenFromStorage } from "@/lib/auth/storageTokenProxy";
import type { AuthenticatedUser, LoginRequestBody } from "@/lib/auth/types";

export type AuthState =
  | { status: "checking" }
  | { status: "authenticated"; user: AuthenticatedUser; token: string }
  | { status: "unauthenticated" };

export async function performLogin(
  storage: Storage,
  body: LoginRequestBody,
): Promise<{ token: string; user: AuthenticatedUser }> {
  const { token, user } = await loginViaBff(body);
  writeAuthTokenToStorage(storage, token);
  return { token, user };
}

export async function verifyAuthentication(storage: Storage): Promise<AuthState> {
  const proxied = proxyAuthTokenFromStorage(storage);
  if (!proxied.ok) {
    return { status: "unauthenticated" };
  }

  try {
    const me = await fetchMeViaBff(proxied.token);
    return { status: "authenticated", user: me.user, token: proxied.token };
  } catch {
    /**
     * Regra: token presente no storage não implica token válido.
     * Se o upstream rejeitar, limpamos o token local para evitar loops.
     */
    clearAuthTokenFromStorage(storage);
    try {
      await logoutViaBff();
    } catch {
      // best-effort: limpeza de cookie é otimista e não deve travar o fluxo
    }
    return { status: "unauthenticated" };
  }
}

