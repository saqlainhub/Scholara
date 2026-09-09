import StudentReportCard, {
  type StudentReportCardData,
  type StudentReportCardTask,
} from "@/app/components/studentReportCard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const MAX_POINTS = 5;
const TIME_ZONE = "Asia/Karachi";

/* ==========================================================
   DATE HELPERS
========================================================== */

function getDateParts(
  date: Date,
  timeZone: string
) {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(date);

  return {
    year: Number(
      parts.find(
        (part) => part.type === "year"
      )?.value
    ),

    month: Number(
      parts.find(
        (part) => part.type === "month"
      )?.value
    ),

    day: Number(
      parts.find(
        (part) => part.type === "day"
      )?.value
    ),
  };
}

/**
 * Returns yesterday according to Pakistan time.
 *
 * Example:
 * Today    = 2026-09-09
 * Yesterday = 2026-09-08
 */
function getPreviousDateKey() {
  const now = new Date();

  const {
    year,
    month,
    day,
  } = getDateParts(
    now,
    TIME_ZONE
  );

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  date.setUTCDate(
    date.getUTCDate() - 1
  );

  return date
    .toISOString()
    .slice(0, 10);
}

/**
 * PostgreSQL @db.Date is represented by
 * Prisma using a Date at midnight UTC.
 */
function dateKeyToDate(
  dateKey: string
) {
  return new Date(
    `${dateKey}T00:00:00.000Z`
  );
}

/* ==========================================================
   FORMATTING
========================================================== */

function formatReportDate(
  dateKey: string
) {
  const date = new Date(
    `${dateKey}T12:00:00.000Z`
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function formatSubmissionTime(
  value: Date
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: TIME_ZONE,
        day: "numeric",
        month: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }
    ).formatToParts(value);

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  const hour =
    parts.find(
      (part) =>
        part.type === "hour"
    )?.value ?? "";

  const minute =
    parts.find(
      (part) =>
        part.type === "minute"
    )?.value ?? "";

  const period =
    parts.find(
      (part) =>
        part.type ===
        "dayPeriod"
    )?.value ?? "";

  return `${day}/${month}, ${hour}:${minute} ${period}`;
}

/* ==========================================================
   SCORE HELPERS
========================================================== */

function normalizeScore(
  score: number | null | undefined
) {
  if (
    score === null ||
    score === undefined ||
    Number.isNaN(Number(score))
  ) {
    return 0;
  }

  return Math.min(
    MAX_POINTS,
    Math.max(0, Number(score))
  );
}

/**
 * Obtained score:
 *
 * difficulty × teacher points
 *
 * Example:
 *
 * difficulty = 2
 * teacher points = 4
 *
 * obtained = 2 × 4 = 8
 */
function getTaskObtainedScore(
  task: {
    difficulty: number;
    isChecked: boolean;
    review: {
      score: number;
    } | null;
  }
) {
  if (!task.isChecked) {
    return 0;
  }

  return (
    task.difficulty *
    normalizeScore(
      task.review?.score
    )
  );
}

/**
 * Calculate a student's total leaderboard
 * score for one day.
 */
function calculateStudentScore(
  tasks: Array<{
    difficulty: number;
    isChecked: boolean;
    review: {
      score: number;
    } | null;
  }>
) {
  return tasks.reduce(
    (total, task) =>
      total +
      getTaskObtainedScore(task),
    0
  );
}

/**
 * Competition ranking:
 *
 * 100 → #1
 * 100 → #1
 * 80  → #3
 * 60  → #4
 */
function getLeaderboardPosition(
  scores: Array<{
    studentId: string;
    score: number;
  }>,
  studentId: string
) {
  const target =
    scores.find(
      (item) =>
        item.studentId ===
        studentId
    );

  if (!target) {
    return null;
  }

  return (
    1 +
    scores.filter(
      (item) =>
        item.score >
        target.score
    ).length
  );
}

/* ==========================================================
   PAGE
========================================================== */

export default async function HeadStudentReportDatePage({
  params,
}: {
  params: Promise<{
    studentId: string;
  }>;
}) {
  const {
    studentId,
  } = await params;

  /* ========================================================
     GET STUDENT
  ======================================================== */

  const student =
    await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
      },

      select: {
        id: true,
        name: true,
        username: true,
        profileImg: true,
      },
    });

  if (!student) {
    notFound();
  }

  /* ========================================================
     PREVIOUS DAY
  ======================================================== */

  const dateKey =
    getPreviousDateKey();

  const reportDate =
    dateKeyToDate(
      dateKey
    );

  /* ========================================================
     FETCH REPORT + LEADERBOARD DATA
  ======================================================== */

  const [
    dailyRecord,
    leaderboardRecords,
  ] = await Promise.all([
    /*
     * Selected student's report
     */
    prisma.dailyRecord.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: reportDate,
        },
      },

      select: {
        id: true,
        date: true,
        isWorking: true,

        tasks: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            title: true,
            difficulty: true,

            isChecked: true,
            isDelayed: true,

            submissions: {
              orderBy: {
                submittedAt:
                  "desc",
              },

              take: 1,

              select: {
                submittedAt: true,
              },
            },

            review: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    }),

    /*
     * All active students' records
     * for the same day.
     *
     * These are used only for the
     * leaderboard position.
     */
    prisma.dailyRecord.findMany({
      where: {
        date: reportDate,

        student: {
          role: "STUDENT",
          isActive: true,
        },
      },

      select: {
        studentId: true,

        tasks: {
          select: {
            difficulty: true,
            isChecked: true,

            review: {
              select: {
                score: true,
              },
            },
          },
        },
      },
    }),
  ]);

  /* ========================================================
     LEADERBOARD
  ======================================================== */

  /*
   * Normally the selected student is already included
   * because active students are queried above.
   *
   * This extra handling makes the report work even if
   * the student has subsequently been deactivated.
   */
  const selectedStudentExists =
    leaderboardRecords.some(
      (record) =>
        record.studentId ===
        studentId
    );

  if (
    dailyRecord &&
    !selectedStudentExists
  ) {
    leaderboardRecords.push({
      studentId,

      tasks: dailyRecord.tasks.map(
        (task) => ({
          difficulty:
            task.difficulty,

          isChecked:
            task.isChecked,

          review:
            task.review,
        })
      ),
    });
  }

  const leaderboardScores =
    leaderboardRecords.map(
      (record) => ({
        studentId:
          record.studentId,

        score:
          calculateStudentScore(
            record.tasks
          ),
      })
    );

  const leaderboardPosition =
    getLeaderboardPosition(
      leaderboardScores,
      studentId
    );

  /* ========================================================
     WORKING / OFF
  ======================================================== */

  const dayType =
    dailyRecord?.isWorking === true
      ? "Working"
      : "Off";

  /*
   * If there is no DailyRecord, the day is
   * considered Off and there are no tasks.
   */
  const tasks =
    dailyRecord?.isWorking === true
      ? dailyRecord.tasks
      : [];

  /* ========================================================
     SUMMARY
  ======================================================== */

  const totalTasks =
    tasks.length;

  const submittedTasks =
    tasks.filter(
      (task) =>
        task.submissions.length >
        0
    ).length;

  const checkedTasks =
    tasks.filter(
      (task) =>
        task.isChecked
    ).length;

  /*
   * Every task has 5 maximum teacher points.
   *
   * Total Score =
   *
   * difficulty × 5
   */
  const totalScore =
    tasks.reduce(
      (total, task) =>
        total +
        task.difficulty *
          MAX_POINTS,
      0
    );

  /*
   * Obtained Score =
   *
   * difficulty × obtained points
   */
  const obtainedScore =
    tasks.reduce(
      (total, task) =>
        total +
        getTaskObtainedScore(
          task
        ),
      0
    );

  const performanceRate =
    totalScore > 0
      ? (obtainedScore /
          totalScore) *
        100
      : 0;

  /* ========================================================
     TASK TABLE
  ======================================================== */

  const reportTasks: StudentReportCardTask[] =
    tasks.map(
      (task, index) => {
        const submitted =
          task.submissions.length >
          0;

        /*
         * NOT SUBMITTED
         *
         * Only serial + title are shown.
         * Everything else becomes "-".
         */
        if (!submitted) {
          return {
            serial: index + 1,

            title: task.title,

            submitted: false,

            checked: false,

            difficulty: null,

            points: null,

            status: null,

            submittedAt: null,
          };
        }

        /*
         * Submitted but not checked:
         *
         * Points = 0/5
         */
        const points =
          task.isChecked
            ? normalizeScore(
                task.review?.score
              )
            : 0;

        const lastSubmission =
          task.submissions[0]
            ?.submittedAt ?? null;

        return {
          serial: index + 1,

          title: task.title,

          submitted: true,

          checked:
            task.isChecked,

          difficulty:
            task.difficulty,

          points,

          status:
            task.isDelayed
              ? "Delayed"
              : "Ontime",

          submittedAt:
            lastSubmission
              ? formatSubmissionTime(
                  lastSubmission
                )
              : null,
        };
      }
    );

  /* ========================================================
     FINAL COMPONENT DATA
  ======================================================== */

  const reportCardData: StudentReportCardData =
    {
      student: {
        id: student.id,
        name: student.name,
        username:
          student.username,
        profileImg:
          student.profileImg,
      },

      date: dateKey,

      dateLabel:
        formatReportDate(
          dateKey
        ),

      dayType,

      totalTasks,

      submittedTasks,

      checkedTasks,

      totalScore,

      obtainedScore,

      performanceRate,

      leaderboardPosition,

      tasks: reportTasks,
    };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <StudentReportCard
      data={reportCardData}
      backHref={`/head/students/${studentId}`}
      backLabel="Back to Student"
    />
  );
}