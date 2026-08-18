import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import {
    getPakistanDate,
    getPakistanDay,
} from "@/lib/student-day";

export const runtime = "nodejs";

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

function isValidDateString(
    value: string
) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const date =
        new Date(
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

function createPakistanDate(
    dateString: string
) {
    const [year, month, day] =
        dateString.split("-").map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}

function getDayOfWeekFromDate(
    dateString: string
): DayOfWeek {
    const date =
        createPakistanDate(
            dateString
        );

    const days: DayOfWeek[] = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
    ];

    return days[date.getUTCDay()];
}

function createDeadline(
    date: string,
    time: string | null
) {
    if (!time) {
        return null;
    }

    const parts = time.split(":");

    if (parts.length !== 2) {
        return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return new Date(
        `${date}T${String(hours).padStart(
            2,
            "0"
        )}:${String(minutes).padStart(
            2,
            "0"
        )}:00+05:00`
    );
}

async function loadTasks(
    studentId: string,
    dateString: string
) {
    if (!isValidDateString(dateString)) {
        throw new Error(
            "Invalid date."
        );
    }

    /*
     * ============================================================
     * DETERMINE THE WEEKDAY
     * ============================================================
     *
     * The date string represents a Pakistan date.
     * Therefore we can safely calculate the weekday from
     * the UTC representation created above.
     */
    const dayOfWeek =
        getDayOfWeekFromDate(
            dateString
        );

    /*
     * ============================================================
     * LOAD WEEKLY ASSIGNMENT
     * ============================================================
     *
     * IMPORTANT:
     *
     * The weekly assignment itself determines whether this
     * is a WORKING day.
     *
     * assignment exists
     *     -> WORKING DAY
     *
     * assignment does not exist
     *     -> OFF DAY
     *
     * We DO NOT use taskTemplate existence to determine this.
     *
     * Therefore:
     *
     * assignment exists + taskTemplate null
     *     -> WORKING DAY WITH NO TASKS
     *
     * assignment exists + taskTemplate exists
     *     -> WORKING DAY WITH TASKS
     */
    const assignment =
        await prisma.studentWeeklyTemplateAssignment.findFirst(
            {
                where: {
                    studentId,
                    dayOfWeek,
                },

                include: {
                    taskTemplate: {
                        select: {
                            id: true,
                            name: true,
                            categories: {
                                orderBy: {
                                    sortOrder:
                                        "asc",
                                },

                                include: {
                                    tasks: {
                                        orderBy: {
                                            sortOrder:
                                                "asc",
                                        },

                                        select: {
                                            id: true,
                                            title: true,
                                            description:
                                                true,
                                            deadline:
                                                true,
                                            difficulty:
                                                true,
                                            teacherId:
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
     * ============================================================
     * OFF DAY
     * ============================================================
     *
     * No weekly assignment means this weekday is explicitly
     * not assigned to the student.
     *
     * This is NOT the same as "no tasks assigned".
     */
    if (!assignment) {
        return {
            template: null,
            categories: [],
            isWorking: false,
            dayType: "OFF" as const,
            dayOfWeek,
        };
    }

    /*
     * ============================================================
     * WORKING DAY BUT NO TASK TEMPLATE
     * ============================================================
     *
     * The student has a weekly assignment for this day,
     * therefore it is a working day.
     *
     * However, the head has not assigned a task template.
     */
    if (!assignment.taskTemplate) {
        return {
            template: null,
            categories: [],
            isWorking: true,
            dayType: "WORKING" as const,
            dayOfWeek,
        };
    }

    /*
     * ============================================================
     * WORKING DAY WITH TASKS
     * ============================================================
     */

    const date =
        createPakistanDate(
            dateString
        );

    let dailyRecord =
        await prisma.dailyRecord.findUnique(
            {
                where: {
                    studentId_date: {
                        studentId,
                        date,
                    },
                },
            }
        );

    if (!dailyRecord) {
        dailyRecord =
            await prisma.dailyRecord.create({
                data: {
                    studentId,
                    date,
                    isWorking: true,
                },
            });
    } else if (!dailyRecord.isWorking) {
        dailyRecord =
            await prisma.dailyRecord.update({
                where: {
                    id: dailyRecord.id,
                },
                data: {
                    isWorking: true,
                },
            });
    }

    const categories = [];

    for (
        const templateCategory of
        assignment.taskTemplate.categories
    ) {
        let category =
            await prisma.taskCategory.findFirst(
                {
                    where: {
                        name:
                            templateCategory.name,
                    },
                }
            );

        if (!category) {
            category =
                await prisma.taskCategory.create(
                    {
                        data: {
                            name:
                                templateCategory.name,
                        },
                    }
                );
        }

        const tasks = [];

        for (
            const templateTask of
            templateCategory.tasks
        ) {
            /*
             * IMPORTANT:
             *
             * Search only inside this exact DailyRecord.
             *
             * Therefore:
             *
             * Monday Task A
             *
             * and
             *
             * Tuesday Task A
             *
             * are two different Task records.
             */
            let task =
                await prisma.task.findFirst({
                    where: {
                        dailyRecordId:
                            dailyRecord.id,

                        studentId,

                        categoryId:
                            category.id,

                        title:
                            templateTask.title,
                    },

                    orderBy: [
                        {
                            createdAt:
                                "desc",
                        },
                        {
                            id:
                                "desc",
                        },
                    ],

                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
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
                                        username: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (!task) {
                task =
                    await prisma.task.create({
                        data: {
                            dailyRecordId:
                                dailyRecord.id,

                            studentId,

                            teacherId:
                                templateTask.teacherId,

                            categoryId:
                                category.id,

                            title:
                                templateTask.title,

                            description:
                                templateTask.description,

                            deadline:
                                createDeadline(
                                    dateString,
                                    templateTask.deadline
                                ),

                            difficulty:
                                templateTask.difficulty,
                        },

                        include: {
                            teacher: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
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
                                            username: true,
                                        },
                                    },
                                },
                            },
                        },
                    });
            }

            tasks.push(task);
        }

        categories.push({
            id: category.id,
            name: category.name,
            sortOrder:
                templateCategory.sortOrder,
            tasks,
        });
    }

    return {
        template: {
            id:
                assignment.taskTemplate.id,

            name:
                assignment.taskTemplate.name,
        },

        categories,

        isWorking: true,

        dayType: "WORKING" as const,

        dayOfWeek,
    };
}

export async function GET(
    request: NextRequest
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
            session.role !== "STUDENT"
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

        const requestedDate =
            request.nextUrl.searchParams.get(
                "date"
            );

        const dateString =
            requestedDate &&
                isValidDateString(
                    requestedDate
                )
                ? requestedDate
                : getPakistanDate();

        const data =
            await loadTasks(
                session.id,
                dateString
            );

        return NextResponse.json({
            currentDay:
                getPakistanDay(),

            selectedDay:
                data.dayOfWeek,

            selectedDate:
                dateString,

            ...data,
        });
    } catch (error) {
        console.error(
            "STUDENT TASK GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load tasks.",
            },
            {
                status: 500,
            }
        );
    }
}