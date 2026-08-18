import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RoutineItemInput = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  sortOrder: number;
};

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function convertToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function calculateDuration(startTime: string, endTime: string) {
  const start = convertToMinutes(startTime);
  const end = convertToMinutes(endTime);

  let difference = end - start;

  if (difference < 0) {
    difference += 24 * 60;
  }

  return difference;
}

// ============================================================
// GET ROUTINE TEMPLATES
// ============================================================

export async function GET() {
  try {
    const templates = await prisma.routineTemplate.findMany({
      include: {
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
    console.error("GET ROUTINE TEMPLATES ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to load routine templates.",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// CREATE ROUTINE TEMPLATE
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const items = Array.isArray(body.items)
      ? body.items
      : [];

    // ---------------------------------------------------------
    // Validate template name
    // ---------------------------------------------------------

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
          message:
            "Template name cannot exceed 100 characters.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // Validate routines
    // ---------------------------------------------------------

    if (items.length === 0) {
      return NextResponse.json(
        {
          message:
            "Please add at least one routine before saving the template.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanItems: RoutineItemInput[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

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

      // -------------------------------------------------------
      // Title
      // -------------------------------------------------------

      if (!title) {
        return NextResponse.json(
          {
            message:
              `Routine ${index + 1} must have a title.`,
          },
          {
            status: 400,
          }
        );
      }

      if (title.length > 100) {
        return NextResponse.json(
          {
            message:
              `Routine ${index + 1} title cannot exceed 100 characters.`,
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // Description
      // -------------------------------------------------------

      if (description.length > 100) {
        return NextResponse.json(
          {
            message:
              `Routine ${index + 1} description cannot exceed 100 characters.`,
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // Time
      // -------------------------------------------------------

      if (
        !isValidTime(startTime) ||
        !isValidTime(endTime)
      ) {
        return NextResponse.json(
          {
            message:
              `Routine ${index + 1} must have valid start and end times.`,
          },
          {
            status: 400,
          }
        );
      }

      // -------------------------------------------------------
      // Calculate duration on server
      // -------------------------------------------------------

      const durationMin = calculateDuration(
        startTime,
        endTime
      );

      if (durationMin <= 0) {
        return NextResponse.json(
          {
            message:
              `Routine ${index + 1} must have different start and end times.`,
          },
          {
            status: 400,
          }
        );
      }

      cleanItems.push({
        title,
        description,
        startTime,
        endTime,
        durationMin,
        sortOrder: index,
      });
    }

    // ---------------------------------------------------------
    // TEMPORARY DEVELOPMENT USER
    // ---------------------------------------------------------

    const headUser = await prisma.user.findFirst({
      where: {
        role: "HEAD",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!headUser) {
      return NextResponse.json(
        {
          message:
            "No HEAD user exists in the database. Create a HEAD user first.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // CREATE TEMPLATE
    // ---------------------------------------------------------

    const template =
      await prisma.routineTemplate.create({
        data: {
          name,
          createdById: headUser.id,

          items: {
            create: cleanItems.map((item) => ({
              title: item.title,
              description:
                item.description || null,
              startTime: item.startTime,
              endTime: item.endTime,
              durationMin: item.durationMin,
              sortOrder: item.sortOrder,
            })),
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

    return NextResponse.json(
      {
        message:
          "Routine template created successfully.",
        template,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE ROUTINE TEMPLATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to create routine template.",
      },
      {
        status: 500,
      }
    );
  }
}