import type { ApiErrorPayload } from "@/lib/auth/types";

export class HttpError extends Error {
  public readonly status: number;
  public readonly payload: ApiErrorPayload | null;

  public constructor(message: string, status: number, payload: ApiErrorPayload | null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

async function safeReadJson(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchJsonOrThrow<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  if (response.ok) {
    return (await response.json()) as T;
  }

  const payload = (await safeReadJson(response)) as ApiErrorPayload | null;
  throw new HttpError("Request failed", response.status, payload);
}

