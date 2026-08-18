import { prisma } from "@/lib/prisma";

export type LeaderboardPeriod = "overall" | "daily" | "weekly" | "monthly";

export interface LeaderboardStudent {
    id: string;
    name: string;
    username: string;
    profileImg: string | null;
    score: number;
    position: number;
}

export interface LeaderboardResult {
    period: LeaderboardPeriod;
    title: string;
    subtitle: string;
    startDate: Date;
    endDate: Date;
    winner: LeaderboardStudent | null;
    students: LeaderboardStudent[];
}

function startOfUtcDay(date: Date): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
        ),
    );
}

function addUtcDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

function startOfPreviousWeek(today: Date): Date {
    const currentDay = today.getUTCDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

    const currentMonday = addUtcDays(today, -daysSinceMonday);

    return addUtcDays(currentMonday, -7);
}

function endOfPreviousWeek(today: Date): Date {
    const previousMonday = startOfPreviousWeek(today);

    return addUtcDays(previousMonday, 7);
}

function startOfPreviousMonth(today: Date): Date {
    return new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth() - 1,
            1,
        ),
    );
}

function endOfPreviousMonth(today: Date): Date {
    return new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            1,
        ),
    );
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

function getPeriodRange(
    period: LeaderboardPeriod,
): {
    startDate: Date;
    endDate: Date;
    title: string;
    subtitle: string;
} {
    const today = startOfUtcDay(new Date());

    if (period === "daily") {
        const startDate = addUtcDays(today, -1);
        const endDate = today;

        return {
            startDate,
            endDate,
            title: "Daily Leaderboard",
            subtitle: `Results for ${formatDate(startDate)}`,
        };
    }

    if (period === "weekly") {
        const startDate = startOfPreviousWeek(today);
        const endDate = endOfPreviousWeek(today);

        return {
            startDate,
            endDate,
            title: "Weekly Leaderboard",
            subtitle: `${formatDate(startDate)} – ${formatDate(addUtcDays(endDate, -1))}`,
        };
    }

    if (period === "monthly") {
        const startDate = startOfPreviousMonth(today);
        const endDate = endOfPreviousMonth(today);

        return {
            startDate,
            endDate,
            title: "Monthly Leaderboard",
            subtitle: `${formatDate(startDate)} – ${formatDate(addUtcDays(endDate, -1))}`,
        };
    }

    return {
        startDate: new Date(0),
        endDate: today,
        title: "Overall Leaderboard",
        subtitle: `All-time results through ${formatDate(addUtcDays(today, -1))}`,
    };
}

export async function getLeaderboard(
    period: LeaderboardPeriod,
): Promise<LeaderboardResult> {
    const {
        startDate,
        endDate,
        title,
        subtitle,
    } = getPeriodRange(period);

    const students = await prisma.user.findMany({
        where: {
            role: "STUDENT",
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            username: true,
            profileImg: true,
            dailyRecords: {
                where: {
                    date: {
                        gte: startDate,
                        lt: endDate,
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

    const leaderboard = students
        .map((student) => {
            const score = student.dailyRecords.reduce(
                (total, record) => {
                    return (
                        total +
                        record.tasks.reduce(
                            (recordTotal, task) =>
                                recordTotal + (task.score ?? 0),
                            0,
                        )
                    );
                },
                0,
            );

            return {
                id: student.id,
                name: student.name,
                username: student.username,
                profileImg: student.profileImg,
                score,
                position: 0,
            };
        })
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return a.name.localeCompare(b.name);
        })
        .map((student, index) => ({
            ...student,
            position: index + 1,
        }));

    return {
        period,
        title,
        subtitle,
        startDate,
        endDate,
        winner: leaderboard[0] ?? null,
        students: leaderboard,
    };
}