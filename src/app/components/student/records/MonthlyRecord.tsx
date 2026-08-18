"use client";

import {
    useState,
} from "react";

import {
    CalendarDays,
    ChevronRight,
} from "lucide-react";

import DayReportModal from "./DayReportModal";

import type {
    DayRecord,
    RecordStats,
} from "@/lib/student-records/types";

type Props = {
    monthName: string;
    year: number;
    month: number;
    daysInMonth: number;
    firstDayIndex: number;
    days: DayRecord[];
    stats: RecordStats;
};

const weekdays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
];

function getDateKey(
    year: number,
    month: number,
    day: number
) {
    return `${year}-${String(month).padStart(
        2,
        "0"
    )}-${String(day).padStart(
        2,
        "0"
    )}`;
}

export default function MonthlyRecord({
    monthName,
    year,
    month,
    daysInMonth,
    firstDayIndex,
    days,
    stats,
}: Props) {
    const [
        selectedDay,
        setSelectedDay,
    ] =
        useState<DayRecord | null>(
            null
        );

    const dayMap = new Map(
        days.map((day) => [
            day.date,
            day,
        ])
    );

    const calendarCells: (
        | number
        | null
    )[] = [];

    for (
        let index = 0;
        index < firstDayIndex;
        index++
    ) {
        calendarCells.push(null);
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {
        calendarCells.push(day);
    }

    while (
        calendarCells.length % 7 !==
        0
    ) {
        calendarCells.push(null);
    }

    function handleDayClick(
        day: DayRecord
    ) {
        setSelectedDay(day);
    }

    function handleClose() {
        setSelectedDay(null);
    }

    return (
        <>
            <section className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-1.5 flex items-center gap-2 text-xs text-(--text-secondary) sm:text-sm">
                            <CalendarDays
                                size={15}
                                className="shrink-0 sm:h-4 sm:w-4"
                            />

                            <span>
                                Previous Month
                            </span>
                        </div>

                        <h2 className="text-xl font-semibold sm:text-2xl">
                            {monthName}{" "}
                            {year}{" "}
                            <span className="text-(--text-secondary)">
                                -{" "}
                                {
                                    daysInMonth
                                }{" "}
                                Days
                            </span>
                        </h2>
                    </div>

                    <div className="text-xs text-(--text-secondary) sm:text-sm">
                        {stats.workingDays}{" "}
                        working{" "}
                        <span className="mx-1">
                            ·
                        </span>
                        {stats.offDays} off
                    </div>
                </div>

                {/* Calendar */}
                <div className="overflow-hidden rounded-xl border border-(--border) bg-(--navy-900)">
                    {/* Weekday header */}
                    <div className="grid grid-cols-7 border-b border-(--border)">
                        {weekdays.map(
                            (
                                weekday
                            ) => (
                                <div
                                    key={
                                        weekday
                                    }
                                    className="flex h-9 items-center justify-center border-r border-(--border) px-0.5 text-[9px] font-medium text-(--text-secondary) last:border-r-0 min-[400px]:text-[10px] sm:h-11 sm:px-2 sm:text-xs"
                                >
                                    {
                                        weekday
                                    }
                                </div>
                            )
                        )}
                    </div>

                    {/* Calendar dates */}
                    <div className="grid grid-cols-7">
                        {calendarCells.map(
                            (
                                day,
                                index
                            ) => {
                                if (
                                    day ===
                                    null
                                ) {
                                    return (
                                        <div
                                            key={`empty-${index}`}
                                            className="min-h-20 border-r border-b border-(--border) bg-(--navy-950)/40 min-[400px]:min-h-24 sm:min-h-32"
                                        />
                                    );
                                }

                                const dateKey =
                                    getDateKey(
                                        year,
                                        month,
                                        day
                                    );

                                const actualDay =
                                    dayMap.get(
                                        dateKey
                                    );

                                const isOff =
                                    actualDay?.dayType ===
                                    "OFF";

                                return (
                                    <button
                                        key={
                                            dateKey
                                        }
                                        type="button"
                                        disabled={
                                            !actualDay
                                        }
                                        onClick={() => {
                                            if (
                                                actualDay
                                            ) {
                                                handleDayClick(
                                                    actualDay
                                                );
                                            }
                                        }}
                                        className={[
                                            "group relative min-h-20 border-r border-b border-(--border) p-1.5 text-left transition min-[400px]:min-h-24 min-[400px]:p-2 sm:min-h-32 sm:p-3",
                                            !actualDay
                                                ? "cursor-default"
                                                : isOff
                                                  ? "cursor-pointer bg-(--navy-950) hover:bg-(--navy-800)"
                                                  : "hover:bg-(--navy-800)",
                                        ].join(
                                            " "
                                        )}
                                    >
                                        {/* Mobile: date only */}
                                        <span
                                            className={[
                                                "data text-[13px] font-semibold sm:hidden",
                                                isOff
                                                    ? "text-red-400"
                                                    : "text-white",
                                            ].join(
                                                " "
                                            )}
                                        >
                                            {
                                                day
                                            }
                                        </span>

                                        {/* Tablet / Desktop: Date */}
                                        <div className="hidden items-start justify-between gap-1 sm:flex">
                                            <span
                                                className={[
                                                    "data text-xs font-semibold min-[400px]:text-sm sm:text-base",
                                                    isOff
                                                        ? "text-red-400"
                                                        : "text-white",
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                {
                                                    day
                                                }
                                            </span>
                                        </div>

                                        {/* Tablet / Desktop: OFF DAY */}
                                        {actualDay &&
                                        isOff ? (
                                            <div className="mt-3 hidden text-[9px] leading-3 text-(--text-secondary) min-[400px]:mt-4 min-[400px]:text-[10px] sm:mt-5 sm:block sm:text-xs">
                                                Off
                                                day
                                            </div>
                                        ) : actualDay ? (
                                            /* Tablet / Desktop: WORKING DAY */
                                            <div className="mt-2 hidden space-y-0.5 min-[400px]:mt-3 min-[400px]:space-y-1 sm:block sm:space-y-1">
                                                {/* Tasks */}
                                                <div className="flex items-center justify-between gap-1 text-[8px] leading-3 min-[400px]:text-[9px] sm:text-[11px]">
                                                    <span className="text-(--text-secondary)">
                                                        Tasks
                                                    </span>

                                                    <span className="data">
                                                        {
                                                            actualDay
                                                                .stats
                                                                .totalTasks
                                                        }
                                                    </span>
                                                </div>

                                                {/* Score */}
                                                <div className="flex items-center justify-between gap-1 text-[8px] leading-3 min-[400px]:text-[9px] sm:text-[11px]">
                                                    <span className="text-(--text-secondary)">
                                                        Score
                                                    </span>

                                                    <span className="data">
                                                        {
                                                            actualDay
                                                                .stats
                                                                .score
                                                        }
                                                    </span>
                                                </div>

                                                {/* Checked */}
                                                <div className="hidden items-center justify-between gap-2 text-[11px] sm:flex">
                                                    <span className="text-(--text-secondary)">
                                                        Checked
                                                    </span>

                                                    <span className="data">
                                                        {
                                                            actualDay
                                                                .stats
                                                                .checked
                                                        }
                                                        /
                                                        {
                                                            actualDay
                                                                .stats
                                                                .totalTasks
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Tablet / Desktop: Report arrow */}
                                        {actualDay &&
                                            !isOff && (
                                                <div className="absolute right-1 bottom-1 hidden opacity-0 transition group-hover:opacity-100 sm:right-2 sm:bottom-2 sm:block">
                                                    <ChevronRight
                                                        size={
                                                            14
                                                        }
                                                        className="text-(--gold-400)"
                                                    />
                                                </div>
                                            )}
                                    </button>
                                );
                            }
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-(--border) bg-(--navy-900) px-3 py-3 text-[10px] text-(--text-secondary) min-[400px]:gap-x-5 min-[400px]:px-4 sm:text-xs">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-white sm:h-2.5 sm:w-2.5" />
                        Working
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-600 sm:h-2.5 sm:w-2.5" />
                        Off day
                    </div>
                </div>
            </section>

            <DayReportModal
                day={selectedDay}
                onClose={
                    handleClose
                }
            />
        </>
    );
}