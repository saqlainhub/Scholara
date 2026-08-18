import type { PrismaClient } from "@/generated/prisma/client";

export type TeacherPerformance =
    | "DILIGENT"
    | "LAZY";

export type TeacherActivity = {
    totalRecentTasks: number;
    checkedRecentTasks: number;
    uncheckedRecentTasks: number;
    checkedPercentage: number;
    performance: TeacherPerformance;
};

export async function calculateTeacherActivity(
    prisma: PrismaClient,
    teacherId: string
): Promise<TeacherActivity> {
    const now = new Date();

    /*
     * ========================================================
     * TODAY
     * ========================================================
     *
     * Today is deliberately excluded.
     */

    const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    /*
     * ========================================================
     * PREVIOUS FIVE CALENDAR DAYS
     * ========================================================
     */

    const startDate = new Date(
        todayStart
    );

    startDate.setDate(
        startDate.getDate() - 5
    );

    /*
     * ========================================================
     * LOAD RECENT TASKS
     * ========================================================
     *
     * Keep this consistent with the teacher portal:
     *
     * - belongs to this teacher
     * - has at least one student submission
     */

    const tasks =
        await prisma.task.findMany({
            where: {
                teacherId,

                submissions: {
                    some: {},
                },

                dailyRecord: {
                    date: {
                        gte: startDate,
                        lt: todayStart,
                    },
                },
            },

            select: {
                isChecked: true,
            },
        });

    const totalRecentTasks =
        tasks.length;

    const checkedRecentTasks =
        tasks.filter(
            (task) => task.isChecked
        ).length;

    const uncheckedRecentTasks =
        totalRecentTasks -
        checkedRecentTasks;

    const checkedPercentage =
        totalRecentTasks > 0
            ? (checkedRecentTasks /
                  totalRecentTasks) *
              100
            : 0;

    /*
     * ========================================================
     * PERFORMANCE
     * ========================================================
     *
     * More than 90% checked = DILIGENT
     *
     * Otherwise = LAZY
     *
     * A teacher with no recent tasks is LAZY because there is
     * no recent activity demonstrating diligent performance.
     */

    const performance: TeacherPerformance =
        totalRecentTasks > 0 &&
        checkedPercentage > 90
            ? "DILIGENT"
            : "LAZY";

    return {
        totalRecentTasks,
        checkedRecentTasks,
        uncheckedRecentTasks,
        checkedPercentage,
        performance,
    };
}