export type RecordStatus =
    | "TOP"
    | "ACTIVE"
    | "WEAK";

export type DayType =
    | "WORKING"
    | "OFF";

export type RecordStats = {
    totalTasks: number;
    submitted: number;
    unsubmitted: number;
    delayed: number;
    ontime: number;
    checked: number;
    unchecked: number;

    totalDays: number;
    workingDays: number;
    offDays: number;

    score: number;
    status: RecordStatus;
    position: number | null;
};

export type DayRecord = {
    date: string;
    dayName: string;
    shortDayName: string;

    dayType: DayType;

    stats: RecordStats;
};

export type PeriodRecord = {
    startDate: string;
    endDate: string;

    totalDays: number;
    workingDays: number;
    offDays: number;

    stats: RecordStats;

    days: DayRecord[];
};

export type MonthlyOverview = {
    year: number;
    month: number;
    monthName: string;

    startDate: string;
    endDate: string;

    totalDays: number;
    visibleDays: number;

    stats: RecordStats;

    days: DayRecord[];
};

export type OverviewRecord = {
    createdAt: string;
    endDate: string;

    stats: RecordStats;

    months: MonthlyOverview[];
};