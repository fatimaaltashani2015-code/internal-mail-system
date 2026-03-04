import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret"
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && pathname.startsWith("/dashboard") && !pathname.includes("/change-password")) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const mustChange = (payload as { mustChangePassword?: boolean }).mustChangePassword;
      if (mustChange) {
        return NextResponse.redirect(new URL("/dashboard/change-password", request.url));
      }
    } catch {
      // token invalid, will be handled by getSession
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
