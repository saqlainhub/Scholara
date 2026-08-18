import { prisma } from "@/lib/prisma";

export const VALID_DAYS = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
] as const;

export type ValidDay =
    (typeof VALID_DAYS)[number];

export function getPakistanDate() {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Karachi",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(new Date());
}

export function getPakistanDay(): ValidDay {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "Asia/Karachi",
            weekday: "long",
        }
    )
        .format(new Date())
        .toUpperCase() as ValidDay;
}

export function getDayOfWeekFromDate(
    dateString: string
): ValidDay {
    const date =
        dateKeyToUTCDate(dateString);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "UTC",
            weekday: "long",
        }
    )
        .format(date)
        .toUpperCase() as ValidDay;
}

export async function getStudentDayStatus(
    studentId: string,
    dateString: string
) {
    const dayOfWeek =
        getDayOfWeekFromDate(
            dateString
        );

    const date =
        dateKeyToUTCDate(
            dateString
        );

    const assignment =
        await prisma.studentWeeklyTemplateAssignment.findUnique(
            {
                where: {
                    studentId_dayOfWeek: {
                        studentId,
                        dayOfWeek,
                    },
                },

                include: {
                    taskTemplate: {
                        include: {
                            categories: {
                                include: {
                                    tasks: true,
                                },
                            },
                        },
                    },
                },
            }
        );

    const dailyRecord =
        await prisma.dailyRecord.findUnique(
            {
                where: {
                    studentId_date: {
                        studentId,
                        date,
                    },
                },

                include: {
                    tasks: {
                        select: {
                            id: true,
                        },
                    },
                },
            }
        );

    const templateTaskCount =
        assignment?.taskTemplate?.categories.reduce(
            (total, category) =>
                total + category.tasks.length,
            0
        ) ?? 0;

    const actualTaskCount =
        dailyRecord?.tasks.length ?? 0;

    /*
     * A day is working if:
     *
     * 1. The weekly template has tasks, OR
     * 2. A DailyRecord already contains tasks.
     */
    const isWorking =
        templateTaskCount > 0 ||
        actualTaskCount > 0 ||
        dailyRecord?.isWorking === true;

    const taskCount =
        actualTaskCount > 0
            ? actualTaskCount
            : templateTaskCount;

    return {
        dayOfWeek,

        isWorking,

        dayType:
            isWorking
                ? "WORKING"
                : "OFF",

        taskCount,

        assignment,

        dailyRecord,
    };
}

export function dateKeyToUTCDate(
    dateString: string
) {
    const [year, month, day] =
        dateString.split("-").map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}

export function utcDateToDateKey(
    date: Date
) {
    return date
        .toISOString()
        .slice(0, 10);
}