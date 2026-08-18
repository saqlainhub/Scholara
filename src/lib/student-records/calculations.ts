import {
    prisma,
} from "@/lib/prisma";

import {
    calculateStudentStatuses,
} from "@/lib/utils/student-status";

import {
    countDays,
    getDaysBetween,
} from "./dates";

import type {
    DayRecord,
    RecordStats,
} from "./types";

type TaskData = {
    id: string;
    isCompleted: boolean;
    isDelayed: boolean;
    isChecked: boolean;

    submissions: {
        id: string;
    }[];

    review: {
        score: number;
    } | null;
};

type DailyRecordData = {
    id: string;
    studentId: string;
    date: Date;
    isWorking: boolean;
    tasks: TaskData[];
};

type StudentScore = {
    id: string;
    totalScore: number;
};

function getDateKey(
    date: Date
): string {
    return date
        .toISOString()
        .slice(0, 10);
}

function calculateRawStats(
    records: DailyRecordData[]
) {
    let totalTasks = 0;
    let submitted = 0;
    let delayed = 0;
    let checked = 0;
    let score = 0;

    for (const record of records) {
        for (const task of record.tasks) {
            totalTasks++;

            if (
                task.submissions.length > 0
            ) {
                submitted++;
            }

            if (task.isDelayed) {
                delayed++;
            }

            if (task.isChecked) {
                checked++;
            }

            if (task.review) {
                score += Number(
                    task.review.score || 0
                );
            }
        }
    }

    const unsubmitted =
        totalTasks - submitted;

    const ontime =
        submitted - delayed > 0
            ? submitted - delayed
            : 0;

    const unchecked =
        totalTasks - checked;

    const workingDays =
        records.filter(
            (record) =>
                record.isWorking
        ).length;

    const offDays =
        records.filter(
            (record) =>
                !record.isWorking
        ).length;

    return {
        totalTasks,
        submitted,
        unsubmitted,
        delayed,
        ontime,
        checked,
        unchecked,
        workingDays,
        offDays,
        score,
    };
}

async function getPeriodRecordsForAllStudents(
    startDate: string,
    endDate: string
): Promise<DailyRecordData[]> {
    return prisma.dailyRecord.findMany({
        where: {
            date: {
                gte: new Date(
                    `${startDate}T00:00:00.000Z`
                ),

                lte: new Date(
                    `${endDate}T23:59:59.999Z`
                ),
            },

            student: {
                role: "STUDENT",
                isActive: true,
            },
        },

        include: {
            tasks: {
                include: {
                    submissions: {
                        select: {
                            id: true,
                        },
                    },

                    review: {
                        select: {
                            score: true,
                        },
                    },
                },
            },
        },

        orderBy: {
            date: "asc",
        },
    });
}

function calculateStudentScores(
    records: DailyRecordData[]
): StudentScore[] {
    const grouped =
        new Map<
            string,
            DailyRecordData[]
        >();

    for (const record of records) {
        const existing =
            grouped.get(
                record.studentId
            ) ?? [];

        existing.push(record);

        grouped.set(
            record.studentId,
            existing
        );
    }

    return Array.from(
        grouped.entries()
    ).map(
        ([
            studentId,
            studentRecords,
        ]) => {
            const raw =
                calculateRawStats(
                    studentRecords
                );

            return {
                id: studentId,
                totalScore:
                    raw.score,
            };
        }
    );
}

function getLeaderboardPosition(
    studentId: string,
    scores: StudentScore[]
): number | null {
    if (scores.length === 0) {
        return null;
    }

    /*
     * Higher score = better position.
     *
     * Students with equal scores receive
     * the same ranking.
     *
     * Example:
     *
     * 100 → #1
     * 100 → #1
     * 80  → #3
     */

    const sorted =
        [...scores].sort(
            (a, b) =>
                b.totalScore -
                a.totalScore
        );

    const student =
        scores.find(
            (item) =>
                item.id ===
                studentId
        );

    if (!student) {
        return null;
    }

    const betterStudents =
        sorted.filter(
            (item) =>
                item.totalScore >
                student.totalScore
        ).length;

    return betterStudents + 1;
}

async function getPeriodContext(
    studentId: string,
    startDate: string,
    endDate: string
) {
    const records =
        await getPeriodRecordsForAllStudents(
            startDate,
            endDate
        );

    const ownRecords =
        records.filter(
            (record) =>
                record.studentId ===
                studentId
        );

    const scores =
        calculateStudentScores(
            records
        );

    const statusData =
        calculateStudentStatuses(
            scores
        );

    const ownStatus =
        statusData.students.find(
            (student) =>
                student.id ===
                studentId
        );

    const position =
        getLeaderboardPosition(
            studentId,
            scores
        );

    return {
        records,
        ownRecords,
        scores,
        status:
            ownStatus?.status ??
            "ACTIVE",
        position,
    };
}

export async function calculateRecordStats(
    studentId: string,
    startDate: string,
    endDate: string
): Promise<RecordStats> {
    const context =
        await getPeriodContext(
            studentId,
            startDate,
            endDate
        );

    const raw =
        calculateRawStats(
            context.ownRecords
        );

    return {
        totalTasks:
            raw.totalTasks,

        submitted:
            raw.submitted,

        unsubmitted:
            raw.unsubmitted,

        delayed:
            raw.delayed,

        ontime:
            raw.ontime,

        checked:
            raw.checked,

        unchecked:
            raw.unchecked,

        totalDays:
            countDays(
                startDate,
                endDate
            ),

        workingDays:
            raw.workingDays,

        offDays:
            raw.offDays,

        score:
            raw.score,

        status:
            context.status,

        position:
            context.position,
    };
}

export async function calculateDayRecords(
    studentId: string,
    startDate: string,
    endDate: string
): Promise<DayRecord[]> {
    const dates =
        getDaysBetween(
            startDate,
            endDate
        );

    /*
     * Fetch all relevant records once.
     */
    const records =
        await prisma.dailyRecord.findMany({
            where: {
                studentId,

                date: {
                    gte: new Date(
                        `${startDate}T00:00:00.000Z`
                    ),

                    lte: new Date(
                        `${endDate}T23:59:59.999Z`
                    ),
                },
            },

            include: {
                tasks: {
                    include: {
                        submissions: {
                            select: {
                                id: true,
                            },
                        },

                        review: {
                            select: {
                                score: true,
                            },
                        },
                    },
                },
            },

            orderBy: {
                date: "asc",
            },
        });

    const recordMap =
        new Map(
            records.map(
                (record) => [
                    getDateKey(
                        record.date
                    ),
                    record,
                ]
            )
        );

    /*
     * We calculate leaderboard/status
     * separately for each date.
     *
     * This is still one period query per day,
     * rather than one query per student.
     */
    const result: DayRecord[] = [];

    for (const date of dates) {
        const record =
            recordMap.get(date);

        const raw =
            record
                ? calculateRawStats([
                      record,
                  ])
                : {
                      totalTasks: 0,
                      submitted: 0,
                      unsubmitted: 0,
                      delayed: 0,
                      ontime: 0,
                      checked: 0,
                      unchecked: 0,
                      workingDays: 0,
                      offDays: 0,
                      score: 0,
                  };

        /*
         * A missing DailyRecord is treated as
         * an off/non-created day for the calendar.
         *
         * If your system later guarantees that
         * every day gets a DailyRecord, this still
         * works correctly.
         */
        const dayType =
            record?.isWorking === false
                ? "OFF"
                : "WORKING";

        const dayStats =
            await calculateRecordStats(
                studentId,
                date,
                date
            );

        result.push({
            date,

            dayName:
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        weekday:
                            "long",
                        timeZone:
                            "UTC",
                    }
                ).format(
                    new Date(
                        `${date}T12:00:00.000Z`
                    )
                ),

            shortDayName:
                new Intl.DateTimeFormat(
                    "en-US",
                    {
                        weekday:
                            "short",
                        timeZone:
                            "UTC",
                    }
                ).format(
                    new Date(
                        `${date}T12:00:00.000Z`
                    )
                ),

            dayType,

            stats: {
                ...dayStats,

                totalDays: 1,

                workingDays:
                    record?.isWorking
                        ? 1
                        : 0,

                offDays:
                    record &&
                    !record.isWorking
                        ? 1
                        : 0,

                totalTasks:
                    raw.totalTasks,

                submitted:
                    raw.submitted,

                unsubmitted:
                    raw.unsubmitted,

                delayed:
                    raw.delayed,

                ontime:
                    raw.ontime,

                checked:
                    raw.checked,

                unchecked:
                    raw.unchecked,

                score:
                    raw.score,
            },
        });
    }

    return result;
}