import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/chat(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname;
  const isProtected = isProtectedRoute(req);
  const authState = await auth();

  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] request", {
      path,
      isProtected,
      userId: authState.userId ?? null,
      sessionId: authState.sessionId ?? null,
    });
  }

  if (isProtected) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/(.*)"],
};
