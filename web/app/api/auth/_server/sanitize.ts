import type { AuthenticatedUser } from "@/lib/auth/types";

export function sanitizeUser(input: unknown): AuthenticatedUser {
  const name = typeof (input as { name?: unknown } | null)?.name === "string" ? (input as { name: string }).name : "";
  const email = typeof (input as { email?: unknown } | null)?.email === "string" ? (input as { email: string }).email : "";

  return { name, email };
}

