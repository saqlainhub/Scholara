import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    jwtVerify,
} from "jose";

import {
    AUTH_COOKIE_NAME,
} from "@/lib/auth/constants";

import {
    HEAD_VIEW_AS_COOKIE,
    HEAD_VIEW_AS_TEACHER_COOKIE,
} from "@/lib/auth/viewing";

const secretValue =
    process.env.AUTH_SECRET;

if (!secretValue) {
    throw new Error(
        "AUTH_SECRET is not configured."
    );
}

const secret =
    new TextEncoder().encode(
        secretValue
    );

async function getTokenPayload(
    request: NextRequest
) {
    try {
        const token =
            request.cookies.get(
                AUTH_COOKIE_NAME
            )?.value;

        if (!token) {
            return null;
        }

        const { payload } =
            await jwtVerify(
                token,
                secret
            );

        return payload;
    } catch {
        return null;
    }
}

export async function proxy(
    request: NextRequest
) {
    const { pathname } =
        request.nextUrl;

    /*
     * ============================================================
     * PUBLIC ROUTES
     * ============================================================
     *
     * These routes must be accessible without authentication.
     *
     * PWA files are especially important because the browser must
     * be able to request them before the user has logged in.
     */

    if (
        pathname === "/login" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/sw.js" ||
        pathname.startsWith("/api/auth/")
    ) {
        const payload =
            await getTokenPayload(
                request
            );

        if (
            pathname === "/login" &&
            payload?.role
        ) {
            const url =
                request.nextUrl.clone();

            switch (
                String(payload.role)
            ) {
                case "HEAD":
                    url.pathname =
                        "/head";
                    break;

                case "TEACHER":
                    url.pathname =
                        "/teacher";
                    break;

                case "STUDENT":
                    url.pathname =
                        `/student/${String(
                            payload.userId
                        )}`;
                    break;
            }

            return NextResponse.redirect(
                url
            );
        }

        return NextResponse.next();
    }

    /*
     * ============================================================
     * IGNORE NEXT INTERNALS / STATIC FILES
     * ============================================================
     */

    if (
        pathname.startsWith(
            "/_next/"
        ) ||
        pathname === "/favicon.ico" ||
        pathname.startsWith("/icons/")
    ) {
        return NextResponse.next();
    }

    const payload =
        await getTokenPayload(
            request
        );

    /*
     * ============================================================
     * NOT AUTHENTICATED
     * ============================================================
     */

    if (!payload?.role) {
        if (
            pathname.startsWith(
                "/api/"
            )
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        const url =
            request.nextUrl.clone();

        url.pathname = "/login";

        return NextResponse.redirect(
            url
        );
    }

    const role =
        String(payload.role);

    /*
     * ============================================================
     * HEAD VIEWING STUDENT PORTAL
     * ============================================================
     */

    if (
        role === "HEAD" &&
        (
            pathname === "/student" ||
            pathname.startsWith(
                "/student/"
            ) ||
            pathname ===
                "/api/student" ||
            pathname.startsWith(
                "/api/student/"
            )
        )
    ) {
        const viewingStudentId =
            request.cookies.get(
                HEAD_VIEW_AS_COOKIE
            )?.value;

        if (viewingStudentId) {
            const headers =
                new Headers(
                    request.headers
                );

            headers.set(
                "x-scolara-view-as",
                viewingStudentId
            );

            return NextResponse.next({
                request: {
                    headers,
                },
            });
        }
    }

    /*
     * ============================================================
     * HEAD VIEWING TEACHER PORTAL
     * ============================================================
     */

    if (
        role === "HEAD" &&
        (
            pathname === "/teacher" ||
            pathname.startsWith(
                "/teacher/"
            ) ||
            pathname === "/api/teacher" ||
            pathname.startsWith(
                "/api/teacher/"
            )
        )
    ) {
        const viewingTeacherId =
            request.cookies.get(
                HEAD_VIEW_AS_TEACHER_COOKIE
            )?.value;

        if (viewingTeacherId) {
            const headers =
                new Headers(
                    request.headers
                );

            headers.set(
                "x-scolara-view-as-teacher",
                viewingTeacherId
            );

            return NextResponse.next({
                request: {
                    headers,
                },
            });
        }
    }

    /*
     * ============================================================
     * HEAD HAS ACCESS TO EVERY PORTAL
     * ============================================================
     */

    if (role === "HEAD") {
        return NextResponse.next();
    }

    /*
     * ============================================================
     * API AUTHORIZATION
     * ============================================================
     */

    if (
        pathname.startsWith(
            "/api/head/"
        ) &&
        role !== "HEAD"
    ) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "Forbidden.",
            },
            {
                status: 403,
            }
        );
    }

    if (
        pathname.startsWith(
            "/api/teacher/"
        ) &&
        role !== "TEACHER"
    ) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "Forbidden.",
            },
            {
                status: 403,
            }
        );
    }

    if (
        pathname.startsWith(
            "/api/student/"
        ) &&
        role !== "STUDENT"
    ) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "Forbidden.",
            },
            {
                status: 403
            }
        );
    }

    /*
     * ============================================================
     * TEACHER CANNOT ACCESS HEAD
     * ============================================================
     */

    if (
        role === "TEACHER" &&
        pathname.startsWith(
            "/head"
        )
    ) {
        const url =
            request.nextUrl.clone();

        url.pathname = "/teacher";

        return NextResponse.redirect(
            url
        );
    }

    /*
     * ============================================================
     * TEACHER CANNOT ACCESS STUDENT
     * ============================================================
     */

    if (
        role === "TEACHER" &&
        pathname.startsWith(
            "/student"
        )
    ) {
        const url =
            request.nextUrl.clone();

        url.pathname = "/teacher";

        return NextResponse.redirect(
            url
        );
    }

    /*
     * ============================================================
     * STUDENT CANNOT ACCESS HEAD
     * ============================================================
     */

    if (
        role === "STUDENT" &&
        pathname.startsWith(
            "/head"
        )
    ) {
        const url =
            request.nextUrl.clone();

        url.pathname =
            `/student/${String(
                payload.userId
            )}`;

        return NextResponse.redirect(
            url
        );
    }

    /*
     * ============================================================
     * STUDENT CANNOT ACCESS TEACHER
     * ============================================================
     */

    if (
        role === "STUDENT" &&
        pathname.startsWith(
            "/teacher"
        )
    ) {
        const url =
            request.nextUrl.clone();

        url.pathname =
            `/student/${String(
                payload.userId
            )}`;

        return NextResponse.redirect(
            url
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};