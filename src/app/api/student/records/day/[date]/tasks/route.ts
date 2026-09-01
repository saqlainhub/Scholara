
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

import { getVoiceNoteSignedUrl } from "@/lib/b2";

function isValidDateKey(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] =
        value.split("-").map(Number);

    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function parseDateKey(value: string) {
    const [year, month, day] =
        value.split("-").map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}

export const runtime = "nodejs";

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            date: string;
        }>;
    }
) {
    try {
        // =====================================================
        // AUTHENTICATION
        // =====================================================

        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        if (session.role !== "STUDENT") {
            return NextResponse.json(
                {
                    message: "Forbidden",
                },
                {
                    status: 403,
                }
            );
        }

        // =====================================================
        // DATE
        // =====================================================

        const { date: dateParam } = await params;

        if (!isValidDateKey(dateParam)) {
            return NextResponse.json(
                {
                    message: "Invalid date.",
                },
                {
                    status: 400,
                }
            );
        }

        const date = parseDateKey(dateParam);

        // =====================================================
        // GET HISTORICAL DAILY RECORD
        // =====================================================

        const dailyRecord =
            await prisma.dailyRecord.findUnique({
                where: {
                    studentId_date: {
                        studentId: session.id,
                        date,
                    },
                },

                include: {
                    tasks: {
                        orderBy: {
                            createdAt: "asc",
                        },

                        include: {
                            teacher: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                },
                            },

                            category: true,

                            submissions: {
                                orderBy: [
                                    {
                                        submittedAt: "desc",
                                    },
                                    {
                                        id: "desc",
                                    },
                                ],

                                take: 1,

                                include: {
                                    media: true,

                                    voiceNotes: true,
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
                    },
                },
            });

        // =====================================================
        // NO RECORD
        // =====================================================

        if (!dailyRecord) {
            return NextResponse.json({
                date: dateParam,
                isWorking: false,
                categories: [],
            });
        }

        // =====================================================
        // PREPARE HISTORICAL TASKS
        // =====================================================
        //
        // Voice notes are stored in B2.
        //
        // PostgreSQL contains:
        //
        //     storageKey
        //
        // Example:
        //
        // submissions/<submissionId>/<voiceId>.webm
        //
        // The browser cannot play this storageKey directly.
        //
        // We therefore generate a temporary signed B2 URL
        // for every voice note.
        //
        // The URL is valid for 1 hour because that is the
        // expiration configured in getVoiceNoteSignedUrl().
        //
        // =====================================================

        const preparedTasks = await Promise.all(
            dailyRecord.tasks.map(
                async (task) => {
                    const preparedSubmissions =
                        await Promise.all(
                            task.submissions.map(
                                async (
                                    submission
                                ) => {
                                    const preparedVoiceNotes =
                                        await Promise.all(
                                            submission.voiceNotes.map(
                                                async (
                                                    voice
                                                ) => {
                                                    let url:
                                                        | string
                                                        | null =
                                                        null;

                                                    try {
                                                        if (
                                                            voice.storageKey
                                                        ) {
                                                            url =
                                                                await getVoiceNoteSignedUrl(
                                                                    voice.storageKey
                                                                );
                                                        }
                                                    } catch (
                                                        error
                                                    ) {
                                                        console.error(
                                                            "FAILED TO GENERATE VOICE SIGNED URL:",
                                                            {
                                                                voiceNoteId:
                                                                    voice.id,

                                                                storageKey:
                                                                    voice.storageKey,

                                                                error,
                                                            }
                                                        );
                                                    }

                                                    return {
                                                        ...voice,

                                                        /*
                                                         * Browser playback URL.
                                                         */
                                                        url,
                                                    };
                                                }
                                            )
                                        );

                                    return {
                                        ...submission,

                                        voiceNotes:
                                            preparedVoiceNotes,
                                    };
                                }
                            )
                        );

                    return {
                        ...task,

                        submissions:
                            preparedSubmissions,
                    };
                }
            )
        );

        // =====================================================
        // DEBUG VOICE DATA
        // =====================================================
        //
        // Keep this temporarily while testing.
        // You can remove it after playback works.
        //
        // =====================================================

        console.log(
            "===== HISTORICAL VOICE URL DEBUG ====="
        );

        for (
            const task of preparedTasks
        ) {
            for (
                const submission of
                task.submissions
            ) {
                for (
                    const voice of
                    submission.voiceNotes
                ) {
                    console.log({
                        voiceNoteId:
                            voice.id,

                        storageKey:
                            voice.storageKey,

                        urlExists:
                            Boolean(
                                voice.url
                            ),

                        urlPreview:
                            voice.url
                                ? voice.url.slice(
                                      0,
                                      100
                                  )
                                : null,

                        mimeType:
                            voice.mimeType,

                        duration:
                            voice.duration,
                    });
                }
            }
        }

        console.log(
            "======================================"
        );

        // =====================================================
        // GROUP TASKS BY CATEGORY
        // =====================================================

        const categoryMap =
            new Map<
                string,
                {
                    id: string;
                    name: string;
                    sortOrder: number;
                    tasks: typeof preparedTasks;
                }
            >();

        for (
            const task of preparedTasks
        ) {
            const category =
                task.category;

            if (
                !categoryMap.has(
                    category.id
                )
            ) {
                categoryMap.set(
                    category.id,
                    {
                        id: category.id,

                        name:
                            category.name,

                        sortOrder:
                            categoryMap.size,

                        tasks: [],
                    }
                );
            }

            categoryMap
                .get(category.id)!
                .tasks.push(task);
        }

        const categories =
            Array.from(
                categoryMap.values()
            );

        // =====================================================
        // RESPONSE
        // =====================================================

        return NextResponse.json({
            date: dateParam,

            isWorking:
                dailyRecord.isWorking,

            categories,
        });
    } catch (error) {
        console.error(
            "HISTORICAL DAY TASKS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load historical tasks.",
            },
            {
                status: 500,
            }
        );
    }
}

