import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getSession,
    HEAD_VIEW_AS_COOKIE,
} from "@/lib/auth";

export async function GET(
    request: NextRequest
) {
    const session =
        await getSession();

    if (!session) {
        return NextResponse.redirect(
            new URL(
                "/login",
                request.url
            )
        );
    }

    if (session.role !== "HEAD") {
        return NextResponse.redirect(
            new URL(
                "/student",
                request.url
            )
        );
    }

    const returnTo =
        request.nextUrl.searchParams.get(
            "returnTo"
        );

    /*
     * Only allow internal paths.
     *
     * This prevents an external redirect such as:
     * https://example.com
     */
    const safeReturnTo =
        returnTo &&
        returnTo.startsWith("/") &&
        !returnTo.startsWith("//")
            ? returnTo
            : "/head/students";

    const response =
        NextResponse.redirect(
            new URL(
                safeReturnTo,
                request.url
            )
        );

    response.cookies.set({
        name:
            HEAD_VIEW_AS_COOKIE,
        value: "",
        httpOnly: true,
        secure:
            process.env.NODE_ENV ===
            "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(0),
    });

    return response;
}