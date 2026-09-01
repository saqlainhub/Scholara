import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

import {
    getPakistanDate,
    getPakistanDay,
} from "@/lib/student-day";

import {
    getVoiceNoteSignedUrl,
} from "@/lib/b2";

export const runtime = "nodejs";

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

// ==========================================================
// DATE HELPERS
// ==========================================================

function isValidDateString(
    value: string
): boolean {
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {
        return false;
    }

    const [
        year,
        month,
        day,
    ] = value
        .split("-")
        .map(Number);

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    return (
        date.getUTCFullYear() ===
        year &&
        date.getUTCMonth() ===
        month - 1 &&
        date.getUTCDate() ===
        day
    );
}

function createPakistanDate(
    dateString: string
): Date {
    const [
        year,
        month,
        day,
    ] = dateString
        .split("-")
        .map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}

function getDayOfWeekFromDate(
    dateString: string
): DayOfWeek {
    const date =
        createPakistanDate(
            dateString
        );

    const days: DayOfWeek[] = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
    ];

    return days[
        date.getUTCDay()
    ];
}

function createDeadline(
    date: string,
    time: string | null
): Date | null {
    if (!time) {
        return null;
    }

    const parts =
        time.split(":");

    if (
        parts.length !== 2
    ) {
        return null;
    }

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return new Date(
        `${date}T${String(
            hours
        ).padStart(
            2,
            "0"
        )}:${String(
            minutes
        ).padStart(
            2,
            "0"
        )}:00+05:00`
    );
}

// ==========================================================
// ADD SIGNED URLS TO VOICE NOTES
// ==========================================================
//
// B2 voice notes are stored separately from
// Cloudinary submission media.
//
// This converts:
//
// voiceNotes[]
//
// into media-compatible objects:
//
// {
//     url,
//     publicId,
//     resourceType,
//     format,
//     mimeType,
//     size,
//     fileName,
//     duration
// }
//
// This allows the existing frontend to use:
//
// submission.media
//
// for BOTH Cloudinary files and B2 audio.
// ==========================================================

async function attachVoiceNotesToSubmissions<
    T extends {
        media: any[];
        voiceNotes: Array<{
            id: string;
            submissionId: string;
            storageKey: string;
            mimeType: string;
            fileName: string;
            duration: number | null;
            bytes: number | null;
            createdAt: Date;
        }>;
    }
>(
    submissions: T[]
) {
    return Promise.all(
        submissions.map(
            async (submission) => {
                if (
                    !submission.voiceNotes.length
                ) {
                    return submission;
                }

                const voiceMedia =
                    await Promise.all(
                        submission.voiceNotes.map(
                            async (voiceNote) => {
                                let url: string;

                                try {
                                    url =
                                        await getVoiceNoteSignedUrl(
                                            voiceNote.storageKey
                                        );
                                } catch (error) {
                                    console.error(
                                        "FAILED TO GENERATE B2 SIGNED URL:",
                                        {
                                            voiceNoteId:
                                                voiceNote.id,

                                            storageKey:
                                                voiceNote.storageKey,

                                            error,
                                        }
                                    );

                                    return null;
                                }

                                const format =
                                    voiceNote.fileName
                                        .split(".")
                                        .pop()
                                        ?.toLowerCase() ||
                                    "audio";

                                return {
                                    url,

                                    publicId:
                                        voiceNote.storageKey,

                                    resourceType:
                                        "audio",

                                    format,

                                    mimeType:
                                        voiceNote.mimeType,

                                    fileName:
                                        voiceNote.fileName,

                                    bytes:
                                        voiceNote.bytes ??
                                        0,

                                    // IMPORTANT
                                    // Preserve the database voice-note ID.
                                    id:
                                        voiceNote.id,

                                    voiceNoteId:
                                        voiceNote.id,

                                    storageKey:
                                        voiceNote.storageKey,

                                    duration:
                                        voiceNote.duration,

                                    createdAt:
                                        voiceNote.createdAt,
                                };
                            }
                        )
                    );

                const validVoiceMedia =
                    voiceMedia.filter(
                        (
                            media
                        ): media is NonNullable<
                            typeof media
                        > =>
                            media !== null
                    );

                return {
                    ...submission,

                    media: [
                        ...submission.media,
                        ...validVoiceMedia,
                    ],
                };
            }
        )
    );
}

// ==========================================================
// LOAD TASKS
// ==========================================================

async function loadTasks(
    studentId: string,
    dateString: string
) {
    if (
        !isValidDateString(
            dateString
        )
    ) {
        throw new Error(
            "Invalid date."
        );
    }

    // ======================================================
    // DETERMINE DAY
    // ======================================================

    const dayOfWeek =
        getDayOfWeekFromDate(
            dateString
        );

    // ======================================================
    // LOAD WEEKLY ASSIGNMENT
    // ======================================================

    const assignment =
        await prisma.studentWeeklyTemplateAssignment.findFirst(
            {
                where: {
                    studentId,
                    dayOfWeek,
                },

                include: {
                    taskTemplate: {
                        select: {
                            id: true,
                            name: true,

                            categories: {
                                orderBy: {
                                    sortOrder:
                                        "asc",
                                },

                                include: {
                                    tasks: {
                                        orderBy: {
                                            sortOrder:
                                                "asc",
                                        },

                                        select: {
                                            id: true,
                                            title: true,
                                            description:
                                                true,
                                            deadline:
                                                true,
                                            difficulty:
                                                true,
                                            teacherId:
                                                true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }
        );

    // ======================================================
    // OFF DAY
    // ======================================================

    if (!assignment) {
        return {
            template: null,
            categories: [],
            isWorking: false,
            dayType:
                "OFF" as const,
            dayOfWeek,
        };
    }

    // ======================================================
    // WORKING DAY WITHOUT TASK TEMPLATE
    // ======================================================

    if (
        !assignment.taskTemplate
    ) {
        return {
            template: null,
            categories: [],
            isWorking: true,
            dayType:
                "WORKING" as const,
            dayOfWeek,
        };
    }

    // ======================================================
    // DATE
    // ======================================================

    const date =
        createPakistanDate(
            dateString
        );

    const currentTemplateId =
        assignment.taskTemplate.id;

    // ======================================================
    // LOAD DAILY RECORD
    // ======================================================

    const existingDailyRecord =
        await prisma.dailyRecord.findUnique(
            {
                where: {
                    studentId_date: {
                        studentId,
                        date,
                    },
                },
            }
        );

    let dailyRecord:
        NonNullable<
            typeof existingDailyRecord
        >;

    // ======================================================
    // CREATE DAILY RECORD
    // ======================================================

    if (!existingDailyRecord) {
        dailyRecord =
            await prisma.dailyRecord.create(
                {
                    data: {
                        studentId,
                        date,
                        isWorking: true,
                        taskTemplateId:
                            currentTemplateId,
                    },
                }
            );
    } else {
        dailyRecord =
            existingDailyRecord;

        // ==================================================
        // MAKE SURE WORKING STATUS IS CORRECT
        // ==================================================

        if (
            !dailyRecord.isWorking
        ) {
            dailyRecord =
                await prisma.dailyRecord.update(
                    {
                        where: {
                            id:
                                dailyRecord.id,
                        },

                        data: {
                            isWorking:
                                true,
                        },
                    }
                );
        }
    }

    // ======================================================
    // DETECT TEMPLATE CHANGE
    // ======================================================

    const previousTemplateId =
        dailyRecord.taskTemplateId;

    const templateChanged =
        previousTemplateId !==
        currentTemplateId;

    // ======================================================
    // REPLACE TASKS WHEN TEMPLATE CHANGES
    // ======================================================

    if (templateChanged) {
        await prisma.$transaction(
            async (tx) => {
                await tx.task.deleteMany(
                    {
                        where: {
                            dailyRecordId:
                                dailyRecord.id,

                            studentId,
                        },
                    }
                );

                await tx.dailyRecord.update(
                    {
                        where: {
                            id:
                                dailyRecord.id,
                        },

                        data: {
                            taskTemplateId:
                                currentTemplateId,

                            isWorking:
                                true,
                        },
                    }
                );
            }
        );

        dailyRecord =
            await prisma.dailyRecord.findUniqueOrThrow(
                {
                    where: {
                        id:
                            dailyRecord.id,
                    },
                }
            );
    }

    // ======================================================
    // GENERATE TASKS
    // ======================================================

    const categories = [];

    for (
        const templateCategory of
        assignment
            .taskTemplate
            .categories
    ) {
        // ==================================================
        // FIND / CREATE CATEGORY
        // ==================================================

        let category =
            await prisma.taskCategory.findFirst(
                {
                    where: {
                        name:
                            templateCategory.name,
                    },
                }
            );

        if (!category) {
            category =
                await prisma.taskCategory.create(
                    {
                        data: {
                            name:
                                templateCategory.name,
                        },
                    }
                );
        }

        // ==================================================
        // LOAD EXISTING TASKS
        // ==================================================

        const existingTasks =
            await prisma.task.findMany(
                {
                    where: {
                        dailyRecordId:
                            dailyRecord.id,

                        studentId,

                        categoryId:
                            category.id,
                    },

                    orderBy: [
                        {
                            createdAt:
                                "desc",
                        },

                        {
                            id:
                                "desc",
                        },
                    ],

                    include: {
                        teacher: {
                            select: {
                                id: true,
                                name: true,
                                username:
                                    true,
                            },
                        },

                        category: true,

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
                                media: true,

                                voiceNotes: {
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
                                },
                            },
                        },

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

        // ==================================================
        // ADD B2 SIGNED URLS
        // ==================================================

        const tasksWithVoiceUrls =
            await Promise.all(
                existingTasks.map(
                    async (task) => {
                        const submissionsWithVoiceUrls =
                            await attachVoiceNotesToSubmissions(
                                task.submissions
                            );

                        return {
                            ...task,

                            submissions:
                                submissionsWithVoiceUrls,
                        };
                    }
                )
            );

        const tasks = [];

        // ==================================================
        // CREATE / REUSE TASKS
        // ==================================================

        for (
            const templateTask of
            templateCategory.tasks
        ) {
            let task =
                tasksWithVoiceUrls.find(
                    (
                        existingTask
                    ) =>
                        existingTask.title ===
                        templateTask.title
                );

            // ==================================================
            // CREATE NEW TASK
            // ==================================================

            if (!task) {
                task =
                    await prisma.task.create(
                        {
                            data: {
                                dailyRecordId:
                                    dailyRecord.id,

                                studentId,

                                teacherId:
                                    templateTask.teacherId,

                                categoryId:
                                    category.id,

                                title:
                                    templateTask.title,

                                description:
                                    templateTask.description,

                                deadline:
                                    createDeadline(
                                        dateString,
                                        templateTask.deadline
                                    ),

                                difficulty:
                                    templateTask.difficulty,
                            },

                            include: {
                                teacher: {
                                    select: {
                                        id: true,
                                        name: true,
                                        username:
                                            true,
                                    },
                                },

                                category: true,

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
                                        media: true,

                                        voiceNotes: {
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
                                        },
                                    },
                                },

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

                // ==================================================
                // ADD B2 SIGNED URLS TO NEW TASK
                // ==================================================

                const submissionsWithVoiceUrls =
                    await attachVoiceNotesToSubmissions(
                        task.submissions
                    );

                task = {
                    ...task,

                    submissions:
                        submissionsWithVoiceUrls,
                };
            }

            tasks.push(task);
        }

        categories.push({
            id:
                category.id,

            name:
                category.name,

            sortOrder:
                templateCategory.sortOrder,

            tasks,
        });
    }

    // ======================================================
    // RETURN
    // ======================================================

    return {
        template: {
            id:
                assignment
                    .taskTemplate.id,

            name:
                assignment
                    .taskTemplate.name,
        },

        categories,

        isWorking: true,

        dayType:
            "WORKING" as const,

        dayOfWeek,
    };
}

// ==========================================================
// GET
// ==========================================================

export async function GET(
    request: NextRequest
) {
    try {
        const session =
            await getSession();

        // ==================================================
        // AUTH
        // ==================================================

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

        // ==================================================
        // STUDENT ONLY
        // ==================================================

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
        // REQUESTED DATE
        // ==================================================

        const requestedDate =
            request.nextUrl.searchParams.get(
                "date"
            );

        const dateString =
            requestedDate &&
                isValidDateString(
                    requestedDate
                )
                ? requestedDate
                : getPakistanDate();

        // ==================================================
        // LOAD
        // ==================================================

        const data =
            await loadTasks(
                session.id,
                dateString
            );

        // ==================================================
        // RESPONSE
        // ==================================================

        return NextResponse.json({
            currentDay:
                getPakistanDay(),

            selectedDay:
                data.dayOfWeek,

            selectedDate:
                dateString,

            ...data,
        });
    } catch (error) {
        console.error(
            "STUDENT TASK GET ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load tasks.",
            },
            {
                status: 500,
            }
        );
    }
}