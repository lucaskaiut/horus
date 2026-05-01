import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { sanitizeUser } from "@/app/api/auth/_server/sanitize";

type ApiMeResponse = { data?: { name?: unknown; email?: unknown } };

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("elog_auth_token")?.value ?? "";
  const headerAuth = request.headers.get("authorization")?.trim() ?? "";
  const authorization =
    headerAuth.length > 0
      ? headerAuth
      : cookieToken.trim().length > 0
        ? `Bearer ${cookieToken.trim()}`
        : "";

  const upstream = await fetch(`${apiUrl}/me`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization,
    },
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as ApiMeResponse | null;
  if (!upstream.ok) {
    return NextResponse.json(json ?? { message: "Unauthorized" }, { status: upstream.status });
  }

  const user = sanitizeUser({ name: json?.data?.name, email: json?.data?.email });
  return NextResponse.json({ data: { user } }, { status: 200 });
}

