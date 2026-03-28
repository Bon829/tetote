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
        const { userId } = await auth();
        if (!userId) {
            // Encode the current URL to return back after sign-in
            const url = new URL("/sign-in", req.url);
            url.searchParams.set("redirect_url", req.url);
            return Response.redirect(url);
        }
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
