import {
    NextResponse,
} from "next/server";

import {
    getSession,
} from "@/lib/auth/session";

import {
    getStudentDayStatus,
} from "@/lib/student-day";

import {
    prisma,
} from "@/lib/prisma";

import {
    calculateStudentStatuses,
} from "@/lib/utils/student-status";

import type {
    RecordStats,
} from "@/lib/student-records/types";

function isValidDateKey(
    value: string
) {
    return /^\d{4}-\d{2}-\d{2}$/.test(
        value
    );
}

function parseDateKey(
    value: string
) {
    const [year, month, day] =
        value
            .split("-")
            .map(Number);

    if (
        !year ||
        !month ||
        !day
    ) {
        return null;
    }

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    if (
        date.getUTCFullYear() !==
        year ||
        date.getUTCMonth() !==
        month - 1 ||
        date.getUTCDate() !==
        day
    ) {
        return null;
    }

    return date;
}

function getDayStats(
    record: {
        isWorking: boolean;
        tasks: Array<{
            isDelayed: boolean;
            isChecked: boolean;
            score: number | null;
            submissions: Array<{
                id: string;
            }>;
        }>;
    } | null
): RecordStats {
    if (!record) {
        return {
            totalTasks: 0,
            submitted: 0,
            unsubmitted: 0,
            delayed: 0,
            ontime: 0,
            checked: 0,
            unchecked: 0,

            totalDays: 1,
            workingDays: 0,
            offDays: 1,

            score: 0,
            status: "ACTIVE",
            position: null,
        };
    }

    const tasks =
        record.tasks;

    const totalTasks =
        tasks.length;

    const submitted =
        tasks.filter(
            (task) =>
                task.submissions
                    .length > 0
        ).length;

    const unsubmitted =
        totalTasks -
        submitted;

    const delayed =
        tasks.filter(
            (task) =>
                task.isDelayed
        ).length;

    const ontime =
        tasks.filter(
            (task) =>
                task.submissions
                    .length > 0 &&
                !task.isDelayed
        ).length;

    const checked =
        tasks.filter(
            (task) =>
                task.isChecked
        ).length;

    const unchecked =
        totalTasks -
        checked;

    const score =
        tasks.reduce(
            (
                total,
                task
            ) =>
                total +
                Number(
                    task.score ??
                    0
                ),
            0
        );

    return {
        totalTasks,
        submitted,
        unsubmitted,
        delayed,
        ontime,
        checked,
        unchecked,

        totalDays: 1,

        workingDays:
            record.isWorking
                ? 1
                : 0,

        offDays:
            record.isWorking
                ? 0
                : 1,

        score,

        status: "ACTIVE",

        position: null,
    };
}

async function getPosition(
    studentId: string,
    date: Date
) {
    const students =
        await prisma.user.findMany(
            {
                where: {
                    role: "STUDENT",
                    isActive: true,
                },

                select: {
                    id: true,
                },
            }
        );

    if (
        students.length === 0
    ) {
        return null;
    }

    const records =
        await prisma.dailyRecord.findMany(
            {
                where: {
                    studentId: {
                        in:
                            students.map(
                                (
                                    student
                                ) =>
                                    student.id
                            ),
                    },

                    date,
                },

                select: {
                    studentId: true,

                    tasks: {
                        select: {
                            score: true,
                        },
                    },
                },
            }
        );

    const scores =
        new Map<
            string,
            number
        >();

    for (
        const student of students
    ) {
        scores.set(
            student.id,
            0
        );
    }

    for (
        const record of records
    ) {
        const current =
            scores.get(
                record.studentId
            ) ?? 0;

        const score =
            record.tasks.reduce(
                (
                    total,
                    task
                ) =>
                    total +
                    Number(
                        task.score ??
                        0
                    ),
                0
            );

        scores.set(
            record.studentId,
            current + score
        );
    }

    const ranked =
        Array.from(
            scores.entries()
        )
            .map(
                ([
                    id,
                    totalScore,
                ]) => ({
                    id,
                    totalScore,
                })
            )
            .sort(
                (a, b) =>
                    b.totalScore -
                    a.totalScore
            );

    const index =
        ranked.findIndex(
            (student) =>
                student.id ===
                studentId
        );

    return index >= 0
        ? index + 1
        : null;
}

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

        if (!date) {
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

        const dayStatus =
            await getStudentDayStatus(
                session.id,
                dateParam
            );

        const record =
            await prisma.dailyRecord.findFirst(
                {
                    where: {
                        studentId:
                            session.id,

                        date,
                    },

                    include: {
                        tasks: {
                            include: {
                                submissions:
                                {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                }
            );

        const stats =
    dayStatus.isWorking
        ? getDayStats(
              record ?? null
          )
        : {
              totalTasks: 0,
              submitted: 0,
              unsubmitted: 0,
              delayed: 0,
              ontime: 0,
              checked: 0,
              unchecked: 0,

              totalDays: 1,
              workingDays: 0,
              offDays: 1,

              score: 0,
              status: "ACTIVE",
              position: null,
          };

        const position =
            await getPosition(
                session.id,
                date
            );

        /*
         * Calculate status for the student
         * based on this day's score.
         */
        const students =
            await prisma.user.findMany(
                {
                    where: {
                        role: "STUDENT",
                        isActive: true,
                    },

                    select: {
                        id: true,
                    },
                }
            );

        const allScores =
            await Promise.all(
                students.map(
                    async (
                        student
                    ) => {
                        const studentRecord =
                            await prisma.dailyRecord.findFirst(
                                {
                                    where: {
                                        studentId:
                                            student.id,

                                        date,
                                    },

                                    select: {
                                        tasks: {
                                            select: {
                                                score: true,
                                            },
                                        },
                                    },
                                }
                            );

                        const totalScore =
                            studentRecord?.tasks.reduce(
                                (
                                    total,
                                    task
                                ) =>
                                    total +
                                    Number(
                                        task.score ??
                                        0
                                    ),
                                0
                            ) ?? 0;

                        return {
                            id:
                                student.id,

                            totalScore,
                        };
                    }
                )
            );

        const statusResult =
            calculateStudentStatuses(
                allScores
            );

        const currentStudent =
            statusResult.students.find(
                (
                    student
                ) =>
                    student.id ===
                    session.id
            );

        const finalStats:
            RecordStats = {
            ...stats,

            totalDays: 1,

            position,

            status:
                currentStudent
                    ?.status ??
                "ACTIVE",
        };

        const dayName =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    weekday: "long",
                    timeZone: "UTC",
                }
            ).format(date);

        const shortDayName =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    weekday: "short",
                    timeZone: "UTC",
                }
            ).format(date);

        return NextResponse.json({
            date: dateParam,

            dayName,

            shortDayName,

            dayType:
                dayStatus.isWorking
                    ? "WORKING"
                    : "OFF",

            stats:
                finalStats,
        });
    } catch (error) {
        console.error(
            "DAY RECORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load day record.",
            },
            {
                status: 500,
            }
        );
    }
}