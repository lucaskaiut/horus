import { cookies } from "next/headers";

import { getRequiredApiUrl } from "@/app/api/auth/_server/env";
import type { LogsSummaryApiResponse, LogsSummaryPayload } from "@/lib/logs/summary-types";

export async function fetchLogsSummaryServer(queryString: string): Promise<LogsSummaryPayload | null> {
  const token = (await cookies()).get("elog_auth_token")?.value ?? "";
  if (!token.trim()) {
    return null;
  }

  const apiUrl = getRequiredApiUrl();
  const res = await fetch(`${apiUrl}/logs/summary?${queryString}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token.trim()}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const json = (await res.json()) as LogsSummaryApiResponse;
  return json.data ?? null;
}
