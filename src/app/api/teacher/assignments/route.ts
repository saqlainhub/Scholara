import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function getPakistanDateString(
    date = new Date()
) {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Karachi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(date);
}

function formatGroupDate(
    date: Date
) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Karachi",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    ).format(date);
}

export async function GET(
    request: NextRequest
) {
    try {
        // AUTH

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

        // FILTER

        const filter =
            request.nextUrl.searchParams.get(
                "filter"
            ) || "all";

        const requestedLimit =
            Number(
                request.nextUrl.searchParams.get(
                    "limit"
                ) || "10"
            );

        const limit = Math.min(
            Math.max(
                requestedLimit,
                10
            ),
            100
        );

        if (
            ![
                "all",
                "checked",
                "unchecked",
            ].includes(filter)
        ) {
            return NextResponse.json(
                {
                    message:
                        "Invalid filter.",
                },
                {
                    status: 400,
                }
            );
        }

        // BASE TASK FILTER

        const baseWhere = {
            teacherId: session.id,

            submissions: {
                some: {},
            },
        };

        // STATS

        const [
            totalTasks,
            checked,
            unchecked,
            todayRemaining,
        ] =
            await Promise.all([
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

                prisma.task.count({
                    where: {
                        ...baseWhere,

                        isChecked: false,

                        dailyRecord: {
                            date: new Date(
                                `${getPakistanDateString()}T00:00:00+05:00`
                            ),
                        },
                    },
                }),
            ]);

        // FILTERED TASKS

        const filteredWhere = {
            ...baseWhere,

            ...(filter === "checked"
                ? {
                      isChecked: true,
                  }
                : filter ===
                    "unchecked"
                ? {
                      isChecked: false,
                  }
                : {}),
        };

        // LOAD TASKS

        const tasks =
            await prisma.task.findMany({
                where:
                    filteredWhere,

                orderBy: [
                    {
                        updatedAt:
                            "desc",
                    },
                ],

                take: limit,

                include: {
                    dailyRecord: {
                        select: {
                            date: true,
                        },
                    },

                    student: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            profileImg: true,
                        },
                    },

                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },

                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    submissions: {
                        orderBy: {
                            submittedAt:
                                "asc",
                        },

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
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });

        // GROUP BY SUBMISSION DAY

        const groupsMap =
            new Map<
                string,
                {
                    date: string;
                    label: string;
                    tasks: unknown[];
                }
            >();

        for (const task of tasks) {
            // LATEST SUBMISSION

            const latestSubmission =
                task.submissions.length >
                0
                    ? task
                          .submissions[
                          task
                              .submissions
                              .length -
                              1
                      ]
                    : null;

            // USE SUBMISSION DATE

            const displayDate =
                latestSubmission
                    ? latestSubmission.submittedAt
                    : task.dailyRecord.date;

            const dateKey =
                getPakistanDateString(
                    displayDate
                );

            let group =
                groupsMap.get(
                    dateKey
                );

            if (!group) {
                group = {
                    date: dateKey,

                    label:
                        formatGroupDate(
                            displayDate
                        ),

                    tasks: [],
                };

                groupsMap.set(
                    dateKey,
                    group
                );
            }

            // NEEDS RECHECK

            const needsRecheck =
                Boolean(
                    task.review &&
                        latestSubmission &&
                        latestSubmission.submittedAt >
                            task.review
                                .checkedAt
                );

            // BUTTON STATE

            const reviewStatus =
                needsRecheck
                    ? "recheck"
                    : task.isChecked
                    ? "view"
                    : "check";

            group.tasks.push({
                id: task.id,

                title:
                    task.title,

                description:
                    task.description,

                deadline:
                    task.deadline,

                difficulty:
                    task.difficulty,

                isChecked:
                    task.isChecked,

                needsRecheck,

                reviewStatus,

                isCompleted:
                    task.isCompleted,

                isDelayed:
                    task.isDelayed,

                completedAt:
                    task.completedAt,

                checkedAt:
                    task.checkedAt,

                score:
                    task.score,

                date:
                    displayDate.toISOString(),

                student:
                    task.student,

                teacher:
                    task.teacher,

                category:
                    task.category,

                submissions:
                    task.submissions,

                review:
                    task.review,

                latestSubmission:
                    latestSubmission,
            });
        }

        // SORT GROUPS

        const groups =
            Array.from(
                groupsMap.values()
            )
                .sort(
                    (a, b) =>
                        new Date(
                            b.date
                        ).getTime() -
                        new Date(
                            a.date
                        ).getTime()
                )
                .map((group) => {
                    group.tasks.sort(
                        (a: any, b: any) =>
                            new Date(
                                b.date
                            ).getTime() -
                            new Date(
                                a.date
                            ).getTime()
                    );

                    return group;
                });

        // RESPONSE

        return NextResponse.json({
            stats: {
                totalTasks,

                checked,

                unchecked,

                todayRemaining,
            },

            groups,

            hasMore:
                tasks.length >=
                limit,
        });
    } catch (error) {
        console.error(
            "TEACHER ASSIGNMENTS GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load teacher assignments.",
            },
            {
                status: 500,
            }
        );
    }
}