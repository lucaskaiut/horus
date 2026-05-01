import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { sanitizeUser } from "@/app/api/auth/_server/sanitize";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import type { LoginRequestBody } from "@/lib/auth/types";

type ApiLoginResponse = { data?: { token?: unknown; name?: unknown; email?: unknown } };

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const body = (await request.json()) as LoginRequestBody;

  const upstream = await fetch(`${apiUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as ApiLoginResponse | null;
  if (!upstream.ok) {
    return NextResponse.json(json ?? { message: "Login failed" }, { status: upstream.status });
  }

  const token = typeof json?.data?.token === "string" ? json.data.token : "";
  const user = sanitizeUser({ name: json?.data?.name, email: json?.data?.email });

  /**
   * BFF: sessão ficam apenas no cookie HttpOnly; não retornamos o token ao cliente.
   */
  const response = NextResponse.json({ data: { user } }, { status: 201 });

  /**
   * Cookie HttpOnly: sinal otimista de “tem token” para o proxy; `/me` valida de fato.
   *
   * No Next.js 16+, `cookies()` é assíncrono e precisa ser aguardado antes de `.set`.
   */
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

