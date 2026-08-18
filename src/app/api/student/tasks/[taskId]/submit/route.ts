import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    if (
        !Array.isArray(value)
    ) {
        return [];
    }

    return value.filter(
        (
            item: unknown
        ): item is SubmittedMediaInput =>
            typeof item ===
                "object" &&
            item !== null &&
            typeof (
                item as SubmittedMediaInput
            ).url === "string"
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
        // FIND EXACT TASK
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

        let requestedMedia: SubmittedMediaInput[] =
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

            const noteValue =
                formData.get("note");

            note =
                typeof noteValue ===
                "string"
                    ? noteValue
                    : "";

            const mediaValue =
                formData.get("media");

            if (
                typeof mediaValue ===
                "string"
            ) {
                try {
                    const parsed =
                        JSON.parse(
                            mediaValue
                        );

                    requestedMedia =
                        parseMedia(
                            parsed
                        );
                } catch {
                    requestedMedia =
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
        // UPDATE CURRENT SUBMISSION
        // =====================================================
        //
        // IMPORTANT:
        //
        // We no longer create a new submission
        // for every resubmit.
        //
        // We update the latest submission
        // belonging to THIS EXACT TASK.
        //
        // =====================================================

        const result =
            await prisma.$transaction(
                async (tx) => {
                    const existingSubmission =
                        await tx.taskSubmission.findFirst(
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

                    let submission;

                    if (
                        existingSubmission
                    ) {
                        // =========================================
                        // DELETE OLD MEDIA
                        // =========================================

                        await tx.taskSubmissionMedia.deleteMany(
                            {
                                where: {
                                    submissionId:
                                        existingSubmission.id,
                                },
                            }
                        );

                        // =========================================
                        // UPDATE EXISTING SUBMISSION
                        // =========================================

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
                                    },
                                }
                            );
                    } else {
                        // =========================================
                        // FIRST SUBMISSION
                        // =========================================

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
                                    },
                                }
                            );
                    }

                    // =========================================
                    // UPDATE TASK
                    // =========================================

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