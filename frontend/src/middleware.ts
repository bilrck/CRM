import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  console.log("MIDDLEWARE EXECUTOU:", req.nextUrl.pathname);
  const token = req.cookies.get("token")?.value;

  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isPublic = ["/login", "/register", "/"].includes(req.nextUrl.pathname);

  // Se NÃO tiver token → bloquear páginas privadas
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se tiver token e estiver na Home, manda pro Dashboard (Opcional)
  if (token && req.nextUrl.pathname === "/") {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/marketing/:path*",
    "/leads/:path*",
    "/users/:path*",
    "/login",
  ],
};

