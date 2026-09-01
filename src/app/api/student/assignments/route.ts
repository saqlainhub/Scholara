import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getVoiceNoteSignedUrl } from "@/lib/b2";

export const runtime = "nodejs";

// ==========================================================
// TYPES
// ==========================================================

type VoiceNoteRecord = {
    id: string;
    submissionId: string;
    storageKey: string;
    mimeType: string;
    fileName: string;
    duration: number | null;
    bytes: number | null;
    createdAt: Date;
};

// ==========================================================
// PAKISTAN DATE HELPERS
// ==========================================================

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

// ==========================================================
// VOICE NOTE SERIALIZATION
// ==========================================================

/**
 * Voice notes are stored in Backblaze B2.
 *
 * The database stores only the storageKey.
 *
 * Before returning data to the browser, we generate
 * temporary signed URLs for each voice note.
 *
 * B2 credentials are never sent to the client.
 */
async function serializeVoiceNotes(
    voiceNotes: VoiceNoteRecord[]
) {
    return Promise.all(
        voiceNotes.map(
            async (voice) => {
                let url: string | null =
                    null;

                try {
                    if (
                        !voice.storageKey
                    ) {
                        throw new Error(
                            "Voice note has no storage key."
                        );
                    }

                    url =
                        await getVoiceNoteSignedUrl(
                            voice.storageKey
                        );
                } catch (error) {
                    console.error(
                        "STUDENT ASSIGNMENTS: FAILED TO GENERATE B2 SIGNED URL:",
                        {
                            voiceNoteId:
                                voice.id,

                            submissionId:
                                voice.submissionId,

                            storageKey:
                                voice.storageKey,

                            error,
                        }
                    );
                }

                return {
                    id: voice.id,

                    submissionId:
                        voice.submissionId,

                    storageKey:
                        voice.storageKey,

                    mimeType:
                        voice.mimeType,

                    fileName:
                        voice.fileName,

                    duration:
                        voice.duration,

                    bytes:
                        voice.bytes,

                    createdAt:
                        voice.createdAt,

                    /**
                     * Temporary signed B2 URL.
                     *
                     * This URL is safe to send to
                     * the browser.
                     */
                    url,
                };
            }
        )
    );
}

// ==========================================================
// SERIALIZE SUBMISSION
// ==========================================================

/**
 * Converts the latest database submission into a
 * browser-safe response.
 *
 * Normal media remains unchanged because it already
 * contains browser-accessible URLs.
 *
 * Voice notes receive temporary B2 signed URLs.
 */
async function serializeSubmission(
    submission: {
        id: string;
        taskId: string;
        studentId: string;
        note: string | null;
        submittedAt: Date;
        media: unknown[];
        voiceNotes: VoiceNoteRecord[];
    }
) {
    const voiceNotes =
        await serializeVoiceNotes(
            submission.voiceNotes
        );

    return {
        id: submission.id,

        taskId:
            submission.taskId,

        studentId:
            submission.studentId,

        note:
            submission.note,

        submittedAt:
            submission.submittedAt,

        /**
         * Cloudinary media.
         *
         * Images, videos and PDFs.
         */
        media:
            submission.media,

        /**
         * Backblaze B2 voice notes.
         *
         * Each record contains a temporary signed URL.
         */
        voiceNotes,

        mediaCount:
            submission.media.length,

        voiceNoteCount:
            voiceNotes.length,
    };
}

// ==========================================================
// GET
// ==========================================================

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
                    studentId:
                        session.id,
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
                            username:
                                true,
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
                            // -----------------------------------------
                            // CLOUDINARY MEDIA
                            // -----------------------------------------

                            media: true,

                            // -----------------------------------------
                            // BACKBLAZE B2 VOICE NOTES
                            // -----------------------------------------

                            voiceNotes: {
                                orderBy: {
                                    createdAt:
                                        "asc",
                                },
                            },
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

                                    username:
                                        true,
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
        // A task appears when:
        //
        // 1. It has been checked.
        // 2. It has a review.
        // 3. The latest submission is not newer than
        //    the current review.
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
                        task
                            .submissions[0];

                    /**
                     * No submission means there is
                     * nothing newer than the review.
                     */
                    if (
                        !latestSubmission
                    ) {
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

                    /**
                     * Preserve existing behaviour if
                     * either timestamp is invalid.
                     */
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

                    /**
                     * If the student submitted again
                     * after the teacher reviewed the task,
                     * it should not appear as currently
                     * checked.
                     */
                    return (
                        submissionTime <=
                        reviewTime
                    );
                }
            );

        // =====================================================
        // SERIALIZE LATEST SUBMISSIONS
        // =====================================================
        //
        // Generate fresh B2 signed URLs before the
        // data is sent to the browser.
        //
        // We create a new task response rather than
        // modifying Prisma objects.
        //
        // =====================================================

        const serializedTasks =
            await Promise.all(
                checkedTasks.map(
                    async (task) => {
                        const latestSubmission =
                            task
                                .submissions[0] ??
                            null;

                        const submission =
                            latestSubmission
                                ? await serializeSubmission(
                                      latestSubmission
                                  )
                                : null;

                        return {
                            /**
                             * Keep all existing task
                             * properties unchanged.
                             */
                            ...task,

                            /**
                             * Replace Prisma submissions
                             * with the serialized latest
                             * submission.
                             */
                            submissions:
                                submission
                                    ? [
                                          submission,
                                      ]
                                    : [],
                        };
                    }
                )
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
                    tasks:
                        typeof serializedTasks;
                }
            >();

        for (const task of serializedTasks) {
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
                        date:
                            dateKey,

                        label:
                            formatPakistanDateLabel(
                                reviewDate
                            ),

                        tasks: [
                            task,
                        ],
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

        for (
            const group of groups
        ) {
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