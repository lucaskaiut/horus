import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

type UpstreamError = { message?: unknown; errors?: unknown };

type RouteContext = {
  params: Promise<{ id: string }>;
};

function bearerHeaders(token: string, contentType?: string): HeadersInit {
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: token.trim() ? `Bearer ${token}` : "",
  };
  if (contentType) {
    headers["content-type"] = contentType;
  }
  return headers;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";

  const upstream = await fetch(`${apiUrl}/users/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: bearerHeaders(token),
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as unknown;
  if (!upstream.ok) {
    const payload = (json ?? { message: "Request failed" }) as UpstreamError;
    return NextResponse.json(payload, { status: upstream.status });
  }

  return NextResponse.json(json ?? {}, { status: upstream.status });
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";
  const body = await request.text();

  const upstream = await fetch(`${apiUrl}/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: bearerHeaders(token, "application/json"),
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

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";
  const body = await request.text();

  const upstream = await fetch(`${apiUrl}/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: bearerHeaders(token, "application/json"),
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

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";

  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = `${apiUrl}/users/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;

  const upstream = await fetch(path, {
    method: "DELETE",
    headers: bearerHeaders(token),
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as unknown;
  if (!upstream.ok) {
    const payload = (json ?? { message: "Request failed" }) as UpstreamError;
    return NextResponse.json(payload, { status: upstream.status });
  }

  return NextResponse.json(json ?? {}, { status: upstream.status });
}
