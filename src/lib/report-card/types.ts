export type ReportTask = {
    id: string;
    number: number;

    name: string;

    checked: boolean;

    difficulty: number | null;

    obtainedPoints: number | null;

    maxPoints: number | null;

    status:
        | "ON_TIME"
        | "DELAYED"
        | null;

    lastSubmissionTime:
        Date | null;

    submitted: boolean;
};

export type DailyReportCard = {
    student: {
        id: string;
        name: string;
    };

    date: Date;

    isWorking: boolean;

    summary: {
        totalTasks: number;

        submitted: number;

        checked: number;

        totalScore: number;

        obtainedScore: number;

        performanceRate: number;

        leaderboardPosition:
            number | null;
    };

    tasks: ReportTask[];
};