import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function formatPakistanDate(value: Date) {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Karachi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(value);
}

function formatPakistanDateLabel(
    value: Date
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
    ).format(value);
}

export async function GET() {
    try {
        // =====================================================
        // AUTHENTICATION
        // =====================================================

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
            "STUDENT"
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

        // =====================================================
        // LOAD STUDENT TASKS
        // =====================================================

        const tasks =
            await prisma.task.findMany({
                where: {
                    studentId: session.id,
                },

                orderBy: [
                    {
                        checkedAt:
                            "desc",
                    },
                    {
                        createdAt:
                            "desc",
                    },
                ],

                include: {
                    // =================================================
                    // TEACHER
                    // =================================================

                    teacher: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                        },
                    },

                    // =================================================
                    // CATEGORY
                    // =================================================

                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    // =================================================
                    // LATEST SUBMISSION
                    // =================================================
                    //
                    // We only need the latest submission for the
                    // student portal because that is the submission
                    // corresponding to the current review.
                    //
                    // Media is included here so the popup can show
                    // every file/image uploaded by the student.
                    //
                    // =================================================

                    submissions: {
                        orderBy: {
                            submittedAt:
                                "desc",
                        },

                        take: 1,

                        include: {
                            media: true,
                        },
                    },

                    // =================================================
                    // CURRENT REVIEW
                    // =================================================

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

        // =====================================================
        // ONLY CURRENTLY CHECKED TASKS
        // =====================================================
        //
        // A task should appear in Assignments only when:
        //
        // 1. It has been checked.
        // 2. It has a current review.
        // 3. The student has not submitted again after
        //    that review.
        //
        // This is what makes recheck work.
        //
        // =====================================================

        const checkedTasks =
            tasks.filter(
                (task) => {
                    if (
                        !task.isChecked ||
                        !task.review
                    ) {
                        return false;
                    }

                    const latestSubmission =
                        task.submissions[0];

                    // No submission means there is
                    // nothing newer than the review.
                    if (!latestSubmission) {
                        return true;
                    }

                    const submissionTime =
                        new Date(
                            latestSubmission.submittedAt
                        ).getTime();

                    const reviewTime =
                        new Date(
                            task.review.checkedAt
                        ).getTime();

                    if (
                        Number.isNaN(
                            submissionTime
                        ) ||
                        Number.isNaN(
                            reviewTime
                        )
                    ) {
                        return true;
                    }

                    /*
                     * If student submitted AFTER
                     * the current review, the task
                     * is waiting for recheck.
                     */
                    return (
                        submissionTime <=
                        reviewTime
                    );
                }
            );

        // =====================================================
        // GROUP BY CURRENT REVIEW DATE
        // =====================================================

        const groupMap =
            new Map<
                string,
                {
                    date: string;
                    label: string;
                    tasks: typeof checkedTasks;
                }
            >();

        for (const task of checkedTasks) {
            if (!task.review) {
                continue;
            }

            const reviewDate =
                new Date(
                    task.review.checkedAt
                );

            const dateKey =
                formatPakistanDate(
                    reviewDate
                );

            const existing =
                groupMap.get(
                    dateKey
                );

            if (existing) {
                existing.tasks.push(
                    task
                );
            } else {
                groupMap.set(
                    dateKey,
                    {
                        date: dateKey,

                        label:
                            formatPakistanDateLabel(
                                reviewDate
                            ),

                        tasks: [task],
                    }
                );
            }
        }

        // =====================================================
        // SORT GROUPS
        // =====================================================

        const groups =
            Array.from(
                groupMap.values()
            ).sort(
                (a, b) =>
                    new Date(
                        b.date
                    ).getTime() -
                    new Date(
                        a.date
                    ).getTime()
            );

        // =====================================================
        // SORT TASKS INSIDE GROUPS
        // =====================================================

        for (const group of groups) {
            group.tasks.sort(
                (a, b) => {
                    const aTime =
                        a.review
                            ? new Date(
                                  a.review.checkedAt
                              ).getTime()
                            : 0;

                    const bTime =
                        b.review
                            ? new Date(
                                  b.review.checkedAt
                              ).getTime()
                            : 0;

                    return (
                        bTime -
                        aTime
                    );
                }
            );
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        return NextResponse.json({
            groups,
        });
    } catch (error) {
        console.error(
            "STUDENT ASSIGNMENTS GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load assignments.",
            },
            {
                status: 500,
            }
        );
    }
}