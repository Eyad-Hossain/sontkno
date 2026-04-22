// middleware.ts
// Route-level authentication enforcement.
// Only /admin is hard-protected here; the feed is public-readable.

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Protect admin routes strictly
    "/admin/:path*",
    // Run middleware on all pages except static assets and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};