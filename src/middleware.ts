import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();
    const pathname = req.nextUrl.pathname;

    // Public routes
    const isPublic = pathname === "/" || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
    const isAdmin = pathname.startsWith("/admin");

    // 1. Redirect unauthenticated users from protected routes
    if (!isPublic && !userId) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signInUrl);
    }

    // 2. Role-based check for admin routes
    if (isAdmin && userId) {
        const role = (sessionClaims?.metadata as { role?: string })?.role;
        if (role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }
});

export const config = {
    matcher: [
        "/((?!.*\\..*|_next).*)",
        "/",
        "/(api|trpc)(.*)"
    ],
};
