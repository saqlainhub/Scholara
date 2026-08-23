import {
    NextRequest,
    NextResponse,
} from "next/server";

import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// ==========================================================
// GET — PREVIEW STUDENT UPLOADED PDF
// ==========================================================

export async function GET(
    request: NextRequest
) {
    try {
        // ======================================================
        // AUTHENTICATION
        // ======================================================

        const session =
            await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        // ======================================================
        // AUTHORIZATION
        //
        // PDF previews can be viewed by:
        //
        // STUDENT
        // TEACHER
        // HEAD
        //
        // The previous version allowed STUDENT only,
        // which caused 403 errors when a teacher/head
        // opened the same PDF.
        // ======================================================

        const allowedRoles = [
            "STUDENT",
            "TEACHER",
            "HEAD",
        ] as const;

        if (
            !allowedRoles.includes(
                session.role as
                    (typeof allowedRoles)[number]
            )
        ) {
            return NextResponse.json(
                {
                    message:
                        "You are not authorized to preview this PDF.",
                },
                {
                    status: 403,
                }
            );
        }

        // ======================================================
        // GET CLOUDINARY URL
        // ======================================================

        const url =
            request.nextUrl.searchParams.get(
                "url"
            );

        if (!url) {
            return NextResponse.json(
                {
                    message:
                        "PDF URL is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // VALIDATE URL
        // ======================================================

        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch {
            return NextResponse.json(
                {
                    message:
                        "Invalid PDF URL.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // CLOUDINARY HOST SECURITY
        // ======================================================

        const hostname =
            parsedUrl.hostname.toLowerCase();

        const allowedHosts = [
            "res.cloudinary.com",
            "cloudinary.com",
        ];

        const isAllowedHost =
            allowedHosts.some(
                (host) =>
                    hostname === host ||
                    hostname.endsWith(
                        `.${host}`
                    )
            );

        if (!isAllowedHost) {
            return NextResponse.json(
                {
                    message:
                        "Invalid PDF source.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // ONLY ALLOW HTTPS
        // ======================================================

        if (
            parsedUrl.protocol !==
            "https:"
        ) {
            return NextResponse.json(
                {
                    message:
                        "Only HTTPS PDF sources are allowed.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // FETCH PDF FROM CLOUDINARY
        // ======================================================

        const response =
            await fetch(
                parsedUrl.toString(),
                {
                    cache: "no-store",
                }
            );

        if (!response.ok) {
            console.error(
                "CLOUDINARY PDF FETCH ERROR:",
                {
                    status:
                        response.status,
                    statusText:
                        response.statusText,
                    url:
                        parsedUrl.toString(),
                }
            );

            return NextResponse.json(
                {
                    message:
                        "Failed to fetch PDF.",
                },
                {
                    status:
                        response.status >=
                            400 &&
                        response.status <=
                            599
                            ? response.status
                            : 502,
                }
            );
        }

        // ======================================================
        // READ CONTENT
        // ======================================================

        const arrayBuffer =
            await response.arrayBuffer();

        // ======================================================
        // RETURN PDF
        // ======================================================

        return new NextResponse(
            arrayBuffer,
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "application/pdf",

                    "Content-Disposition":
                        'inline; filename="student-submission.pdf"',

                    "Content-Length":
                        String(
                            arrayBuffer.byteLength
                        ),

                    "Cache-Control":
                        "private, no-store, max-age=0",

                    "X-Content-Type-Options":
                        "nosniff",

                    "Content-Security-Policy":
                        "default-src 'none'; frame-ancestors 'self';",
                },
            }
        );
    } catch (error) {
        console.error(
            "PDF PREVIEW ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to preview PDF.",
            },
            {
                status: 500,
            }
        );
    }
}