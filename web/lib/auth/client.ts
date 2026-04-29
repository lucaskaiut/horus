import { fetchJsonOrThrow } from "@/lib/auth/http";
import type { LoginRequestBody, LoginSuccess, MeSuccess } from "@/lib/auth/types";

type LoginBffResponse = { data: { token: string; user: { name: string; email: string } } };
type MeBffResponse = { data: { user: { name: string; email: string } } };

export async function loginViaBff(body: LoginRequestBody): Promise<LoginSuccess> {
  const result = await fetchJsonOrThrow<LoginBffResponse>("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    token: result.data.token,
    user: result.data.user,
  };
}

export async function fetchMeViaBff(token: string): Promise<MeSuccess> {
  const result = await fetchJsonOrThrow<MeBffResponse>("/api/auth/me", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return { user: result.data.user };
}

export async function logoutViaBff(): Promise<void> {
  await fetchJsonOrThrow<{ ok: true }>("/api/auth/logout", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
}

