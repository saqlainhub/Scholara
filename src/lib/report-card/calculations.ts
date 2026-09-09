import {
    prisma,
} from "@/lib/prisma";

import {
    getDateBounds,
} from "./date";

import type {
    DailyReportCard,
    ReportTask,
} from "./types";


const MAX_POINTS = 5;


export async function getDailyReportCard(
    studentId: string,
    date: string
): Promise<DailyReportCard | null> {

    const {
        start,
        end,
    } =
        getDateBounds(
            date
        );


    /*
     * Get the student's
     * DailyRecord and tasks.
     */
    const dailyRecord =
        await prisma.dailyRecord.findFirst({
            where: {
                studentId,

                date: {
                    gte:
                        start,

                    lte:
                        end,
                },
            },

            include: {
                student: {
                    select: {
                        id:
                            true,

                        name:
                            true,
                    },
                },

                tasks: {
                    include: {
                        submissions: {
                            orderBy: {
                                submittedAt:
                                    "desc",
                            },

                            take:
                                1,

                            select: {
                                submittedAt:
                                    true,
                            },
                        },

                        review: {
                            select: {
                                score:
                                    true,
                            },
                        },
                    },

                    orderBy: {
                        createdAt:
                            "asc",
                    },
                },
            },
        });


    if (!dailyRecord) {
        return null;
    }


    /*
     * Build task details.
     */
    const tasks:
        ReportTask[] =
        dailyRecord.tasks.map(
            (
                task,
                index
            ) => {

                const submitted =
                    task.submissions
                        .length > 0;


                /*
                 * If task is not submitted,
                 * only serial number and title
                 * will be shown.
                 *
                 * All remaining fields are null
                 * and UI will display "-".
                 */
                if (!submitted) {
                    return {
                        id:
                            task.id,

                        number:
                            index + 1,

                        name:
                            task.title,

                        submitted:
                            false,

                        checked:
                            false,

                        difficulty:
                            null,

                        obtainedPoints:
                            null,

                        maxPoints:
                            null,

                        status:
                            null,

                        lastSubmissionTime:
                            null,
                    };
                }


                const lastSubmissionTime =
                    task.submissions[0]
                        ?.submittedAt ??
                    null;


                const obtainedPoints =
                    task.review
                        ? Number(
                            task.review
                                .score
                        )
                        : 0;


                const status =
                    task.isDelayed
                        ? "DELAYED"
                        : "ON_TIME";


                return {
                    id:
                        task.id,

                    number:
                        index + 1,

                    name:
                        task.title,

                    submitted:
                        true,

                    checked:
                        task.isChecked,

                    difficulty:
                        task.difficulty,

                    obtainedPoints,

                    maxPoints:
                        MAX_POINTS,

                    status,

                    lastSubmissionTime,
                };
            }
        );


    /*
     * Progress summary.
     */
    const totalTasks =
        tasks.length;


    const submitted =
        tasks.filter(
            task =>
                task.submitted
        ).length;


    const checked =
        tasks.filter(
            task =>
                task.checked
        ).length;


    /*
     * Total possible score.
     *
     * Every task:
     *
     * difficulty × 5
     *
     * Unsubmitted tasks are still included
     * because they are part of the day's
     * total possible score.
     */
    const totalScore =
        dailyRecord.tasks.reduce(
            (
                total,
                task
            ) =>
                total +
                (
                    task.difficulty *
                    MAX_POINTS
                ),

            0
        );


    /*
     * Obtained weighted score.
     *
     * difficulty × obtained points
     */
    const obtainedScore =
        dailyRecord.tasks.reduce(
            (
                total,
                task
            ) => {

                const obtainedPoints =
                    Number(
                        task.review
                            ?.score ??
                        0
                    );


                return (
                    total +
                    (
                        task.difficulty *
                        obtainedPoints
                    )
                );
            },

            0
        );


    const performanceRate =
        totalScore > 0
            ? Number(
                (
                    (
                        obtainedScore /
                        totalScore
                    ) *
                    100
                ).toFixed(2)
            )
            : 0;


    /*
     * Get all students' records
     * for the same day.
     */
    const allRecords =
        await prisma.dailyRecord.findMany({
            where: {
                date: {
                    gte:
                        start,

                    lte:
                        end,
                },

                student: {
                    role:
                        "STUDENT",

                    isActive:
                        true,
                },
            },

            include: {
                tasks: {
                    include: {
                        review: {
                            select: {
                                score:
                                    true,
                            },
                        },
                    },
                },
            },
        });


    /*
     * Calculate each student's
     * weighted daily score.
     */
    const leaderboard =
        allRecords.map(
            record => {

                const score =
                    record.tasks.reduce(
                        (
                            total,
                            task
                        ) => {

                            const obtained =
                                Number(
                                    task.review
                                        ?.score ??
                                    0
                                );


                            return (
                                total +
                                (
                                    task.difficulty *
                                    obtained
                                )
                            );
                        },

                        0
                    );


                return {
                    studentId:
                        record.studentId,

                    score,
                };
            }
        );


    /*
     * Highest score first.
     */
    const sorted =
        [...leaderboard].sort(
            (
                a,
                b
            ) =>
                b.score -
                a.score
        );


    const currentStudent =
        leaderboard.find(
            item =>
                item.studentId ===
                studentId
        );


    /*
     * Same score =
     * same leaderboard position.
     *
     * Example:
     *
     * 100 -> #1
     * 100 -> #1
     * 80  -> #3
     */
    const leaderboardPosition =
        currentStudent
            ? (
                sorted.filter(
                    item =>
                        item.score >
                        currentStudent
                            .score
                ).length + 1
            )
            : null;


    return {
        student: {
            id:
                dailyRecord
                    .student.id,

            name:
                dailyRecord
                    .student.name,
        },

        date:
            dailyRecord.date,

        isWorking:
            dailyRecord.isWorking,

        summary: {
            totalTasks,

            submitted,

            checked,

            totalScore,

            obtainedScore,

            performanceRate,

            leaderboardPosition,
        },

        tasks,
    };
}