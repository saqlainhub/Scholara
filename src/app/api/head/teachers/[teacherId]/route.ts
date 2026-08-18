import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
    calculateTeacherActivity,
} from "@/lib/utils/teacher-performance";

type Params = {
    params: Promise<{
        teacherId: string;
    }>;
};

export async function GET(
    _request: Request,
    { params }: Params
) {
    try {
        const { teacherId } =
            await params;

        if (!teacherId) {
            return NextResponse.json(
                {
                    message:
                        "Teacher ID is missing.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * ========================================================
         * TEACHER
         * ========================================================
         */

        const teacher =
            await prisma.user.findFirst({
                where: {
                    id: teacherId,
                    role: "TEACHER",
                },

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

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

        /*
         * ========================================================
         * REAL TASK STATISTICS
         * ========================================================
         *
         * Keep this exactly consistent with:
         *
         * /api/teacher/assignments
         *
         * Only tasks having at least one submission are counted.
         */

        const baseWhere = {
            teacherId: teacher.id,

            submissions: {
                some: {},
            },
        };

        const [
            totalTasks,
            checkedTasks,
            uncheckedTasks,
        ] = await Promise.all([
            prisma.task.count({
                where: baseWhere,
            }),

            prisma.task.count({
                where: {
                    ...baseWhere,

                    isChecked: true,
                },
            }),

            prisma.task.count({
                where: {
                    ...baseWhere,

                    isChecked: false,
                },
            }),
        ]);

        /*
         * ========================================================
         * TEACHER PERFORMANCE
         * ========================================================
         */

        const performance =
            await calculateTeacherActivity(
                prisma,
                teacher.id
            );

        /*
         * ========================================================
         * RESPONSE
         * ========================================================
         */

        return NextResponse.json({
            teacher: {
                ...teacher,

                totalTasks,

                checkedTasks,

                uncheckedTasks,

                performance,
            },
        });
    } catch (error) {
        console.error(
            "GET TEACHER ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load teacher.",
            },
            {
                status: 500,
            }
        );
    }
}