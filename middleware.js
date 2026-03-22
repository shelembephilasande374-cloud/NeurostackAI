import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // These routes are accessible without login
  publicRoutes: ["/", "/api/generate"],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
