import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";

type UpstreamError = { message?: unknown; errors?: unknown };

export async function GET(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();

  const cookieStore = await cookies();
  const token = cookieStore.get("elog_auth_token")?.value ?? "";

  const url = new URL(request.url);
  const upstreamUrl = `${apiUrl}/logs${url.search}`;

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

  return NextResponse.json(json ?? { data: [], meta: { total: 0, page: 1, per_page: 50 } }, {
    status: 200,
  });
}

