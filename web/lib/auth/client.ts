import { fetchJsonOrThrow } from "@/lib/auth/http";
import type { LoginRequestBody, LoginSuccess, MeSuccess } from "@/lib/auth/types";

type LoginBffResponse = { data: { user: { name: string; email: string } } };
type MeBffResponse = { data: { user: { name: string; email: string } } };

export async function loginViaBff(body: LoginRequestBody): Promise<LoginSuccess> {
  const result = await fetchJsonOrThrow<LoginBffResponse>("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });

  return {
    user: result.data.user,
  };
}

export async function fetchMeViaBff(): Promise<MeSuccess> {
  const result = await fetchJsonOrThrow<MeBffResponse>("/api/auth/me", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    credentials: "same-origin",
  });

  return { user: result.data.user };
}

export async function logoutViaBff(bearerToken?: string | null): Promise<void> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  const trimmed = bearerToken?.trim();
  if (trimmed) {
    headers.Authorization = `Bearer ${trimmed}`;
  }

  await fetchJsonOrThrow<{ ok: true }>("/api/auth/logout", {
    method: "POST",
    headers,
    credentials: "same-origin",
  });
}

