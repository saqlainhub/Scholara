import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import {
    uploadVoiceNoteToB2,
    deleteVoiceNoteFromB2,
} from "@/lib/b2";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        taskId: string;
    }>;
};

// ==========================================================
// CONFIGURATION
// ==========================================================

const MAX_VOICE_NOTE_SIZE =
    10 * 1024 * 1024;

const MAX_VOICE_NOTES_PER_REQUEST = 5;

const ALLOWED_AUDIO_TYPES = new Set([
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/m4a",
]);

const AUDIO_EXTENSION_BY_MIME: Record<
    string,
    string
> = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/m4a": "m4a",
};

// ==========================================================
// HELPERS
// ==========================================================

function getSafeFileName(
    fileName: string
): string {
    const cleaned =
        fileName
            .replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
            )
            .replace(
                /\.{2,}/g,
                "."
            )
            .slice(0, 150);

    return (
        cleaned ||
        "voice-note"
    );
}

function getExtension(
    file: File
): string {
    const mimeType =
        file.type.toLowerCase();

    const knownExtension =
        AUDIO_EXTENSION_BY_MIME[
            mimeType
        ];

    if (knownExtension) {
        return knownExtension;
    }

    const originalName =
        file.name.toLowerCase();

    const match =
        originalName.match(
            /\.([a-z0-9]+)$/
        );

    return (
        match?.[1] ||
        "audio"
    );
}

function isAllowedAudio(
    file: File
): boolean {
    const mimeType =
        file.type.toLowerCase();

    if (
        ALLOWED_AUDIO_TYPES.has(
            mimeType
        )
    ) {
        return true;
    }

    const extension =
        file.name
            .toLowerCase()
            .split(".")
            .pop();

    return [
        "webm",
        "ogg",
        "mp4",
        "mp3",
        "wav",
        "m4a",
    ].includes(
        extension || ""
    );
}

// ==========================================================
// POST
// ==========================================================

export async function POST(
    request: NextRequest,
    { params }: RouteContext
) {
    const uploadedKeys: string[] = [];

    try {
        // ==================================================
        // AUTH
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
        // VERIFY TASK OWNERSHIP
        // ==================================================

        const task =
            await prisma.task.findFirst({
                where: {
                    id: taskId,

                    studentId:
                        session.id,
                },

                select: {
                    id: true,

                    studentId:
                        true,

                    isChecked:
                        true,
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

        // ==================================================
        // FIND LATEST SUBMISSION
        // ==================================================

        const submission =
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
                    },
                }
            );

        if (!submission) {
            return NextResponse.json(
                {
                    message:
                        "Submit the task before attaching voice notes.",
                },
                {
                    status: 400,
                }
            );
        }

        // ==================================================
        // READ FORM DATA
        // ==================================================

        const formData =
            await request.formData();

        // ==================================================
        // READ REMOVED VOICE NOTE IDS
        //
        // IMPORTANT:
        // We now delete ONLY the IDs explicitly supplied
        // by the client.
        // ==================================================

        const removedVoiceNoteIdsValue =
            formData.get(
                "removedVoiceNoteIds"
            );

        let removedVoiceNoteIds: string[] =
            [];

        if (
            typeof removedVoiceNoteIdsValue ===
            "string"
        ) {
            try {
                const parsed =
                    JSON.parse(
                        removedVoiceNoteIdsValue
                    );

                if (
                    Array.isArray(
                        parsed
                    )
                ) {
                    removedVoiceNoteIds =
                        Array.from(
                            new Set(
                                parsed.filter(
                                    (
                                        id
                                    ): id is string =>
                                        typeof id ===
                                        "string" &&
                                        id.trim()
                                            .length >
                                            0
                                )
                            )
                        );
                }
            } catch {
                removedVoiceNoteIds =
                    [];
            }
        }

        // ==================================================
        // FIND ONLY THE VOICE NOTES THAT WERE EXPLICITLY
        // MARKED FOR DELETION
        // ==================================================

        const voiceNotesToDelete =
            removedVoiceNoteIds.length >
            0
                ? await prisma.taskSubmissionVoiceNote.findMany(
                      {
                          where: {
                              id: {
                                  in:
                                      removedVoiceNoteIds,
                              },

                              submissionId:
                                  submission.id,
                          },

                          select: {
                              id: true,

                              storageKey:
                                  true,
                          },
                      }
                  )
                : [];

        // ==================================================
        // READ NEW VOICE NOTE FILES
        // ==================================================

        const voiceNoteValues =
            formData.getAll(
                "voiceNotes"
            );

        const files =
            voiceNoteValues.filter(
                (
                    value
                ): value is File =>
                    value instanceof
                    File
            );

        // ==================================================
        // IMPORTANT:
        //
        // It is valid to have ZERO new files.
        //
        // Example:
        // Existing:
        //   A
        //   B
        //
        // User removes B and resubmits.
        //
        // There may be no new voice file.
        // We still need to process the deletion.
        // ==================================================

        if (
            files.length ===
                0 &&
            voiceNotesToDelete.length ===
                0
        ) {
            return NextResponse.json(
                {
                    message:
                        "No voice note changes were provided.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            files.length >
            MAX_VOICE_NOTES_PER_REQUEST
        ) {
            return NextResponse.json(
                {
                    message:
                        `You can upload a maximum of ${MAX_VOICE_NOTES_PER_REQUEST} voice notes at once.`,
                },
                {
                    status: 400,
                }
            );
        }

        // ==================================================
        // VALIDATE NEW FILES
        // ==================================================

        for (
            const file of files
        ) {
            if (
                file.size <= 0
            ) {
                return NextResponse.json(
                    {
                        message:
                            `Voice note "${file.name}" is empty.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                file.size >
                MAX_VOICE_NOTE_SIZE
            ) {
                return NextResponse.json(
                    {
                        message:
                            `Voice note "${file.name}" is larger than 10 MB.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                !isAllowedAudio(
                    file
                )
            ) {
                return NextResponse.json(
                    {
                        message:
                            `Unsupported audio format: ${file.name}`,
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        // ==================================================
        // DELETE REMOVED VOICE NOTES
        // ==================================================

        if (
            voiceNotesToDelete.length >
            0
        ) {
            // ----------------------------------------------
            // DELETE DATABASE RECORDS
            // ----------------------------------------------

            await prisma.taskSubmissionVoiceNote.deleteMany(
                {
                    where: {
                        id: {
                            in:
                                voiceNotesToDelete.map(
                                    (
                                        voiceNote
                                    ) =>
                                        voiceNote.id
                                ),
                        },

                        submissionId:
                            submission.id,
                    },
                }
            );

            // ----------------------------------------------
            // DELETE B2 FILES
            // ----------------------------------------------

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
        }

        // ==================================================
        // UPLOAD NEW VOICE NOTES
        // ==================================================

        const createdVoiceNotes =
            [];

        for (
            const file of files
        ) {
            const voiceNoteId =
                crypto.randomUUID();

            const extension =
                getExtension(file);

            const storageKey =
                `submissions/${submission.id}/${voiceNoteId}.${extension}`;

            const buffer =
                Buffer.from(
                    await file.arrayBuffer()
                );

            // ----------------------------------------------
            // B2
            // ----------------------------------------------

            await uploadVoiceNoteToB2(
                {
                    key:
                        storageKey,

                    body:
                        buffer,

                    contentType:
                        file.type ||
                        "application/octet-stream",

                    contentLength:
                        file.size,
                }
            );

            uploadedKeys.push(
                storageKey
            );

            // ----------------------------------------------
            // DATABASE
            // ----------------------------------------------

            const voiceNote =
                await prisma.taskSubmissionVoiceNote.create(
                    {
                        data: {
                            id:
                                voiceNoteId,

                            submissionId:
                                submission.id,

                            storageKey,

                            mimeType:
                                file.type ||
                                "application/octet-stream",

                            fileName:
                                getSafeFileName(
                                    file.name
                                ),

                            bytes:
                                file.size,
                        },

                        select: {
                            id: true,

                            submissionId:
                                true,

                            storageKey:
                                true,

                            mimeType:
                                true,

                            fileName:
                                true,

                            duration:
                                true,

                            bytes:
                                true,

                            createdAt:
                                true,
                        },
                    }
                );

            createdVoiceNotes.push(
                voiceNote
            );
        }

        // ==================================================
        // RESPONSE
        // ==================================================

        const remainingVoiceNotes =
            await prisma.taskSubmissionVoiceNote.findMany(
                {
                    where: {
                        submissionId:
                            submission.id,
                    },

                    orderBy: {
                        createdAt:
                            "asc",
                    },

                    select: {
                        id: true,

                        submissionId:
                            true,

                        storageKey:
                            true,

                        mimeType:
                            true,

                        fileName:
                            true,

                        duration:
                            true,

                        bytes:
                            true,

                        createdAt:
                            true,
                    },
                }
            );

        return NextResponse.json(
            {
                success: true,

                submissionId:
                    submission.id,

                voiceNotes:
                    remainingVoiceNotes,

                createdVoiceNotes,

                deletedVoiceNoteIds:
                    voiceNotesToDelete.map(
                        (
                            voiceNote
                        ) =>
                            voiceNote.id
                    ),
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "VOICE NOTE UPLOAD ERROR:",
            error
        );

        // ==================================================
        // CLEAN B2 ORPHANS
        // ==================================================

        if (
            uploadedKeys.length >
            0
        ) {
            await Promise.allSettled(
                uploadedKeys.map(
                    (
                        key
                    ) =>
                        deleteVoiceNoteFromB2(
                            key
                        )
                )
            );
        }

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to upload voice note.",
            },
            {
                status: 500,
            }
        );
    }
}