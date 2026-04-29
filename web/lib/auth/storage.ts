const AUTH_TOKEN_STORAGE_KEY = "elog:auth:token";

export function readAuthTokenFromStorage(storage: Storage): string | null {
  const token = storage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token === null) {
    return null;
  }

  const trimmed = token.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function writeAuthTokenToStorage(storage: Storage, token: string): void {
  storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthTokenFromStorage(storage: Storage): void {
  storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

