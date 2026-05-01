import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { AUTH_SESSION_COOKIE_NAME } from "@/lib/auth/constants";

function resolveBearer(request: Request, cookieToken: string): string {
  const header = request.headers.get("authorization")?.trim() ?? "";
  if (header.length > 0 && header.toLowerCase().startsWith("bearer ")) {
    const value = header.slice(7).trim();
    if (value.length > 0) {
      return value;
    }
  }

  return cookieToken.trim();
}

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";
  const token = resolveBearer(request, cookieToken);

  if (token.length > 0) {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
    } catch {
      // best-effort: cookie e storage local sempre são limpos
    }
  }

  cookieStore.set(AUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
