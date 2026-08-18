import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    templateId: string;
  }>;
};

type RoutineItemInput = {
  title?: unknown;
  description?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  durationMin?: unknown;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { templateId } = await context.params;

    const template = await prisma.routineTemplate.findUnique({
      where: {
        id: templateId,
      },
      include: {
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          message: "Routine template not found.",
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
    console.error("GET ROUTINE TEMPLATE ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to load routine template.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { templateId } = await context.params;

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const items: RoutineItemInput[] = Array.isArray(body.items)
      ? body.items
      : [];

    if (!name) {
      return NextResponse.json(
        {
          message: "Template name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        {
          message: "Template name cannot exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const existing = await prisma.routineTemplate.findUnique({
      where: {
        id: templateId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          message: "Routine template not found.",
        },
        {
          status: 404,
        }
      );
    }

    const validatedItems = items.map(
      (item: RoutineItemInput, index: number) => {
        const title =
          typeof item.title === "string"
            ? item.title.trim()
            : "";

        const description =
          typeof item.description === "string"
            ? item.description.trim()
            : "";

        const startTime =
          typeof item.startTime === "string"
            ? item.startTime
            : "";

        const endTime =
          typeof item.endTime === "string"
            ? item.endTime
            : "";

        const durationMin = Number(item.durationMin);

        return {
          title,
          description: description || null,
          startTime,
          endTime,
          durationMin,
          sortOrder: index,
        };
      }
    );

    for (const item of validatedItems) {
      if (!item.title) {
        return NextResponse.json(
          {
            message: "Every routine must have a title.",
          },
          {
            status: 400,
          }
        );
      }

      if (!item.startTime || !item.endTime) {
        return NextResponse.json(
          {
            message: `Routine "${item.title}" must have a start and end time.`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !Number.isFinite(item.durationMin) ||
        item.durationMin <= 0
      ) {
        return NextResponse.json(
          {
            message: `Routine "${item.title}" has an invalid duration.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    const updatedTemplate = await prisma.$transaction(
      async (tx) => {
        await tx.routineTemplateItem.deleteMany({
          where: {
            templateId,
          },
        });

        const template = await tx.routineTemplate.update({
          where: {
            id: templateId,
          },
          data: {
            name,
            items: {
              create: validatedItems,
            },
          },
          include: {
            items: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        });

        return template;
      }
    );

    return NextResponse.json({
      message: "Routine template updated successfully.",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error(
      "UPDATE ROUTINE TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to update routine template.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { templateId } = await context.params;

    const existing = await prisma.routineTemplate.findUnique({
      where: {
        id: templateId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          message: "Routine template not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.routineTemplate.delete({
      where: {
        id: templateId,
      },
    });

    return NextResponse.json({
      message: "Routine template deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE ROUTINE TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to delete routine template.",
      },
      {
        status: 500,
      }
    );
  }
}