import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{
        studentId: string;
    }>;
};

export async function GET(
    _request: Request,
    { params }: Params
) {
    try {
        const { studentId } =
            await params;

        if (!studentId) {
            return NextResponse.json(
                {
                    message:
                        "Student ID is missing.",
                },
                {
                    status: 400,
                }
            );
        }

        const student =
            await prisma.user.findFirst({
                where: {
                    id: studentId,
                    role: "STUDENT",
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    taughtTasks: {
                        take: 1,
                        select: {
                            teacher: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                },
                            },
                        },
                    },
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

        const teacher =
            student.taughtTasks[0]
                ?.teacher || null;

        return NextResponse.json({
            student: {
                id: student.id,
                username:
                    student.username,
                name: student.name,
                profileImg:
                    student.profileImg,

                // IMPORTANT:
                // Return the actual database status.
                isActive:
                    student.isActive,

                createdAt:
                    student.createdAt,
                updatedAt:
                    student.updatedAt,
                teacher,
            },
        });
    } catch (error) {
        console.error(
            "GET STUDENT ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load student.",
            },
            {
                status: 500,
            }
        );
    }
}