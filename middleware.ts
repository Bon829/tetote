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

    // 2. Extra role check for admin
    if (isAdminRoute(req)) {
        const authObj = await auth();
        const role = (authObj.sessionClaims as any)?.publicMetadata?.role || (authObj.sessionClaims as any)?.metadata?.role;
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
