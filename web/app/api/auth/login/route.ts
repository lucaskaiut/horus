import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { sanitizeUser } from "@/app/api/auth/_server/sanitize";
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
   * BFF: retornamos apenas o necessário para o frontend (token + user minimal),
   * evitando vazar payloads adicionais do upstream.
   */
  const response = NextResponse.json({ data: { token, user } }, { status: 201 });

  /**
   * Proxy (Next 16): como `proxy.ts` não enxerga `localStorage`, usamos cookie HttpOnly
   * como sinal otimista de “tem token”. O guard client-side continua validando via `/me`.
   *
   * No Next.js 16+, `cookies()` é assíncrono e precisa ser aguardado antes de `.set`.
   */
  const cookieStore = await cookies();
  cookieStore.set("elog_auth_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

