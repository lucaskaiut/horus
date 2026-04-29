export function getRequiredApiUrl(): string {
  const apiUrl = process.env.API_URL;
  if (typeof apiUrl !== "string" || apiUrl.trim().length === 0) {
    throw new Error("Missing required env var: API_URL");
  }

  return apiUrl.replace(/\/+$/, "");
}

