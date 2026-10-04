import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "fallback-secret-jangan-dipakai-production";
  return new TextEncoder().encode(secret);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isKasirRoute = pathname.startsWith("/kasir");

  if (!isAdminRoute && !isKasirRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload;
  try {
    const result = await jwtVerify(token, getSecretKey());
    payload = result.payload;
  } catch (err) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin boleh mengakses seluruh fitur, termasuk halaman kasir.
  if (isAdminRoute && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isKasirRoute && payload.role !== "kasir" && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kasir/:path*"],
};
