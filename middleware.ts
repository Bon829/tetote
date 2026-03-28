import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
    "/booking(.*)",
    "/mypage(.*)",
]);

const isAdminRoute = createRouteMatcher([
    "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (isAdminRoute(req)) {
        if (role !== "admin") {
            const url = new URL("/", req.url);
            return Response.redirect(url);
        }
    }

    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
