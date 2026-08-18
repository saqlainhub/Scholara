import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = {
    params: Promise<{
        studentId: string;
    }>;
};

export async function GET(
    _request: Request,
    { params }: Params
) {
    try {
        const { studentId } =
            await params;

        if (!studentId) {
            return NextResponse.json(
                {
                    message:
                        "Student ID is missing.",
                },
                {
                    status: 400,
                }
            );
        }

        const student =
            await prisma.user.findFirst({
                where: {
                    id: studentId,
                    role: "STUDENT",
                },
                select: {
                    id: true,
                },
            });

        if (!student) {
            return NextResponse.json(
                {
                    message:
                        "Student not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const [
            plans,
            routineTemplates,
            taskTemplates,
        ] = await Promise.all([
            prisma.studentWeeklyTemplateAssignment.findMany(
                {
                    where: {
                        studentId,
                    },
                    include: {
                        routineTemplate: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        taskTemplate: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                }
            ),

            prisma.routineTemplate.findMany({
                orderBy: {
                    name: "asc",
                },
                include: {
                    items: {
                        orderBy: {
                            sortOrder: "asc",
                        },
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            startTime: true,
                            endTime: true,
                            durationMin: true,
                            sortOrder: true,
                        },
                    },
                },
            }),

            prisma.taskTemplate.findMany({
                orderBy: {
                    name: "asc",
                },
                include: {
                    categories: {
                        orderBy: {
                            sortOrder: "asc",
                        },
                        include: {
                            tasks: {
                                orderBy: {
                                    sortOrder: "asc",
                                },
                                select: {
                                    id: true,
                                    title: true,
                                    description: true,
                                    deadline: true,
                                    difficulty: true,
                                    sortOrder: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            plans,
            routineTemplates,
            taskTemplates,
        });
    } catch (error) {
        console.error(
            "GET STUDENT PLANS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load student plans.",
            },
            {
                status: 500,
            }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: Params
) {
    try {
        const { studentId } =
            await params;

        if (!studentId) {
            return NextResponse.json(
                {
                    message:
                        "Student ID is missing.",
                },
                {
                    status: 400,
                }
            );
        }

        const body =
            await request.json();

        const assignments =
            Array.isArray(
                body.assignments
            )
                ? body.assignments
                : [];

        const student =
            await prisma.user.findFirst({
                where: {
                    id: studentId,
                    role: "STUDENT",
                },
                select: {
                    id: true,
                },
            });

        if (!student) {
            return NextResponse.json(
                {
                    message:
                        "Student not found.",
                },
                {
                    status: 404,
                }
            );
        }

        const validDays = new Set([
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
        ]);

        for (
            const assignment of assignments
        ) {
            if (
                !validDays.has(
                    assignment.dayOfWeek
                )
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Invalid day of week.",
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        await prisma.$transaction(
            async (tx) => {
                for (
                    const assignment of assignments
                ) {
                    const routineTemplateId =
                        assignment
                            .routineTemplateId ||
                        null;

                    const taskTemplateId =
                        assignment
                            .taskTemplateId ||
                        null;

                    if (
                        !routineTemplateId &&
                        !taskTemplateId
                    ) {
                        await tx.studentWeeklyTemplateAssignment.deleteMany(
                            {
                                where: {
                                    studentId,
                                    dayOfWeek:
                                        assignment.dayOfWeek,
                                },
                            }
                        );

                        continue;
                    }

                    await tx.studentWeeklyTemplateAssignment.upsert(
                        {
                            where: {
                                studentId_dayOfWeek:
                                    {
                                        studentId,
                                        dayOfWeek:
                                            assignment.dayOfWeek,
                                    },
                            },
                            create: {
                                studentId,
                                dayOfWeek:
                                    assignment.dayOfWeek,
                                routineTemplateId,
                                taskTemplateId,
                            },
                            update: {
                                routineTemplateId,
                                taskTemplateId,
                            },
                        }
                    );
                }
            }
        );

        const plans =
            await prisma.studentWeeklyTemplateAssignment.findMany(
                {
                    where: {
                        studentId,
                    },
                    include: {
                        routineTemplate: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        taskTemplate: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        dayOfWeek: "asc",
                    },
                }
            );

        return NextResponse.json({
            message:
                "Weekly assignments saved successfully.",
            plans,
        });
    } catch (error) {
        console.error(
            "SAVE STUDENT PLANS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to save student plans.",
            },
            {
                status: 500,
            }
        );
    }
}