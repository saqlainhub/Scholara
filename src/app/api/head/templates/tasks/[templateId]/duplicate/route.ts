import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================================
// DUPLICATE TASK TEMPLATE
// ==========================================================

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            templateId: string;
        }>;
    }
) {
    try {
        const { templateId } =
            await context.params;

        if (!templateId) {
            return NextResponse.json(
                {
                    message:
                        "Template ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // LOAD ORIGINAL TEMPLATE
        // ======================================================

        const originalTemplate =
            await prisma.taskTemplate.findUnique(
                {
                    where: {
                        id: templateId,
                    },

                    include: {
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
                                },
                            },
                        },
                    },
                }
            );

        if (!originalTemplate) {
            return NextResponse.json(
                {
                    message:
                        "Task template not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ======================================================
        // FIND UNIQUE DUPLICATE NAME
        //
        // Example:
        //
        // Mathematics
        // Mathematics (2)
        // Mathematics (3)
        // Mathematics (4)
        // ======================================================

        const baseName =
            originalTemplate.name.trim();

        const existingTemplates =
            await prisma.taskTemplate.findMany({
                where: {
                    OR: [
                        {
                            name: baseName,
                        },
                        {
                            name: {
                                startsWith:
                                    `${baseName} (`,
                            },
                        },
                    ],
                },

                select: {
                    name: true,
                },
            });

        const existingNames =
            new Set(
                existingTemplates.map(
                    (template) =>
                        template.name
                )
            );

        let duplicateName =
            `${baseName} (2)`;

        let duplicateNumber = 2;

        while (
            existingNames.has(
                duplicateName
            )
        ) {
            duplicateNumber++;

            duplicateName =
                `${baseName} (${duplicateNumber})`;
        }

        // ======================================================
        // FIND HEAD USER
        // ======================================================

        const headUser =
            await prisma.user.findFirst({
                where: {
                    role: "HEAD",
                },

                orderBy: {
                    createdAt: "asc",
                },

                select: {
                    id: true,
                },
            });

        if (!headUser) {
            return NextResponse.json(
                {
                    message:
                        "No HEAD user exists in the database.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // DUPLICATE EVERYTHING
        // ======================================================

        const duplicatedTemplate =
            await prisma.$transaction(
                async (tx) => {
                    // ------------------------------------------
                    // CREATE NEW TEMPLATE
                    // ------------------------------------------

                    const newTemplate =
                        await tx.taskTemplate.create(
                            {
                                data: {
                                    name:
                                        duplicateName,

                                    createdById:
                                        headUser.id,
                                },
                            }
                        );

                    // ------------------------------------------
                    // CREATE CATEGORIES
                    // ------------------------------------------

                    for (
                        const category
                        of originalTemplate.categories
                    ) {
                        const newCategory =
                            await tx.taskTemplateCategory.create(
                                {
                                    data: {
                                        templateId:
                                            newTemplate.id,

                                        name:
                                            category.name,

                                        sortOrder:
                                            category.sortOrder,
                                    },
                                }
                            );

                        // --------------------------------------
                        // CREATE TASKS
                        // --------------------------------------

                        for (
                            const task
                            of category.tasks
                        ) {
                            await tx.taskTemplateItem.create(
                                {
                                    data: {
                                        templateId:
                                            newTemplate.id,

                                        categoryId:
                                            newCategory.id,

                                        teacherId:
                                            task.teacherId,

                                        title:
                                            task.title,

                                        description:
                                            task.description,

                                        deadline:
                                            task.deadline,

                                        difficulty:
                                            task.difficulty,

                                        sortOrder:
                                            task.sortOrder,
                                    },
                                }
                            );
                        }
                    }

                    return newTemplate;
                }
            );

        // ======================================================
        // LOAD COMPLETE DUPLICATED TEMPLATE
        // ======================================================

        const completeTemplate =
            await prisma.taskTemplate.findUnique(
                {
                    where: {
                        id: duplicatedTemplate.id,
                    },

                    include: {
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
                }
            );

        return NextResponse.json(
            {
                message:
                    "Task template duplicated successfully.",

                template:
                    completeTemplate,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "DUPLICATE TASK TEMPLATE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to duplicate task template.",
            },
            {
                status: 500,
            }
        );
    }
}