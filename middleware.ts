import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    // 1. Protect all routes except public ones
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    // 2. Extra role check for admin
    if (isAdminRoute(req)) {
        const authObj = await auth();
        const role = (authObj.sessionClaims?.metadata as { role?: string })?.role;
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
