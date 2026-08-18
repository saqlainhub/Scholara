import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        taskId: string;
    }>;
};

export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
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

        const { taskId } =
            await params;

        if (!taskId) {
            return NextResponse.json(
                {
                    message:
                        "Task ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const body =
            await request.json();

        const rawScore =
            Number(body?.score);

        const note =
            typeof body?.note ===
            "string"
                ? body.note.trim()
                : null;

        if (
            Number.isNaN(rawScore) ||
            rawScore < 0 ||
            rawScore > 5 ||
            ![
                0,
                0.5,
                1,
                1.5,
                2,
                2.5,
                3,
                3.5,
                4,
                4.5,
                5,
            ].includes(rawScore)
        ) {
            return NextResponse.json(
                {
                    message:
                        "Invalid review score.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * --------------------------------------------------------
         * LOAD TASK
         * --------------------------------------------------------
         */

        const task =
            await prisma.task.findFirst({
                where: {
                    id: taskId,
                    teacherId:
                        session.id,
                },

                include: {
                    submissions: {
                        orderBy: {
                            submittedAt:
                                "desc",
                        },

                        take: 1,
                    },
                },
            });

        if (!task) {
            return NextResponse.json(
                {
                    message:
                        "Task not found or you are not its assigned teacher.",
                },
                {
                    status: 404,
                }
            );
        }

        if (
            task.submissions.length ===
            0
        ) {
            return NextResponse.json(
                {
                    message:
                        "This task has not been submitted by the student yet.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * --------------------------------------------------------
         * CALCULATE INTEGER SCORE
         * --------------------------------------------------------
         *
         * Example:
         *
         * difficulty = 2
         * review = 4.5
         *
         * 2 x 4.5 = 9
         *
         * If the result is fractional, round to the nearest integer.
         */

        const calculatedScore =
            Math.round(
                task.difficulty *
                    rawScore
            );

        /*
         * --------------------------------------------------------
         * TRANSACTION
         * --------------------------------------------------------
         *
         * Review and task status are changed atomically.
         */

        const checkedAt =
            new Date();

        const result =
            await prisma.$transaction(
                async (tx) => {
                    const review =
                        await tx.taskReview.upsert(
                            {
                                where: {
                                    taskId,
                                },

                                create: {
                                    taskId,
                                    teacherId:
                                        session.id,
                                    score:
                                        rawScore,
                                    note,
                                    checkedAt,
                                },

                                update: {
                                    teacherId:
                                        session.id,
                                    score:
                                        rawScore,
                                    note,
                                    checkedAt,
                                },
                            }
                        );

                    const updatedTask =
                        await tx.task.update({
                            where: {
                                id: taskId,
                            },

                            data: {
                                isChecked:
                                    true,

                                checkedAt,

                                score:
                                    calculatedScore,

                                isCorrect:
                                    rawScore >
                                    0,
                            },

                            include: {
                                review: {
                                    include: {
                                        teacher:
                                            {
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

                    /*
                     * Recalculate the teacher's checked-task
                     * counter from actual tasks rather than
                     * blindly incrementing it.
                     *
                     * This makes rechecking safe.
                     */

                    const checkedCount =
                        await tx.task.count(
                            {
                                where: {
                                    studentId:
                                        task.studentId,
                                    isChecked:
                                        true,
                                },
                            }
                        );

                    const totalCount =
                        await tx.task.count(
                            {
                                where: {
                                    studentId:
                                        task.studentId,
                                },
                            }
                        );

                    await tx.user.update(
                        {
                            where: {
                                id: task.studentId,
                            },

                            data: {
                                checkedTasks:
                                    checkedCount,

                                totalTasks:
                                    totalCount,
                            },
                        }
                    );

                    return {
                        review,
                        task:
                            updatedTask,
                    };
                }
            );

        return NextResponse.json({
            success: true,

            message:
                task.isChecked
                    ? "Task rechecked successfully."
                    : "Task checked successfully.",

            score:
                calculatedScore,

            review:
                result.review,

            task:
                result.task,
        });
    } catch (error) {
        console.error(
            "TEACHER TASK REVIEW ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to save task review.",
            },
            {
                status: 500,
            }
        );
    }
}