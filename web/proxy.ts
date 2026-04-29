import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function hasAuthCookie(request: NextRequest): boolean {
  const token = request.cookies.get("elog_auth_token")?.value ?? "";
  return token.trim().length > 0;
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";
  const isAuthed = hasAuthCookie(request);

  if (isLoginRoute && isAuthed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLoginRoute && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  /**
   * Propaga o pathname atual via header para Server Components.
   * Isso permite refletir estado ativo do menu sem Client Components.
   */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-elog-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/login", "/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

