import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isPathOnboarding = req.nextUrl.pathname.startsWith("/onboarding");

        // If user is authenticated but doesn't have a phone number,
        // redirect them to onboarding unless they are already there.
        if (isAuth && !token.phoneNumber && !isPathOnboarding) {
            return NextResponse.redirect(new URL("/onboarding", req.url));
        }

        // If user has a phone number and tries to go to onboarding, send them back to dashboard
        if (isAuth && token.phoneNumber && isPathOnboarding) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/book/:path*", "/teams/:path*", "/onboarding/:path*"],
};
