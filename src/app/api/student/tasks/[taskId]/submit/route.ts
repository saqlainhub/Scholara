import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
    deleteVoiceNoteFromB2,
} from "@/lib/b2";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        taskId: string;
    }>;
};

type SubmittedMediaInput = {
    url: string;
    publicId?: string;
    resourceType?: string;
    fileName?: string;
    format?: string | null;
    bytes?: number | null;
};

function normalizeMedia(
    media: SubmittedMediaInput
) {
    return {
        url: media.url,

        publicId:
            media.publicId ||
            media.url,

        resourceType:
            media.resourceType ||
            "raw",

        fileName:
            media.fileName ||
            "file",

        format:
            media.format ||
            null,

        bytes:
            typeof media.bytes ===
            "number"
                ? media.bytes
                : null,
    };
}

function parseMedia(
    value: unknown
): SubmittedMediaInput[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (
            item: unknown
        ): item is SubmittedMediaInput =>
            typeof item === "object" &&
            item !== null &&
            typeof (
                item as SubmittedMediaInput
            ).url === "string"
    );
}

/**
 * Parse voice-note IDs sent by the client.
 *
 * These are ONLY the IDs of existing voice notes
 * that the student wants to KEEP.
 *
 * New voice notes do not have IDs yet.
 */
function parseVoiceNoteIds(
    value: unknown
): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return Array.from(
        new Set(
            value.filter(
                (
                    item: unknown
                ): item is string =>
                    typeof item ===
                        "string" &&
                    item.trim().length > 0
            )
        )
    );
}

export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        // =====================================================
        // AUTH
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
        // TASK ID
        // =====================================================

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

        // =====================================================
        // FIND TASK
        // =====================================================

        const task =
            await prisma.task.findFirst({
                where: {
                    id: taskId,

                    studentId:
                        session.id,
                },

                select: {
                    id: true,
                    studentId: true,
                    deadline: true,
                    isChecked: true,
                },
            });

        if (!task) {
            return NextResponse.json(
                {
                    message:
                        "Task not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // =====================================================
        // READ REQUEST
        // =====================================================

        const contentType =
            request.headers.get(
                "content-type"
            ) || "";

        let note = "";

        let requestedMedia:
            SubmittedMediaInput[] = [];

        /*
         * IDs of EXISTING voice notes that the
         * student wants to KEEP.
         *
         * Example:
         *
         * DB:
         *   A
         *   B
         *   C
         *
         * Client sends:
         *   ["B", "C"]
         *
         * Therefore A must be deleted.
         */
        let retainedVoiceNoteIds: string[] =
            [];

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            const body =
                await request.json();

            note =
                typeof body.note ===
                "string"
                    ? body.note
                    : "";

            requestedMedia =
                parseMedia(
                    body.media
                );

            retainedVoiceNoteIds =
                parseVoiceNoteIds(
                    body.voiceNoteIds
                );
        } else if (
            contentType.includes(
                "multipart/form-data"
            ) ||
            contentType.includes(
                "application/x-www-form-urlencoded"
            )
        ) {
            const formData =
                await request.formData();

            // ---------------------------------------------
            // NOTE
            // ---------------------------------------------

            const noteValue =
                formData.get("note");

            note =
                typeof noteValue ===
                "string"
                    ? noteValue
                    : "";

            // ---------------------------------------------
            // NORMAL MEDIA
            // ---------------------------------------------

            const mediaValue =
                formData.get("media");

            if (
                typeof mediaValue ===
                "string"
            ) {
                try {
                    requestedMedia =
                        parseMedia(
                            JSON.parse(
                                mediaValue
                            )
                        );
                } catch {
                    requestedMedia =
                        [];
                }
            }

            // ---------------------------------------------
            // RETAINED VOICE NOTES
            // ---------------------------------------------

            const voiceNoteIdsValue =
                formData.get(
                    "voiceNoteIds"
                );

            if (
                typeof voiceNoteIdsValue ===
                "string"
            ) {
                try {
                    retainedVoiceNoteIds =
                        parseVoiceNoteIds(
                            JSON.parse(
                                voiceNoteIdsValue
                            )
                        );
                } catch {
                    retainedVoiceNoteIds =
                        [];
                }
            }
        } else {
            return NextResponse.json(
                {
                    message:
                        "Unsupported request content type.",
                },
                {
                    status: 400,
                }
            );
        }

        // =====================================================
        // REJECT BROWSER BLOB URLs
        // =====================================================

        const invalidBlobMedia =
            requestedMedia.some(
                (media) =>
                    media.url.startsWith(
                        "blob:"
                    )
            );

        if (invalidBlobMedia) {
            return NextResponse.json(
                {
                    message:
                        "Voice recordings must be uploaded through the voice-notes endpoint.",
                },
                {
                    status: 400,
                }
            );
        }

        // =====================================================
        // NORMALIZE + DEDUPLICATE MEDIA
        // =====================================================

        const uniqueMedia =
            Array.from(
                new Map(
                    requestedMedia.map(
                        (media) => [
                            media.url,
                            media,
                        ]
                    )
                ).values()
            );

        const normalizedMedia =
            uniqueMedia.map(
                normalizeMedia
            );

        // =====================================================
        // FIND LATEST SUBMISSION
        // =====================================================

        const existingSubmission =
            await prisma.taskSubmission.findFirst(
                {
                    where: {
                        taskId,

                        studentId:
                            session.id,
                    },

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

                    select: {
                        id: true,

                        voiceNotes: {
                            select: {
                                id: true,

                                storageKey:
                                    true,
                            },
                        },
                    },
                }
            );

        // =====================================================
        // DETERMINE VOICE NOTES TO DELETE
        // =====================================================

        /*
         * IMPORTANT:
         *
         * Only existing voice notes can be deleted here.
         *
         * New voice notes are uploaded AFTER this
         * submit request through /voice-notes.
         */

        const voiceNotesToDelete =
            existingSubmission
                ? existingSubmission.voiceNotes.filter(
                      (
                          voiceNote
                      ) =>
                          !retainedVoiceNoteIds.includes(
                              voiceNote.id
                          )
                  )
                : [];

        /*
         * Make sure the client cannot send an arbitrary
         * voice-note ID belonging to another submission.
         *
         * Every retained ID must belong to the current
         * submission.
         */

        if (
            existingSubmission &&
            retainedVoiceNoteIds.length >
                0
        ) {
            const existingVoiceNoteIds =
                new Set(
                    existingSubmission.voiceNotes.map(
                        (
                            voiceNote
                        ) =>
                            voiceNote.id
                    )
                );

            const invalidRetainedIds =
                retainedVoiceNoteIds.filter(
                    (
                        id
                    ) =>
                        !existingVoiceNoteIds.has(
                            id
                        )
                );

            if (
                invalidRetainedIds.length >
                0
            ) {
                return NextResponse.json(
                    {
                        message:
                            "One or more voice notes do not belong to this submission.",
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        // =====================================================
        // SUBMISSION TIME
        // =====================================================

        const submittedAt =
            new Date();

        const delayed =
            task.deadline
                ? submittedAt >
                  task.deadline
                : false;

        // =====================================================
        // UPDATE / CREATE SUBMISSION
        // =====================================================

        const result =
            await prisma.$transaction(
                async (tx) => {
                    let submission;

                    if (
                        existingSubmission
                    ) {
                        // ---------------------------------------------
                        // DELETE NORMAL CLOUDINARY MEDIA
                        // ---------------------------------------------

                        await tx.taskSubmissionMedia.deleteMany(
                            {
                                where: {
                                    submissionId:
                                        existingSubmission.id,
                                },
                            }
                        );

                        // ---------------------------------------------
                        // DELETE REMOVED VOICE NOTES FROM DATABASE
                        // ---------------------------------------------

                        if (
                            voiceNotesToDelete.length >
                            0
                        ) {
                            await tx.taskSubmissionVoiceNote.deleteMany(
                                {
                                    where: {
                                        id: {
                                            in: voiceNotesToDelete.map(
                                                (
                                                    voiceNote
                                                ) =>
                                                    voiceNote.id
                                            ),
                                        },

                                        submissionId:
                                            existingSubmission.id,
                                    },
                                }
                            );
                        }

                        // ---------------------------------------------
                        // UPDATE SUBMISSION
                        // ---------------------------------------------

                        submission =
                            await tx.taskSubmission.update(
                                {
                                    where: {
                                        id:
                                            existingSubmission.id,
                                    },

                                    data: {
                                        note:
                                            note.trim() ||
                                            null,

                                        submittedAt,

                                        media: {
                                            create:
                                                normalizedMedia.map(
                                                    (
                                                        media
                                                    ) => ({
                                                        url:
                                                            media.url,

                                                        publicId:
                                                            media.publicId,

                                                        resourceType:
                                                            media.resourceType,

                                                        fileName:
                                                            media.fileName,

                                                        format:
                                                            media.format,

                                                        bytes:
                                                            media.bytes,
                                                    })
                                                ),
                                        },
                                    },

                                    include: {
                                        media: true,

                                        voiceNotes:
                                            true,
                                    },
                                }
                            );
                    } else {
                        // ---------------------------------------------
                        // FIRST SUBMISSION
                        // ---------------------------------------------

                        submission =
                            await tx.taskSubmission.create(
                                {
                                    data: {
                                        taskId,

                                        studentId:
                                            session.id,

                                        note:
                                            note.trim() ||
                                            null,

                                        submittedAt,

                                        media: {
                                            create:
                                                normalizedMedia.map(
                                                    (
                                                        media
                                                    ) => ({
                                                        url:
                                                            media.url,

                                                        publicId:
                                                            media.publicId,

                                                        resourceType:
                                                            media.resourceType,

                                                        fileName:
                                                            media.fileName,

                                                        format:
                                                            media.format,

                                                        bytes:
                                                            media.bytes,
                                                    })
                                                ),
                                        },
                                    },

                                    include: {
                                        media: true,

                                        voiceNotes:
                                            true,
                                    },
                                }
                            );
                    }

                    // =================================================
                    // UPDATE TASK
                    // =================================================

                    const updatedTask =
                        await tx.task.update({
                            where: {
                                id: taskId,
                            },

                            data: {
                                isCompleted:
                                    true,

                                isDelayed:
                                    delayed,

                                completedAt:
                                    submittedAt,
                            },

                            select: {
                                id: true,

                                isCompleted:
                                    true,

                                isDelayed:
                                    true,

                                isChecked:
                                    true,

                                completedAt:
                                    true,
                            },
                        });

                    return {
                        submission,

                        task:
                            updatedTask,
                    };
                }
            );

        // =====================================================
        // DELETE REMOVED VOICE NOTE FILES FROM B2
        // =====================================================

        /*
         * Database deletion above is authoritative.
         *
         * Now remove the corresponding physical objects
         * from Backblaze B2.
         */

        if (
            voiceNotesToDelete.length >
            0
        ) {
            const b2DeleteResults =
                await Promise.allSettled(
                    voiceNotesToDelete.map(
                        (
                            voiceNote
                        ) =>
                            deleteVoiceNoteFromB2(
                                voiceNote.storageKey
                            )
                    )
                );

            b2DeleteResults.forEach(
                (
                    result,
                    index
                ) => {
                    if (
                        result.status ===
                        "rejected"
                    ) {
                        console.error(
                            "FAILED TO DELETE VOICE NOTE FROM B2:",
                            {
                                voiceNoteId:
                                    voiceNotesToDelete[
                                        index
                                    ]?.id,

                                storageKey:
                                    voiceNotesToDelete[
                                        index
                                    ]?.storageKey,

                                error:
                                    result.reason,
                            }
                        );
                    }
                }
            );
        }

        // =====================================================
        // RESPONSE
        // =====================================================

        return NextResponse.json({
            success: true,

            submission:
                result.submission,

            task:
                result.task,

            delayed,

            mediaCount:
                result.submission.media
                    .length,

            voiceNoteCount:
                result.submission
                    .voiceNotes.length,

            deletedVoiceNoteCount:
                voiceNotesToDelete.length,
        });
    } catch (error) {
        console.error(
            "TASK SUBMISSION ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to submit task.",
            },
            {
                status: 500,
            }
        );
    }
}