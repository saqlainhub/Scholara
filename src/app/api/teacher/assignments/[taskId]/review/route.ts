
import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getVoiceNoteSignedUrl } from "@/lib/b2";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        taskId: string;
    }>;
};

type VoiceNoteRecord = {
    id: string;
    submissionId: string;
    storageKey: string;
    mimeType: string;
    fileName: string;
    duration: number | null;
    bytes: number;
    createdAt: Date;
};

const ALLOWED_SCORES = [
    0,
    0.5,
    1,
    1.5,
    2,
    2.5,
    3,
    3.5,
    4,
    4.5,
    5,
];

// ==========================================================
// VOICE NOTE SERIALIZATION
// ==========================================================

/**
 * Convert database voice-note records into browser-safe
 * objects containing temporary B2 signed URLs.
 *
 * IMPORTANT:
 *
 * The browser never receives B2 credentials.
 *
 * Database:
 *   storageKey
 *
 * Browser:
 *   temporary signed URL
 */
async function serializeVoiceNotes(
    voiceNotes: VoiceNoteRecord[]
) {
    return Promise.all(
        voiceNotes.map(async (voice) => {
            let url: string | null = null;

            try {
                if (!voice.storageKey) {
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
                    "FAILED TO GENERATE B2 SIGNED URL:",
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
                 * Temporary B2 signed URL.
                 *
                 * This is the URL the browser uses
                 * inside <audio>.
                 */
                url,
            };
        })
    );
}

// ==========================================================
// LOAD TEACHER TASK
// ==========================================================

/**
 * Load the task belonging to the authenticated teacher.
 *
 * Only the latest submission is required for review.
 *
 * The latest submission contains TWO separate kinds
 * of uploaded content:
 *
 * 1. media
 *    - Cloudinary files
 *    - images
 *    - videos
 *    - PDFs
 *
 * 2. voiceNotes
 *    - Backblaze B2 audio
 */
async function getTeacherTask(
    taskId: string,
    teacherId: string
) {
    return prisma.task.findFirst({
        where: {
            id: taskId,
            teacherId,
        },

        include: {
            submissions: {
                orderBy: [
                    {
                        submittedAt:
                            "desc",
                    },
                    {
                        id: "desc",
                    },
                ],

                take: 1,

                include: {
                    media: true,

                    voiceNotes: {
                        orderBy: {
                            createdAt:
                                "asc",
                        },
                    },
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

// ==========================================================
// SERIALIZE SUBMISSION
// ==========================================================

type TeacherTask = NonNullable<
    Awaited<
        ReturnType<
            typeof getTeacherTask
        >
    >
>;

type TeacherSubmission =
    TeacherTask["submissions"][number];

/**
 * Serialize the latest submission.
 *
 * Normal media is returned unchanged.
 *
 * B2 voice notes are converted into temporary
 * signed URLs.
 */
async function serializeSubmission(
    submission: TeacherSubmission
) {
    const voiceNotes =
        await serializeVoiceNotes(
            submission.voiceNotes as VoiceNoteRecord[]
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

        media:
            submission.media,

        /**
         * IMPORTANT:
         *
         * Voice notes are NOT inside media.
         * They are returned separately.
         */
        voiceNotes,

        mediaCount:
            submission.media.length,

        voiceNoteCount:
            voiceNotes.length,
    };
}

// ==========================================================
// TASK RESPONSE
// ==========================================================

function serializeTask(task: TeacherTask) {
    return {
        id: task.id,

        studentId:
            task.studentId,

        teacherId:
            task.teacherId,

        difficulty:
            task.difficulty,

        isCompleted:
            task.isCompleted,

        isDelayed:
            task.isDelayed,

        isChecked:
            task.isChecked,

        completedAt:
            task.completedAt,

        checkedAt:
            task.checkedAt,

        score:
            task.score,

        isCorrect:
            task.isCorrect,
    };
}

// ==========================================================
// GET
// ==========================================================

/**
 * GET
 *
 * Returns the complete teacher review payload,
 * including freshly generated B2 voice-note URLs.
 */
export async function GET(
    request: NextRequest,
    { params }: RouteContext
) {

    console.log("🔥 REVIEW GET ROUTE WAS CALLED 🔥");
    try {
        // ==================================================
        // AUTHENTICATION
        // ==================================================

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

        // ==================================================
        // TASK ID
        // ==================================================

        const { taskId } =
            await params;

        if (!taskId) {
            return NextResponse.json(
                {
                    message:
                        "Task ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==================================================
        // LOAD TASK
        // ==================================================

        const task =
            await getTeacherTask(
                taskId,
                session.id
            );

        if (!task) {
            return NextResponse.json(
                {
                    message:
                        "Task not found or you are not its assigned teacher.",
                },
                {
                    status: 404,
                }
            );
        }

        // ==================================================
        // LATEST SUBMISSION
        // ==================================================

        const latestSubmission =
            task.submissions[0] ?? null;

        console.log("===== REVIEW VOICE DEBUG =====");

        console.log("Task ID:", task.id);

        console.log(
            "Latest Submission ID:",
            latestSubmission?.id
        );

        console.log(
            "Voice Notes:",
            latestSubmission?.voiceNotes
        );

        console.log(
            "Voice Note Count:",
            latestSubmission?.voiceNotes?.length
        );

        console.log("================================");

        // ==================================================
        // NO SUBMISSION
        // ==================================================

        if (!latestSubmission) {
            return NextResponse.json({
                success: true,

                task:
                    serializeTask(
                        task
                    ),

                review:
                    task.review,

                submission:
                    null,
            });
        }

        // ==================================================
        // SERIALIZE SUBMISSION
        // ==================================================

        const submission =
            await serializeSubmission(
                latestSubmission
            );

        // ==================================================
        // RESPONSE
        // ==================================================

        return NextResponse.json({
            success: true,

            task:
                serializeTask(
                    task
                ),

            review:
                task.review,

            submission,
        });
    } catch (error) {
        console.error(
            "TEACHER TASK REVIEW GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load task review.",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================================
// POST
// ==========================================================

/**
 * POST
 *
 * Creates or updates the teacher review.
 *
 * After saving the review, the response also includes
 * the latest submission and fresh B2 signed URLs.
 */
export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        // ==================================================
        // AUTHENTICATION
        // ==================================================

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

        // ==================================================
        // TASK ID
        // ==================================================

        const { taskId } =
            await params;

        if (!taskId) {
            return NextResponse.json(
                {
                    message:
                        "Task ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==================================================
        // READ JSON BODY
        // ==================================================

        let body: unknown;

        try {
            body =
                await request.json();
        } catch {
            return NextResponse.json(
                {
                    message:
                        "Invalid JSON request body.",
                },
                {
                    status: 400,
                }
            );
        }

        const rawBody =
            body as {
                score?: unknown;
                note?: unknown;
            };

        // ==================================================
        // SCORE
        // ==================================================

        const rawScore =
            Number(
                rawBody?.score
            );

        if (
            Number.isNaN(
                rawScore
            ) ||
            !ALLOWED_SCORES.includes(
                rawScore
            )
        ) {
            return NextResponse.json(
                {
                    message:
                        "Invalid review score.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==================================================
        // NOTE
        // ==================================================

        const note =
            typeof rawBody?.note ===
                "string"
                ? rawBody.note.trim() ||
                null
                : null;

        // ==================================================
        // LOAD TASK
        // ==================================================

        const task =
            await getTeacherTask(
                taskId,
                session.id
            );

        if (!task) {
            return NextResponse.json(
                {
                    message:
                        "Task not found or you are not its assigned teacher.",
                },
                {
                    status: 404,
                }
            );
        }

        // ==================================================
        // CHECK SUBMISSION
        // ==================================================

        if (
            task.submissions.length ===
            0
        ) {
            return NextResponse.json(
                {
                    message:
                        "This task has not been submitted by the student yet.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==================================================
        // LATEST SUBMISSION
        // ==================================================

        const latestSubmission =
            task.submissions[0];

        // ==================================================
        // CALCULATE SCORE
        // ==================================================

        const calculatedScore =
            Math.round(
                task.difficulty *
                rawScore
            );

        // ==================================================
        // CHECKED AT
        // ==================================================

        const checkedAt =
            new Date();

        // ==================================================
        // TRANSACTION
        // ==================================================

        const result =
            await prisma.$transaction(
                async (tx) => {
                    // --------------------------------------
                    // CREATE / UPDATE REVIEW
                    // --------------------------------------

                    const review =
                        await tx.taskReview.upsert(
                            {
                                where: {
                                    taskId,
                                },

                                create: {
                                    taskId,

                                    teacherId:
                                        session.id,

                                    score:
                                        rawScore,

                                    note,

                                    checkedAt,
                                },

                                update: {
                                    teacherId:
                                        session.id,

                                    score:
                                        rawScore,

                                    note,

                                    checkedAt,
                                },
                            }
                        );

                    // --------------------------------------
                    // UPDATE TASK
                    // --------------------------------------

                    const updatedTask =
                        await tx.task.update(
                            {
                                where: {
                                    id:
                                        taskId,
                                },

                                data: {
                                    isChecked:
                                        true,

                                    checkedAt,

                                    score:
                                        calculatedScore,

                                    isCorrect:
                                        rawScore >
                                        0,
                                },

                                include: {
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
                            }
                        );

                    // --------------------------------------
                    // RECALCULATE STUDENT COUNTERS
                    // --------------------------------------

                    const checkedCount =
                        await tx.task.count(
                            {
                                where: {
                                    studentId:
                                        task.studentId,

                                    isChecked:
                                        true,
                                },
                            }
                        );

                    const totalCount =
                        await tx.task.count(
                            {
                                where: {
                                    studentId:
                                        task.studentId,
                                },
                            }
                        );

                    await tx.user.update(
                        {
                            where: {
                                id:
                                    task.studentId,
                            },

                            data: {
                                checkedTasks:
                                    checkedCount,

                                totalTasks:
                                    totalCount,
                            },
                        }
                    );

                    return {
                        review,

                        task:
                            updatedTask,
                    };
                }
            );

        // ==================================================
        // GENERATE FRESH B2 SIGNED URLS
        // ==================================================

        const submission =
            await serializeSubmission(
                latestSubmission
            );

        // ==================================================
        // RESPONSE
        // ==================================================

        return NextResponse.json({
            success: true,

            message:
                task.isChecked
                    ? "Task rechecked successfully."
                    : "Task checked successfully.",

            score:
                calculatedScore,

            review:
                result.review,

            task:
                result.task,

            submission,
        });
    } catch (error) {
        console.error(
            "TEACHER TASK REVIEW POST ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to save task review.",
            },
            {
                status: 500,
            }
        );
    }
}

