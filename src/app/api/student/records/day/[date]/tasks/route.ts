import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

function isValidDateKey(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function parseDateKey(value: string) {
    const [year, month, day] =
        value.split("-").map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}

export const runtime = "nodejs";

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            date: string;
        }>;
    }
) {
    try {
        const session =
            await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    message:
                        "Unauthorized",
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
                        "Forbidden",
                },
                {
                    status: 403,
                }
            );
        }

        const {
            date: dateParam,
        } = await params;

        if (
            !isValidDateKey(
                dateParam
            )
        ) {
            return NextResponse.json(
                {
                    message:
                        "Invalid date.",
                },
                {
                    status: 400,
                }
            );
        }

        const date =
            parseDateKey(
                dateParam
            );

        /*
         * IMPORTANT:
         *
         * Records must use the exact DailyRecord
         * for the requested date.
         *
         * We deliberately DO NOT use:
         *
         * studentWeeklyTemplateAssignment
         *
         * because that represents the student's
         * weekly/current assignment, not the
         * historical task snapshot.
         */
        const dailyRecord =
            await prisma.dailyRecord.findUnique(
                {
                    where: {
                        studentId_date: {
                            studentId:
                                session.id,

                            date,
                        },
                    },

                    include: {
                        tasks: {
                            orderBy: {
                                createdAt:
                                    "asc",
                            },

                            include: {
                                teacher: {
                                    select: {
                                        id: true,
                                        name: true,
                                        username:
                                            true,
                                    },
                                },

                                category: true,

                                submissions: {
                                    orderBy: [
                                        {
                                            submittedAt:
                                                "desc",
                                        },
                                        {
                                            id:
                                                "desc",
                                        },
                                    ],

                                    take: 1,

                                    include: {
                                        media: true,
                                    },
                                },

                                review: {
                                    include: {
                                        teacher: {
                                            select: {
                                                id: true,
                                                name: true,
                                                username:
                                                    true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                }
            );

        /*
         * No DailyRecord means there were no
         * historical tasks recorded for this date.
         */
        if (!dailyRecord) {
            return NextResponse.json({
                date: dateParam,
                isWorking: false,
                categories: [],
            });
        }

        /*
         * Group the exact historical Task records
         * by their TaskCategory.
         */
        const categoryMap =
            new Map<
                string,
                {
                    id: string;
                    name: string;
                    sortOrder: number;
                    tasks: typeof dailyRecord.tasks;
                }
            >();

        for (
            const task of
            dailyRecord.tasks
        ) {
            const category =
                task.category;

            if (!categoryMap.has(category.id)) {
                categoryMap.set(
                    category.id,
                    {
                        id: category.id,
                        name: category.name,
                        sortOrder:
                            categoryMap.size,
                        tasks: [],
                    }
                );
            }

            categoryMap
                .get(category.id)!
                .tasks.push(task);
        }

        const categories =
            Array.from(
                categoryMap.values()
            );

        return NextResponse.json({
            date: dateParam,

            isWorking:
                dailyRecord.isWorking,

            categories,
        });
    } catch (error) {
        console.error(
            "HISTORICAL DAY TASKS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load historical tasks.",
            },
            {
                status: 500,
            }
        );
    }
}