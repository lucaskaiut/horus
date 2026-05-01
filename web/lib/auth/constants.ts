/** Cookie HttpOnly definido pelo BFF em `/api/auth/login`. */
export const AUTH_SESSION_COOKIE_NAME = "horus_auth_token";

/** Chave no `localStorage` / `sessionStorage` para o token no fluxo cliente. */
export const AUTH_TOKEN_STORAGE_KEY = "horus:auth:token";

/** Header propagado pelo middleware (`proxy.ts`) para Server Components. */
export const PATHNAME_PROPAGATION_HEADER = "x-horus-pathname";
