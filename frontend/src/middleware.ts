import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/change-password") ||
    pathname.startsWith("/invite");

  const isPublicPage = pathname === "/" || isAuthPage;

  // Usuário NÃO autenticado tentando acessar página protegida → redireciona para login
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário JÁ autenticado tentando acessar página de auth (login, register) → redireciona para dashboard
  if (token && isAuthPage) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Usuário autenticado na raiz → redireciona para dashboard
  if (token && pathname === "/") {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - api routes internas do Next.js
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
