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
    DayRecord,
    MonthlyOverview,
    OverviewRecord,
    RecordStats,
} from "@/lib/student-records/types";

function startOfDay(
    date: Date
) {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        )
    );
}

function endOfDay(
    date: Date
) {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate() + 1
        )
    );
}

function toDateKey(
    date: Date
) {
    return date
        .toISOString()
        .slice(0, 10);
}

function getDayNames(
    date: Date
) {
    return {
        dayName:
            new Intl.DateTimeFormat(
                "en-US",
                {
                    weekday: "long",
                    timeZone: "UTC",
                }
            ).format(date),

        shortDayName:
            new Intl.DateTimeFormat(
                "en-US",
                {
                    weekday: "short",
                    timeZone: "UTC",
                }
            ).format(date),
    };
}

function getMonthName(
    date: Date
) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            timeZone: "UTC",
        }
    ).format(date);
}

function getMondayBasedDayIndex(
    date: Date
) {
    const day =
        date.getUTCDay();

    return day === 0
        ? 6
        : day - 1;
}

function emptyStats(
    totalDays: number
): RecordStats {
    return {
        totalTasks: 0,
        submitted: 0,
        unsubmitted: 0,
        delayed: 0,
        ontime: 0,
        checked: 0,
        unchecked: 0,

        totalDays,
        workingDays: 0,
        offDays: totalDays,

        score: 0,
        status: "ACTIVE",
        position: null,
    };
}

function getDayStats(
    record:
        | {
              isWorking: boolean;
              tasks: Array<{
                  isDelayed: boolean;
                  isChecked: boolean;
                  score: number | null;
                  submissions: Array<{
                      id: string;
                  }>;
              }>;
          }
        | null
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
                task.submissions.length >
                0
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
                task.submissions.length >
                    0 &&
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
                    task.score ?? 0
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

function addStats(
    target: RecordStats,
    source: RecordStats
) {
    target.totalTasks +=
        source.totalTasks;

    target.submitted +=
        source.submitted;

    target.unsubmitted +=
        source.unsubmitted;

    target.delayed +=
        source.delayed;

    target.ontime +=
        source.ontime;

    target.checked +=
        source.checked;

    target.unchecked +=
        source.unchecked;

    target.totalDays +=
        source.totalDays;

    target.workingDays +=
        source.workingDays;

    target.offDays +=
        source.offDays;

    target.score +=
        source.score;
}

function createStats(
    days: DayRecord[]
): RecordStats {
    const stats: RecordStats =
        {
            totalTasks: 0,
            submitted: 0,
            unsubmitted: 0,
            delayed: 0,
            ontime: 0,
            checked: 0,
            unchecked: 0,

            totalDays: days.length,
            workingDays: 0,
            offDays: 0,

            score: 0,
            status: "ACTIVE",
            position: null,
        };

    for (const day of days) {
        addStats(
            stats,
            day.stats
        );
    }

    /*
     * A day already contains totalDays = 1.
     * Override it here to make the value
     * represent the complete period.
     */
    stats.totalDays =
        days.length;

    return stats;
}

async function getLeaderboard(
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

    const studentIds =
        students.map(
            (student) =>
                student.id
        );

    if (
        studentIds.length === 0
    ) {
        return {
            position: null,
            status: "ACTIVE" as const,
        };
    }

    const records =
        await prisma.dailyRecord.findMany(
            {
                where: {
                    studentId: {
                        in: studentIds,
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

    for (const id of studentIds) {
        scores.set(
            id,
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
                        task.score ?? 0
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

    const studentList =
        calculateStudentStatuses(
            ranked
        ).students;

    const current =
        studentList.find(
            (student) =>
                student.id ===
                studentId
        );

    const position =
        ranked.findIndex(
            (student) =>
                student.id ===
                studentId
        );

    return {
        position:
            position >= 0
                ? position + 1
                : null,

        status:
            current?.status ??
            "ACTIVE",
    };
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

        /*
         * Today.
         */
        const today =
            startOfDay(
                new Date()
            );

        /*
         * Yesterday.
         *
         * Overview intentionally stops
         * at yesterday.
         */
        const yesterday =
            new Date(
                today.getTime() -
                    24 *
                        60 *
                        60 *
                        1000
            );

        /*
         * Get student creation date.
         */
        const student =
            await prisma.user.findUnique(
                {
                    where: {
                        id: session.id,
                    },

                    select: {
                        createdAt: true,
                    },
                }
            );

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

        const createdDate =
            startOfDay(
                student.createdAt
            );

        /*
         * If the profile was created today,
         * there are no completed days yet.
         */
        if (
            createdDate >
            yesterday
        ) {
            const empty: OverviewRecord =
                {
                    createdAt:
                        toDateKey(
                            createdDate
                        ),
                    endDate:
                        toDateKey(
                            yesterday
                        ),
                    stats:
                        emptyStats(0),
                    months: [],
                };

            return NextResponse.json(
                empty
            );
        }

        /*
         * Fetch all records from profile
         * creation until yesterday.
         */
        const records =
            await prisma.dailyRecord.findMany(
                {
                    where: {
                        studentId:
                            session.id,

                        date: {
                            gte:
                                createdDate,
                            lt: today,
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

        /*
         * Build monthly ranges.
         */
        const months: MonthlyOverview[] =
            [];

        let cursor =
            new Date(
                Date.UTC(
                    createdDate.getUTCFullYear(),
                    createdDate.getUTCMonth(),
                    1
                )
            );

        const currentMonth =
            today.getUTCMonth();

        const currentYear =
            today.getUTCFullYear();

        while (
            cursor <
            today
        ) {
            const year =
                cursor.getUTCFullYear();

            const month =
                cursor.getUTCMonth();

            const monthStart =
                new Date(
                    Date.UTC(
                        year,
                        month,
                        1
                    )
                );

            const nextMonthStart =
                new Date(
                    Date.UTC(
                        year,
                        month + 1,
                        1
                    )
                );

            /*
             * Normally this is the last
             * day of the month.
             *
             * For current month it is
             * yesterday.
             */
            let monthEnd =
                new Date(
                    nextMonthStart.getTime() -
                        24 *
                            60 *
                            60 *
                            1000
                );

            if (
                year ===
                    currentYear &&
                month ===
                    currentMonth
            ) {
                monthEnd =
                    yesterday;
            }

            /*
             * Don't show dates before
             * profile creation.
             */
            const visibleStart =
                monthStart <
                createdDate
                    ? createdDate
                    : monthStart;

            /*
             * Don't show today's date
             * or future dates.
             */
            const visibleEnd =
                monthEnd >
                yesterday
                    ? yesterday
                    : monthEnd;

            const monthDays: DayRecord[] =
                [];

            if (
                visibleStart <=
                visibleEnd
            ) {
                let date =
                    new Date(
                        visibleStart
                    );

                while (
                    date <=
                    visibleEnd
                ) {
                    const dateKey =
                        toDateKey(
                            date
                        );

                    const record =
                        recordMap.get(
                            dateKey
                        );

                    const names =
                        getDayNames(
                            date
                        );

                    const stats =
                        getDayStats(
                            record ??
                                null
                        );

                    monthDays.push({
                        date: dateKey,

                        dayName:
                            names.dayName,

                        shortDayName:
                            names.shortDayName,

                        dayType:
                            record &&
                            record.isWorking
                                ? "WORKING"
                                : "OFF",

                        stats,
                    });

                    date =
                        new Date(
                            date.getTime() +
                                24 *
                                    60 *
                                    60 *
                                    1000
                        );
                }
            }

            const monthStats =
                createStats(
                    monthDays
                );

            months.push({
                year,
                month:
                    month + 1,

                monthName:
                    getMonthName(
                        monthStart
                    ),

                startDate:
                    toDateKey(
                        visibleStart
                    ),

                endDate:
                    toDateKey(
                        visibleEnd
                    ),

                totalDays:
                    monthDays.length,

                visibleDays:
                    monthDays.length,

                stats:
                    monthStats,

                days:
                    monthDays,
            });

            cursor =
                nextMonthStart;
        }

        /*
         * Overall statistics.
         */
        const allDays =
            months.flatMap(
                (month) =>
                    month.days
            );

        const overallStats =
            createStats(
                allDays
            );

        /*
         * Overall leaderboard.
         *
         * Score from profile creation
         * until yesterday.
         */
        const leaderboard =
            await getLeaderboard(
                session.id,
                createdDate,
                today
            );

        overallStats.status =
            leaderboard.status;

        overallStats.position =
            leaderboard.position;

        /*
         * Add leaderboard/status to
         * monthly statistics too.
         */
        for (const month of months) {
            const monthStart =
                startOfDay(
                    new Date(
                        `${month.startDate}T00:00:00Z`
                    )
                );

            const monthEnd =
                endOfDay(
                    new Date(
                        `${month.endDate}T00:00:00Z`
                    )
                );

            const monthLeaderboard =
                await getLeaderboard(
                    session.id,
                    monthStart,
                    monthEnd
                );

            month.stats.status =
                monthLeaderboard.status;

            month.stats.position =
                monthLeaderboard.position;

            /*
             * Add the same period status
             * to individual day records.
             */
            for (const day of month.days) {
                const dayDate =
                    new Date(
                        `${day.date}T00:00:00Z`
                    );

                const dayLeaderboard =
                    await getLeaderboard(
                        session.id,
                        dayDate,
                        endOfDay(
                            dayDate
                        )
                    );

                day.stats.status =
                    dayLeaderboard.status;

                day.stats.position =
                    dayLeaderboard.position;
            }
        }

        const result: OverviewRecord =
            {
                createdAt:
                    toDateKey(
                        createdDate
                    ),

                endDate:
                    toDateKey(
                        yesterday
                    ),

                stats:
                    overallStats,

                months,
            };

        return NextResponse.json(
            result
        );
    } catch (error) {
        console.error(
            "OVERVIEW RECORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load overview records.",
            },
            {
                status: 500,
            }
        );
    }
}