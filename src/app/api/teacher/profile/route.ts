
import {
    NextResponse,
} from "next/server";

import {
    prisma,
} from "@/lib/prisma";

import {
    getSession,
} from "@/lib/auth";

export const runtime = "nodejs";

// ==========================================================
// GET CURRENT TEACHER PROFILE
// ==========================================================

export async function GET() {
    try {
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
            "TEACHER"
        ) {
            return NextResponse.json(
                {
                    message:
                        "Teacher access required.",
                },
                {
                    status: 403,
                }
            );
        }

        const teacher =
            await prisma.user.findUnique({
                where: {
                    id: session.id,
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                },
            });

        if (!teacher) {
            return NextResponse.json(
                {
                    message:
                        "Teacher profile not found.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            teacher,
        });
    } catch (error) {
        console.error(
            "GET TEACHER PROFILE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load teacher profile.",
            },
            {
                status: 500,
            }
        );
    }
}

