import { NextResponse } from "next/server";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import type { RegisterRequestBody } from "@/lib/auth/types-register";

type ApiRegisterResponse = { data?: { id?: unknown; name?: unknown; email?: unknown } };

export async function POST(request: Request): Promise<Response> {
  const apiUrl = getRequiredApiUrl();
  const body = (await request.json()) as RegisterRequestBody;

  const upstream = await fetch(`${apiUrl}/register`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = (await upstream.json().catch(() => null)) as ApiRegisterResponse | null;
  if (!upstream.ok) {
    return NextResponse.json(json ?? { message: "Registration failed" }, { status: upstream.status });
  }

  const id = typeof json?.data?.id !== "undefined" ? String(json.data.id) : "";
  const name = typeof json?.data?.name === "string" ? json.data.name : "";
  const email = typeof json?.data?.email === "string" ? json.data.email : "";

  /** BFF: retorno mínimo, sem outros campos do upstream */
  return NextResponse.json({ data: { id, name, email } }, { status: 201 });
}
