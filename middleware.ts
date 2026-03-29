import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    // 1. Protect all routes except public ones
    if (!isPublicRoute(req)) {
        const fullUrl = req.url;
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", fullUrl);

        await auth.protect({
            unauthenticatedUrl: signInUrl.toString(),
        });
    }

    // 2. Role check for admin is now handled at the page level (client-side) 
    // to ensure metadata is correctly accessed via useUser().
});

export const config = {
    matcher: [
        "/((?!.*\\..*|_next).*)",
        "/",
        "/(api|trpc)(.*)"
    ],
};
