import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

const isAdminRoute = createRouteMatcher([
    "/admin(.*)",
]);

import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
    const authObj = await auth();

    // 1. Protect all routes except public ones
    if (!isPublicRoute(req)) {
        if (!authObj.userId) {
            const signInUrl = new URL("/sign-in", req.url);
            signInUrl.searchParams.set("redirect_url", req.url);
            return NextResponse.redirect(signInUrl);
        }
    }

    // 2. Additional role check for admin routes
    if (isAdminRoute(req)) {
        const role = (authObj.sessionClaims?.metadata as { role?: string })?.role;
        if (role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
