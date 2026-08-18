import { prisma } from "@/lib/prisma";

type AwardType =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "OVERALL"
  | "STREAK_3"
  | "STREAK_7"
  | "STREAK_14"
  | "STREAK_30"
  | "STREAK_60"
  | "STREAK_90";

function startOfDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + amount);
  return result;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonday(date: Date) {
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;

  return addDays(date, -diff);
}

function getWeekKey(date: Date) {
  return dateKey(getMonday(date));
}

function getMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
}

/**
 * Values used when creating a completely new StudentAwardStats row.
 *
 * IMPORTANT:
 * Prisma does not allow { increment: 1 } inside create.
 */
function getCreateIncrement(type: AwardType) {
  switch (type) {
    case "DAILY":
      return { dailyAwards: 1 };

    case "WEEKLY":
      return { weeklyAwards: 1 };

    case "MONTHLY":
      return { monthlyAwards: 1 };

    case "OVERALL":
      return { overallAwardDays: 1 };

    case "STREAK_3":
      return { streak3DaysAwards: 1 };

    case "STREAK_7":
      return { streak7DaysAwards: 1 };

    case "STREAK_14":
      return { streak14DaysAwards: 1 };

    case "STREAK_30":
      return { streak30DaysAwards: 1 };

    case "STREAK_60":
      return { streak60DaysAwards: 1 };

    case "STREAK_90":
      return { streak90DaysAwards: 1 };
  }
}

/**
 * Values used when updating an existing StudentAwardStats row.
 *
 * Prisma allows increment operations during update.
 */
function getUpdateIncrement(type: AwardType) {
  switch (type) {
    case "DAILY":
      return { dailyAwards: { increment: 1 } };

    case "WEEKLY":
      return { weeklyAwards: { increment: 1 } };

    case "MONTHLY":
      return { monthlyAwards: { increment: 1 } };

    case "OVERALL":
      return { overallAwardDays: { increment: 1 } };

    case "STREAK_3":
      return { streak3DaysAwards: { increment: 1 } };

    case "STREAK_7":
      return { streak7DaysAwards: { increment: 1 } };

    case "STREAK_14":
      return { streak14DaysAwards: { increment: 1 } };

    case "STREAK_30":
      return { streak30DaysAwards: { increment: 1 } };

    case "STREAK_60":
      return { streak60DaysAwards: { increment: 1 } };

    case "STREAK_90":
      return { streak90DaysAwards: { increment: 1 } };
  }
}

/**
 * Gives an award only once for a specific student/type/period.
 *
 * Examples:
 *
 * DAILY   -> 2026-08-14
 * WEEKLY  -> 2026-08-10
 * MONTHLY -> 2026-07
 * OVERALL -> 2026-08-14
 * STREAK  -> 2026-08-14-3
 */
async function awardOnce(
  studentId: string,
  type: AwardType,
  periodKey: string,
) {
  const existing = await prisma.studentAwardEvent.findUnique({
    where: {
      studentId_type_periodKey: {
        studentId,
        type,
        periodKey,
      },
    },
  });

  if (existing) {
    return false;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.studentAwardEvent.create({
        data: {
          studentId,
          type,
          periodKey,
        },
      });

      await tx.studentAwardStats.upsert({
        where: {
          studentId,
        },
        create: {
          studentId,
          ...getCreateIncrement(type),
        },
        update: getUpdateIncrement(type),
      });
    });

    return true;
  } catch (error: unknown) {
    /**
     * If two requests/processes try to award the same event
     * simultaneously, the unique constraint on
     * studentId_type_periodKey protects us.
     *
     * The second process simply does nothing.
     */
    if (
      error instanceof Error &&
      error.message.includes(
        "Unique constraint failed",
      )
    ) {
      return false;
    }

    throw error;
  }
}

/**
 * Returns the total score of every active student for one day.
 */
async function getDailyScores(date: Date) {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      dailyRecords: {
        where: {
          date,
        },
        select: {
          tasks: {
            select: {
              score: true,
            },
          },
        },
      },
    },
  });

  return students
    .map((student) => {
      const score = student.dailyRecords.reduce(
        (total, record) => {
          return (
            total +
            record.tasks.reduce(
              (sum, task) =>
                sum + (task.score ?? 0),
              0,
            )
          );
        },
        0,
      );

      return {
        id: student.id,
        score,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.id.localeCompare(b.id);
    });
}

/**
 * DAILY AWARD
 *
 * The winner of the previous day receives:
 *
 * 1 daily award
 * 1 overall award day
 */
async function processDailyAward(date: Date) {
  const scores = await getDailyScores(date);

  if (!scores.length) {
    return;
  }

  const winner = scores[0];

  if (winner.score <= 0) {
    return;
  }

  await awardOnce(
    winner.id,
    "DAILY",
    dateKey(date),
  );

  await awardOnce(
    winner.id,
    "OVERALL",
    dateKey(date),
  );
}

/**
 * WEEKLY AWARD
 *
 * The week containing `date` is evaluated.
 */
async function processWeeklyAward(date: Date) {
  const monday = getMonday(date);
  const nextMonday = addDays(monday, 7);

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      dailyRecords: {
        where: {
          date: {
            gte: monday,
            lt: nextMonday,
          },
        },
        select: {
          tasks: {
            select: {
              score: true,
            },
          },
        },
      },
    },
  });

  const ranking = students
    .map((student) => {
      const score =
        student.dailyRecords.reduce(
          (total, record) => {
            return (
              total +
              record.tasks.reduce(
                (sum, task) =>
                  sum + (task.score ?? 0),
                0,
              )
            );
          },
          0,
        );

      return {
        id: student.id,
        score,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.id.localeCompare(b.id);
    });

  if (!ranking.length) {
    return;
  }

  const winner = ranking[0];

  if (winner.score <= 0) {
    return;
  }

  await awardOnce(
    winner.id,
    "WEEKLY",
    getWeekKey(date),
  );
}

/**
 * MONTHLY AWARD
 *
 * The month containing `date` is evaluated.
 */
async function processMonthlyAward(date: Date) {
  const start = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1,
    ),
  );

  const next = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1,
    ),
  );

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      dailyRecords: {
        where: {
          date: {
            gte: start,
            lt: next,
          },
        },
        select: {
          tasks: {
            select: {
              score: true,
            },
          },
        },
      },
    },
  });

  const ranking = students
    .map((student) => {
      const score =
        student.dailyRecords.reduce(
          (total, record) => {
            return (
              total +
              record.tasks.reduce(
                (sum, task) =>
                  sum + (task.score ?? 0),
                0,
              )
            );
          },
          0,
        );

      return {
        id: student.id,
        score,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.id.localeCompare(b.id);
    });

  if (!ranking.length) {
    return;
  }

  const winner = ranking[0];

  if (winner.score <= 0) {
    return;
  }

  await awardOnce(
    winner.id,
    "MONTHLY",
    getMonthKey(date),
  );
}

/**
 * Determines whether a student completed a qualifying
 * streak day.
 *
 * Requirements:
 *
 * - Working day
 * - At least one task
 * - Every task completed
 * - Every task completed on time
 * - Every task has a submission
 * - Every task has a review
 * - Every task receives >= 4.5
 */
async function isQualifyingDay(
  studentId: string,
  date: Date,
) {
  const record =
    await prisma.dailyRecord.findUnique({
      where: {
        studentId_date: {
          studentId,
          date,
        },
      },
      include: {
        tasks: {
          include: {
            review: true,
            submissions: true,
          },
        },
      },
    });

  if (
    !record ||
    !record.isWorking ||
    !record.tasks.length
  ) {
    return false;
  }

  return record.tasks.every((task) => {
    const hasSubmission =
      task.submissions.length > 0;

    const completedOnTime =
      task.isCompleted &&
      !task.isDelayed &&
      hasSubmission;

    const highScore =
      task.review !== null &&
      task.review.score >= 4.5;

    return (
      completedOnTime &&
      highScore
    );
  });
}

/**
 * Processes the streak of one student for one completed day.
 */
async function processStreakForStudent(
  studentId: string,
  date: Date,
) {
  const qualifies =
    await isQualifyingDay(
      studentId,
      date,
    );

  const stats =
    await prisma.studentAwardStats.upsert({
      where: {
        studentId,
      },
      create: {
        studentId,
      },
      update: {},
    });

  let currentStreak =
    stats.currentStreak;

  if (qualifies) {
    /**
     * Continue yesterday's streak.
     */
    if (
      stats.lastStreakDate &&
      dateKey(stats.lastStreakDate) ===
        dateKey(addDays(date, -1))
    ) {
      currentStreak += 1;
    } else {
      /**
       * Start a new streak.
       */
      currentStreak = 1;
    }

    const longestStreak =
      Math.max(
        stats.longestStreak,
        currentStreak,
      );

    await prisma.studentAwardStats.update({
      where: {
        studentId,
      },
      data: {
        currentStreak,
        longestStreak,
        lastStreakDate: date,
      },
    });

    /**
     * Milestones are awarded when reached.
     *
     * Example:
     *
     * Day 3  -> STREAK_3
     * Day 7  -> STREAK_7
     * Day 14 -> STREAK_14
     * Day 30 -> STREAK_30
     * Day 60 -> STREAK_60
     * Day 90 -> STREAK_90
     */
    const milestones = [
      {
        days: 3,
        type: "STREAK_3" as const,
      },
      {
        days: 7,
        type: "STREAK_7" as const,
      },
      {
        days: 14,
        type: "STREAK_14" as const,
      },
      {
        days: 30,
        type: "STREAK_30" as const,
      },
      {
        days: 60,
        type: "STREAK_60" as const,
      },
      {
        days: 90,
        type: "STREAK_90" as const,
      },
    ];

    for (const milestone of milestones) {
      if (
        currentStreak >=
        milestone.days
      ) {
        await awardOnce(
          studentId,
          milestone.type,
          `${dateKey(date)}-${milestone.days}`,
        );
      }
    }
  } else {
    /**
     * Any failed day breaks the current streak.
     *
     * The historical longestStreak remains untouched.
     */
    if (currentStreak !== 0) {
      await prisma.studentAwardStats.update({
        where: {
          studentId,
        },
        data: {
          currentStreak: 0,
        },
      });
    }
  }
}

/**
 * Main background award processor.
 *
 * It evaluates:
 *
 * - Previous day daily award
 * - Previous day overall award
 * - Previous week weekly award
 * - Previous month monthly award
 * - Previous day streak progress
 */
export async function processAwards() {
  const today =
    startOfDay(new Date());

  /**
   * Never process today's incomplete data.
   */
  const yesterday =
    addDays(today, -1);

  /**
   * DAILY + OVERALL
   */
  await processDailyAward(
    yesterday,
  );

  /**
   * WEEKLY
   *
   * We use the previous day and resolve
   * the week containing that day.
   *
   * Example:
   * If today is Monday, the previous day
   * is Sunday, therefore the previous
   * completed week is the Monday-Sunday
   * week ending yesterday.
   */
  const previousWeekDate =
    addDays(yesterday, -7);

  await processWeeklyAward(
    previousWeekDate,
  );

  /**
   * MONTHLY
   *
   * Evaluate the previous calendar month.
   */
  const previousMonthDate =
    new Date(
      Date.UTC(
        yesterday.getUTCFullYear(),
        yesterday.getUTCMonth() - 1,
        15,
      ),
    );

  await processMonthlyAward(
    previousMonthDate,
  );

  /**
   * STREAKS
   *
   * Process every active student for
   * yesterday.
   */
  const students =
    await prisma.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

  for (const student of students) {
    await processStreakForStudent(
      student.id,
      yesterday,
    );
  }
}