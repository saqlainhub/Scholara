import {
    NextResponse,
} from "next/server";

import {
    getSession,
} from "@/lib/auth/session";

import {
    prisma,
} from "@/lib/prisma";

import {
    calculateStudentStatuses,
} from "@/lib/utils/student-status";

import type {
    RecordStats,
    DayRecord,
} from "@/lib/student-records/types";

function getPreviousMonthRange() {
    const now = new Date();

    const year =
        now.getUTCFullYear();

    const month =
        now.getUTCMonth();

    // First day of previous month
    const start =
        new Date(
            Date.UTC(
                year,
                month - 1,
                1
            )
        );

    // First day of current month
    const endExclusive =
        new Date(
            Date.UTC(
                year,
                month,
                1
            )
        );

    // Last day of previous month
    const end =
        new Date(
            endExclusive.getTime() -
            24 *
            60 *
            60 *
            1000
        );

    return {
        start,
        end,
        endExclusive,
    };
}

function toDateKey(
    date: Date
) {
    return date
        .toISOString()
        .slice(0, 10);
}

function getDaysInMonth(
    year: number,
    month: number
) {
    return new Date(
        Date.UTC(
            year,
            month + 1,
            0
        )
    ).getUTCDate();
}

function getMondayBasedDayIndex(
    date: Date
) {
    const sundayBased =
        date.getUTCDay();

    return sundayBased === 0
        ? 6
        : sundayBased - 1;
}

function getDayStats(
    record: {
        isWorking: boolean;
        tasks: Array<{
            id: string;
            isCompleted: boolean;
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

async function getLeaderboardPosition(
    studentId: string,
    start: Date,
    endExclusive: Date
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
                        in: students.map(
                            (
                                student
                            ) =>
                                student.id
                        ),
                    },
                    date: {
                        gte: start,
                        lt: endExclusive,
                    },
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

    for (const student of students) {
        scores.set(
            student.id,
            0
        );
    }

    for (const record of records) {
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

    const position =
        ranked.findIndex(
            (student) =>
                student.id ===
                studentId
        );

    return position >= 0
        ? position + 1
        : null;
}

export async function GET() {
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
            start,
            end,
            endExclusive,
        } =
            getPreviousMonthRange();

        const year =
            start.getUTCFullYear();

        const month =
            start.getUTCMonth();

        const daysInMonth =
            getDaysInMonth(
                year,
                month
            );

        const records =
            await prisma.dailyRecord.findMany(
                {
                    where: {
                        studentId:
                            session.id,
                        date: {
                            gte: start,
                            lt: endExclusive,
                        },
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
                    orderBy: {
                        date: "asc",
                    },
                }
            );

        const recordMap =
            new Map(
                records.map(
                    (
                        record
                    ) => [
                            toDateKey(
                                record.date
                            ),
                            record,
                        ]
                )
            );

        const days: DayRecord[] =
            [];

        for (
            let day = 1;
            day <=
            daysInMonth;
            day++
        ) {
            const date =
                new Date(
                    Date.UTC(
                        year,
                        month,
                        day
                    )
                );

            const dateKey =
                toDateKey(
                    date
                );

            const record =
                recordMap.get(
                    dateKey
                );

            const stats =
                getDayStats(
                    record ?? null
                );

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

            days.push({
                date: dateKey,

                dayName,

                shortDayName,

                dayType:
                    record &&
                        record.isWorking
                        ? "WORKING"
                        : record &&
                            !record.isWorking
                            ? "OFF"
                            : "OFF",

                stats,
            });
        }

        const workingDays =
            days.filter(
                (day) =>
                    day.dayType ===
                    "WORKING"
            ).length;

        const offDays =
            daysInMonth -
            workingDays;

        const totalTasks =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .totalTasks,
                0
            );

        const submitted =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .submitted,
                0
            );

        const unsubmitted =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .unsubmitted,
                0
            );

        const delayed =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .delayed,
                0
            );

        const ontime =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .ontime,
                0
            );

        const checked =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .checked,
                0
            );

        const unchecked =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .unchecked,
                0
            );

        const score =
            days.reduce(
                (
                    total,
                    day
                ) =>
                    total +
                    day.stats
                        .score,
                0
            );

        const position =
            await getLeaderboardPosition(
                session.id,
                start,
                endExclusive
            );

        const studentScores =
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
                studentScores.map(
                    async (
                        student
                    ) => {
                        const studentRecords =
                            await prisma.dailyRecord.findMany(
                                {
                                    where: {
                                        studentId:
                                            student.id,
                                        date: {
                                            gte: start,
                                            lt: endExclusive,
                                        },
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
                            studentRecords.reduce(
                                (
                                    total,
                                    record
                                ) =>
                                    total +
                                    record.tasks.reduce(
                                        (
                                            taskTotal,
                                            task
                                        ) =>
                                            taskTotal +
                                            Number(
                                                task.score ??
                                                0
                                            ),
                                        0
                                    ),
                                0
                            );

                        return {
                            id: student.id,
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

        const stats: RecordStats =
        {
            totalTasks,
            submitted,
            unsubmitted,
            delayed,
            ontime,
            checked,
            unchecked,
            totalDays:
                daysInMonth,
            workingDays,
            offDays,
            score,
            status:
                currentStudent
                    ?.status ??
                "ACTIVE",
            position,
        };

        return NextResponse.json({
            year,
            month:
                month + 1,
            monthName:
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        month: "long",
                        timeZone:
                            "UTC",
                    }
                ).format(
                    start
                ),
            daysInMonth,
            startDate:
                toDateKey(
                    start
                ),
            endDate:
                toDateKey(
                    end
                ),
            firstDayIndex:
                getMondayBasedDayIndex(
                    start
                ),
            stats,
            days,
        });
    } catch (error) {
        console.error(
            "MONTHLY RECORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load monthly record.",
            },
            {
                status: 500,
            }
        );
    }
}