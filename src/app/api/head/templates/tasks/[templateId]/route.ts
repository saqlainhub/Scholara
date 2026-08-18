import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    templateId: string;
  }>;
};

type CleanedTask = {
  title: string;
  description: string | null;
  deadline: string | null;
  difficulty: number;
  teacherId: string;
  sortOrder: number;
};

type CleanedCategory = {
  name: string;
  sortOrder: number;
  tasks: CleanedTask[];
};

// ==========================================================
// GET — VIEW SINGLE TASK TEMPLATE
// ==========================================================

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { templateId } = await params;

    console.log(
      "GET TASK TEMPLATE ID:",
      templateId
    );

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

    const template =
      await prisma.taskTemplate.findUnique({
        where: {
          id: templateId,
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

    console.log(
      "GET TASK TEMPLATE RESULT:",
      template
        ? {
            id: template.id,
            name: template.name,
          }
        : null
    );

    if (!template) {
      return NextResponse.json(
        {
          message:
            "Task template not found.",
          templateId,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      template,
    });
  } catch (error) {
    console.error(
      "GET SINGLE TASK TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to load task template.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================================
// DELETE — DELETE TASK TEMPLATE
// ==========================================================

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        {
          message: "Template ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const existingTemplate =
      await prisma.taskTemplate.findUnique({
        where: {
          id: templateId,
        },
        select: {
          id: true,
        },
      });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          message: "Task template not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.taskTemplate.delete({
      where: {
        id: templateId,
      },
    });

    return NextResponse.json({
      message:
        "Task template deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE TASK TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to delete task template.",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================================
// PUT — UPDATE TASK TEMPLATE
// ==========================================================

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { templateId } = await params;

    if (!templateId) {
      return NextResponse.json(
        {
          message: "Template ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const categories = Array.isArray(
      body.categories
    )
      ? body.categories
      : [];

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

    // ======================================================
    // CHECK TEMPLATE EXISTS
    // ======================================================

    const existingTemplate =
      await prisma.taskTemplate.findUnique({
        where: {
          id: templateId,
        },
        select: {
          id: true,
        },
      });

    if (!existingTemplate) {
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
    // CLEAN AND VALIDATE CATEGORIES + TASKS
    // ======================================================

    const cleanedCategories: CleanedCategory[] =
      categories
        .map(
          (
            category: unknown,
            categoryIndex: number
          ): CleanedCategory => {
            const categoryObject =
              category as {
                name?: unknown;
                tasks?: unknown;
              };

            const categoryName =
              typeof categoryObject.name ===
              "string"
                ? categoryObject.name.trim()
                : "";

            const tasks = Array.isArray(
              categoryObject.tasks
            )
              ? categoryObject.tasks
              : [];

            return {
              name: categoryName,
              sortOrder: categoryIndex,

              tasks: tasks
                .map(
                  (
                    task: unknown,
                    taskIndex: number
                  ): CleanedTask => {
                    const taskObject =
                      task as {
                        title?: unknown;
                        description?: unknown;
                        deadline?: unknown;
                        difficulty?: unknown;
                        teacherId?: unknown;
                      };

                    const difficulty =
                      Number(
                        taskObject.difficulty
                      );

                    return {
                      title:
                        typeof taskObject.title ===
                        "string"
                          ? taskObject.title.trim()
                          : "",

                      description:
                        typeof taskObject.description ===
                          "string" &&
                        taskObject.description.trim()
                          ? taskObject.description.trim()
                          : null,

                      deadline:
                        typeof taskObject.deadline ===
                          "string" &&
                        taskObject.deadline.trim()
                          ? taskObject.deadline.trim()
                          : null,

                      difficulty:
                        Number.isInteger(
                          difficulty
                        ) &&
                        difficulty >= 1 &&
                        difficulty <= 5
                          ? difficulty
                          : 1,

                      teacherId:
                        typeof taskObject.teacherId ===
                        "string"
                          ? taskObject.teacherId
                          : "",

                      sortOrder: taskIndex,
                    };
                  }
                )
                .filter(
                  (task: CleanedTask) =>
                    task.title !== "" &&
                    task.teacherId !== ""
                ),
            };
          }
        )
        .filter(
          (category: CleanedCategory) =>
            category.name !== ""
        );

    // ======================================================
    // UPDATE TEMPLATE
    // ======================================================

    const updatedTemplate =
      await prisma.$transaction(
        async (tx) => {
          // Delete old categories.
          // Because TaskTemplateCategory -> TaskTemplateItem
          // uses onDelete: Cascade, the old tasks are also
          // deleted automatically.
          await tx.taskTemplateCategory.deleteMany({
            where: {
              templateId,
            },
          });

          // Recreate categories and tasks.
          return tx.taskTemplate.update({
            where: {
              id: templateId,
            },

            data: {
              name,

              categories: {
                create:
                  cleanedCategories.map(
                    (category) => ({
                      name: category.name,

                      sortOrder:
                        category.sortOrder,

                      tasks: {
                        create:
                          category.tasks.map(
                            (task) => ({
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

                              // IMPORTANT:
                              // Connect this task to the
                              // current TaskTemplate.
                              template: {
                                connect: {
                                  id: templateId,
                                },
                              },

                              // Connect this task to its teacher.
                              teacher: {
                                connect: {
                                  id: task.teacherId,
                                },
                              },
                            })
                          ),
                      },
                    })
                  ),
              },
            },

            // Return the updated template with
            // categories, tasks and teachers.
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
        }
      );

    return NextResponse.json({
      message:
        "Task template updated successfully.",

      template: updatedTemplate,
    });
  } catch (error) {
    console.error(
      "UPDATE TASK TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to update task template.",
      },
      {
        status: 500,
      }
    );
  }
}