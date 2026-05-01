import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

type UpstreamError = { message?: unknown; errors?: unknown };

export async function GET(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";

  const url = new URL(request.url);
  const upstreamUrl = `${apiUrl}/logs/summary${url.search}`;

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: token.trim() ? `Bearer ${token}` : "",
    },
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as unknown;
  if (!upstream.ok) {
    const payload = (json ?? { message: "Request failed" }) as UpstreamError;
    return NextResponse.json(payload, { status: upstream.status });
  }

  return NextResponse.json(json ?? { data: null }, { status: 200 });
}
