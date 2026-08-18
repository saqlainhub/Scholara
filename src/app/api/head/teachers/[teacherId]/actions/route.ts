import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Action =
    | "ACTIVATE"
    | "DEACTIVATE"
    | "DELETE";

export async function PUT(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            teacherId: string;
        }>;
    }
) {
    try {
        const { teacherId } = await params;

        const body = await request.json();

        const action =
            body?.action as Action;

        // ======================================================
        // VALIDATE TEACHER ID
        // ======================================================

        if (!teacherId) {
            return NextResponse.json(
                {
                    message:
                        "Teacher ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // VALIDATE ACTION
        // ======================================================

        if (
            ![
                "ACTIVATE",
                "DEACTIVATE",
                "DELETE",
            ].includes(action)
        ) {
            return NextResponse.json(
                {
                    message:
                        "Invalid teacher action.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // FIND TEACHER
        // ======================================================

        const teacher =
            await prisma.user.findUnique({
                where: {
                    id: teacherId,
                },

                select: {
                    id: true,
                    role: true,
                    isActive: true,
                },
            });

        // ======================================================
        // NOT FOUND
        // ======================================================

        if (!teacher) {
            return NextResponse.json(
                {
                    message:
                        "Teacher not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ======================================================
        // ROLE CHECK
        // ======================================================

        if (teacher.role !== "TEACHER") {
            return NextResponse.json(
                {
                    message:
                        "The selected user is not a teacher.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // DELETE
        // ======================================================

        if (action === "DELETE") {
            await prisma.user.delete({
                where: {
                    id: teacherId,
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    "Teacher deleted successfully.",
            });
        }

        // ======================================================
        // ACTIVATE
        // ======================================================

        if (action === "ACTIVATE") {
            await prisma.user.update({
                where: {
                    id: teacherId,
                },

                data: {
                    isActive: true,
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    "Teacher activated successfully.",
            });
        }

        // ======================================================
        // DEACTIVATE
        // ======================================================

        if (action === "DEACTIVATE") {
            await prisma.user.update({
                where: {
                    id: teacherId,
                },

                data: {
                    isActive: false,
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    "Teacher deactivated successfully.",
            });
        }

        // ======================================================
        // FALLBACK
        // ======================================================

        return NextResponse.json(
            {
                message:
                    "Unsupported teacher action.",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "TEACHER ACTION API ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Teacher action failed.",
            },
            {
                status: 500,
            }
        );
    }
}