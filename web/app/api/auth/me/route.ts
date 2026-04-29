import { NextResponse } from "next/server";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import { sanitizeUser } from "@/app/api/auth/_server/sanitize";

type ApiMeResponse = { data?: { name?: unknown; email?: unknown } };

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const authorization = request.headers.get("authorization") ?? "";

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

