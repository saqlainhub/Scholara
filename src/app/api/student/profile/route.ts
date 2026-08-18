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
// GET CURRENT STUDENT PROFILE
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

        const student =
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

        if (!student) {
            return NextResponse.json(
                {
                    message:
                        "Student profile not found.",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            student,
        });
    } catch (error) {
        console.error(
            "GET STUDENT PROFILE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load student profile.",
            },
            {
                status: 500,
            }
        );
    }
}