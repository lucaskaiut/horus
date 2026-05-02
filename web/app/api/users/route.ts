import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

type UpstreamError = { message?: unknown; errors?: unknown };

function bearerHeaders(token: string): HeadersInit {
  return {
    accept: "application/json",
    "content-type": "application/json",
    authorization: token.trim() ? `Bearer ${token}` : "",
  };
}

export async function GET(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";

  const url = new URL(request.url);
  const upstreamUrl = `${apiUrl}/users${url.search}`;

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: bearerHeaders(token),
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as unknown;
  if (!upstream.ok) {
    const payload = (json ?? { message: "Request failed" }) as UpstreamError;
    return NextResponse.json(payload, { status: upstream.status });
  }

  return NextResponse.json(json ?? { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } }, {
    status: 200,
  });
}

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";

  const body = await request.text();

  const upstream = await fetch(`${apiUrl}/users`, {
    method: "POST",
    headers: bearerHeaders(token),
    body,
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as unknown;
  if (!upstream.ok) {
    const payload = (json ?? { message: "Request failed" }) as UpstreamError;
    return NextResponse.json(payload, { status: upstream.status });
  }

  return NextResponse.json(json ?? {}, { status: upstream.status });
}
