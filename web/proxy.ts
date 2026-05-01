import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_SESSION_COOKIE_NAME, PATHNAME_PROPAGATION_HEADER } from "@/lib/auth/constants";

function hasAuthCookie(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_SESSION_COOKIE_NAME)?.value ?? "";
  return token.trim().length > 0;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login";
  const isAuthed = hasAuthCookie(request);

  if (isAuthPage && isAuthed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthPage && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /**
   * Propaga o pathname atual via header para Server Components.
   * Isso permite refletir estado ativo do menu sem Client Components.
   */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_PROPAGATION_HEADER, pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/login", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

