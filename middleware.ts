import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
    // 1. Protect all routes except public ones
    if (!isPublicRoute(req)) {
        await (await auth()).protect();
    }

    // 2. Extra role check for admin
    if (isAdminRoute(req)) {
        const { sessionClaims } = await auth();
        if ((sessionClaims?.metadata as { role?: string })?.role !== "admin") {
            const url = new URL("/", req.url);
            return Response.redirect(url);
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
