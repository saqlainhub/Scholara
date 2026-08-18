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
            studentId: string;
        }>;
    }
) {
    try {
        const { studentId } = await params;

        const body = await request.json();

        const action =
            body?.action as Action;

        if (!studentId) {
            return NextResponse.json(
                {
                    message:
                        "Student ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

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
                        "Invalid student action.",
                },
                {
                    status: 400,
                }
            );
        }

        const student =
            await prisma.user.findUnique({
                where: {
                    id: studentId,
                },
                select: {
                    id: true,
                    role: true,
                    isActive: true,
                },
            });

        if (!student) {
            return NextResponse.json(
                {
                    message:
                        "Student not found.",
                },
                {
                    status: 404,
                }
            );
        }

        if (
            student.role !== "STUDENT"
        ) {
            return NextResponse.json(
                {
                    message:
                        "The selected user is not a student.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * DELETE
         */
        if (action === "DELETE") {
            await prisma.user.delete({
                where: {
                    id: studentId,
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    "Student deleted successfully.",
            });
        }

        /*
         * ACTIVATE
         */
        if (action === "ACTIVATE") {
            await prisma.user.update({
                where: {
                    id: studentId,
                },
                data: {
                    isActive: true,
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    "Student activated successfully.",
            });
        }

        /*
         * DEACTIVATE
         */
        if (
            action === "DEACTIVATE"
        ) {
            await prisma.user.update({
                where: {
                    id: studentId,
                },
                data: {
                    isActive: false,
                },
            });

            return NextResponse.json({
                success: true,
                message:
                    "Student deactivated successfully.",
            });
        }

        return NextResponse.json(
            {
                message:
                    "Unsupported student action.",
            },
            {
                status: 400,
            }
        );
    } catch (error) {
        console.error(
            "STUDENT ACTION API ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Student action failed.",
            },
            {
                status: 500,
            }
        );
    }
}