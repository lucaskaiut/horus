import { fetchMeViaBff, loginViaBff, logoutViaBff } from "@/lib/auth/client";
import { clearAuthTokenFromStorage } from "@/lib/auth/storage";
import type { AuthenticatedUser, LoginRequestBody } from "@/lib/auth/types";

export type AuthState =
  | { status: "checking" }
  | { status: "authenticated"; user: AuthenticatedUser }
  | { status: "unauthenticated" };

export async function performLogin(body: LoginRequestBody): Promise<{ user: AuthenticatedUser }> {
  if (typeof window !== "undefined" && window.localStorage) {
    clearAuthTokenFromStorage(window.localStorage);
  }

  const { user } = await loginViaBff(body);
  return { user };
}

export async function verifyAuthentication(): Promise<AuthState> {
  try {
    const me = await fetchMeViaBff();
    return { status: "authenticated", user: me.user };
  } catch {
    try {
      await logoutViaBff();
    } catch {
      // best-effort: limpeza de sessão não deve travar navegação
    }
    return { status: "unauthenticated" };
  }
}

export async function performLogout(): Promise<void> {
  if (typeof window !== "undefined" && window.localStorage) {
    clearAuthTokenFromStorage(window.localStorage);
  }

  try {
    await logoutViaBff();
  } catch {
    // best-effort
  }
}
