import {
    NextRequest,
    NextResponse,
} from "next/server";

import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
    request: NextRequest
) {
    try {
        // =====================================================
        // AUTH
        // =====================================================

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

        if (
            session.role !==
            "STUDENT"
        ) {
            return NextResponse.json(
                {
                    message:
                        "Student access required.",
                },
                {
                    status: 403,
                }
            );
        }

        // =====================================================
        // GET CLOUDINARY URL
        // =====================================================

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

        // =====================================================
        // SECURITY
        // Only allow Cloudinary URLs
        // =====================================================

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

        const allowedHosts = [
            "res.cloudinary.com",
            "cloudinary.com",
        ];

        if (
            !allowedHosts.some(
                (host) =>
                    parsedUrl.hostname ===
                        host ||
                    parsedUrl.hostname.endsWith(
                        `.${host}`
                    )
            )
        ) {
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

        // =====================================================
        // FETCH PDF FROM CLOUDINARY
        // =====================================================

        const response =
            await fetch(url, {
                cache: "no-store",
            });

        if (!response.ok) {
            return NextResponse.json(
                {
                    message:
                        "Failed to fetch PDF.",
                },
                {
                    status: response.status,
                }
            );
        }

        const contentType =
            response.headers.get(
                "content-type"
            ) || "application/pdf";

        const arrayBuffer =
            await response.arrayBuffer();

        // =====================================================
        // RETURN PDF WITH INLINE DISPOSITION
        // =====================================================

        return new NextResponse(
            arrayBuffer,
            {
                status: 200,

                headers: {
                    "Content-Type":
                        contentType.includes(
                            "pdf"
                        )
                            ? "application/pdf"
                            : "application/pdf",

                    "Content-Disposition":
                        "inline",

                    "Cache-Control":
                        "private, no-store, max-age=0",

                    "X-Content-Type-Options":
                        "nosniff",
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