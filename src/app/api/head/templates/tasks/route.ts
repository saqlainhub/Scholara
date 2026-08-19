import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TaskInput = {
    title?: string;
    description?: string;
    deadline?: string;
    difficulty?: number;
    teacherId?: string;
};

type CategoryInput = {
    name?: string;
    tasks?: TaskInput[];
};

// ==========================================================
// GET
// List all task templates
// ==========================================================

export async function GET() {
    try {
        const templates =
            await prisma.taskTemplate.findMany({
                orderBy: {
                    createdAt: "desc",
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

        return NextResponse.json(
            {
                templates,
            },
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            "GET TASK TEMPLATES ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load task templates.",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================================
// POST
// Create task template
// ==========================================================

export async function POST(
    request: Request
) {
    try {
        const body = await request.json();

        const name =
            typeof body.name === "string"
                ? body.name.trim()
                : "";

        const categories: CategoryInput[] =
            Array.isArray(body.categories)
                ? body.categories
                : [];

        // ======================================================
        // VALIDATE TEMPLATE NAME
        // ======================================================

        if (!name) {
            return NextResponse.json(
                {
                    message:
                        "Template name is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (name.length > 100) {
            return NextResponse.json(
                {
                    message:
                        "Template name cannot exceed 100 characters.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // VALIDATE CATEGORIES
        // ======================================================

        if (categories.length === 0) {
            return NextResponse.json(
                {
                    message:
                        "At least one category is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // CLEAN CATEGORIES + TASKS
        // ======================================================

        const cleanedCategories =
            categories
                .map(
                    (
                        category,
                        categoryIndex
                    ) => {
                        const categoryName =
                            typeof category.name ===
                            "string"
                                ? category.name.trim()
                                : "";

                        const tasks =
                            Array.isArray(
                                category.tasks
                            )
                                ? category.tasks
                                : [];

                        return {
                            name: categoryName,

                            sortOrder:
                                categoryIndex,

                            tasks: tasks.map(
                                (
                                    task,
                                    taskIndex
                                ) => {
                                    const difficulty =
                                        Number(
                                            task.difficulty
                                        );

                                    return {
                                        title:
                                            typeof task.title ===
                                            "string"
                                                ? task.title.trim()
                                                : "",

                                        description:
                                            typeof task.description ===
                                            "string"
                                                ? task.description.trim()
                                                : null,

                                        deadline:
                                            typeof task.deadline ===
                                                "string" &&
                                            task.deadline.trim()
                                                ? task.deadline.trim()
                                                : null,

                                        difficulty:
                                            difficulty >=
                                                1 &&
                                            difficulty <=
                                                5
                                                ? Math.floor(
                                                      difficulty
                                                  )
                                                : 1,

                                        teacherId:
                                            typeof task.teacherId ===
                                            "string"
                                                ? task.teacherId
                                                : "",

                                        sortOrder:
                                            taskIndex,
                                    };
                                }
                            ),
                        };
                    }
                )
                .filter(
                    (category) =>
                        category.name
                );

        if (
            cleanedCategories.length ===
            0
        ) {
            return NextResponse.json(
                {
                    message:
                        "At least one valid category is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // VALIDATE TASKS
        // ======================================================

        for (const category of cleanedCategories) {
            for (const task of category.tasks) {
                if (!task.title) {
                    return NextResponse.json(
                        {
                            message:
                                "Every task must have a title.",
                        },
                        {
                            status: 400,
                        }
                    );
                }

                if (task.title.length > 200) {
                    return NextResponse.json(
                        {
                            message:
                                `Task title "${task.title}" cannot exceed 200 characters.`,
                        },
                        {
                            status: 400,
                        }
                    );
                }

                if (!task.teacherId) {
                    return NextResponse.json(
                        {
                            message:
                                `Please select a teacher for task "${task.title}".`,
                        },
                        {
                            status: 400,
                        }
                    );
                }

                if (
                    task.difficulty < 1 ||
                    task.difficulty > 5
                ) {
                    return NextResponse.json(
                        {
                            message:
                                `Difficulty for task "${task.title}" must be between 1 and 5.`,
                        },
                        {
                            status: 400,
                        }
                    );
                }
            }
        }

        // ======================================================
        // GET UNIQUE TEACHER IDS
        // ======================================================

        const teacherIds = Array.from(
            new Set(
                cleanedCategories.flatMap(
                    (category) =>
                        category.tasks.map(
                            (task) =>
                                task.teacherId
                        )
                )
            )
        );

        // ======================================================
        // VALIDATE TEACHERS
        // ======================================================

        const teachers =
            await prisma.user.findMany({
                where: {
                    id: {
                        in: teacherIds,
                    },
                    role: "TEACHER",
                },
                select: {
                    id: true,
                },
            });

        const validTeacherIds =
            new Set(
                teachers.map(
                    (teacher) =>
                        teacher.id
                )
            );

        for (const teacherId of teacherIds) {
            if (
                !validTeacherIds.has(
                    teacherId
                )
            ) {
                return NextResponse.json(
                    {
                        message:
                            "One or more selected teachers are invalid.",
                    },
                    {
                        status: 400,
                    }
                );
            }
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
        // CREATE TEMPLATE + CATEGORIES + TASKS
        //
        // We intentionally create the template first.
        // This avoids the Prisma relation error caused by
        // trying to create TaskTemplateItem records before
        // the template ID exists.
        // ======================================================

        const createdTemplate =
            await prisma.$transaction(
                async (tx) => {
                    const template =
                        await tx.taskTemplate.create(
                            {
                                data: {
                                    name,

                                    createdById:
                                        headUser.id,
                                },
                            }
                        );

                    for (
                        const category
                        of cleanedCategories
                    ) {
                        const createdCategory =
                            await tx.taskTemplateCategory.create(
                                {
                                    data: {
                                        templateId:
                                            template.id,

                                        name:
                                            category.name,

                                        sortOrder:
                                            category.sortOrder,
                                    },
                                }
                            );

                        for (
                            const task
                            of category.tasks
                        ) {
                            await tx.taskTemplateItem.create(
                                {
                                    data: {
                                        templateId:
                                            template.id,

                                        categoryId:
                                            createdCategory.id,

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

                    return template;
                }
            );

        // ======================================================
        // LOAD COMPLETE CREATED TEMPLATE
        // ======================================================

        const completeTemplate =
            await prisma.taskTemplate.findUnique(
                {
                    where: {
                        id: createdTemplate.id,
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
                    "Task template created successfully.",

                template:
                    completeTemplate,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "CREATE TASK TEMPLATE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to create task template.",
            },
            {
                status: 500,
            }
        );
    }
}