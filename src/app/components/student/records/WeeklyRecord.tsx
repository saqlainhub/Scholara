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
    startDate: string;
    endDate: string;
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

function formatDateRange(
    startDate: string,
    endDate: string
) {
    const start = new Date(
        `${startDate}T12:00:00Z`
    );

    const end = new Date(
        `${endDate}T12:00:00Z`
    );

    const sameMonth =
        start.getUTCMonth() ===
        end.getUTCMonth();

    const sameYear =
        start.getUTCFullYear() ===
        end.getUTCFullYear();

    const startText =
        new Intl.DateTimeFormat(
            "en-US",
            {
                day: "numeric",
                month: "long",
                timeZone: "UTC",
            }
        ).format(start);

    const endText =
        new Intl.DateTimeFormat(
            "en-US",
            {
                day: "numeric",
                month: "long",
                timeZone: "UTC",
            }
        ).format(end);

    if (
        sameMonth &&
        sameYear
    ) {
        return `${startText} – ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
    }

    if (sameYear) {
        return `${startText} – ${endText}, ${end.getUTCFullYear()}`;
    }

    return `${startText}, ${start.getUTCFullYear()} – ${endText}, ${end.getUTCFullYear()}`;
}

export default function WeeklyRecord({
    startDate,
    endDate,
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

    /*
     * Both OFF days and days with
     * zero tasks open the modal.
     */
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
                {/* Period heading */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2 text-xs text-(--text-secondary) sm:text-sm">
                            <CalendarDays
                                size={15}
                                className="shrink-0 sm:h-4 sm:w-4"
                            />

                            <span>
                                Previous Week
                            </span>
                        </div>

                        <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                            {formatDateRange(
                                startDate,
                                endDate
                            )}
                        </h2>
                    </div>

                    <div className="text-xs text-(--text-secondary) sm:text-sm">
                        {days.filter(
                            (day) =>
                                day.stats
                                    .totalTasks >
                                0
                        ).length}{" "}
                        working ·{" "}
                        {days.filter(
                            (day) =>
                                day.stats
                                    .totalTasks ===
                                0
                        ).length}{" "}
                        off
                    </div>
                </div>

                {/* Calendar */}
                <div className="overflow-hidden rounded-xl border border-(--border) bg-(--navy-900)">
                    {/* Weekday labels */}
                    <div className="grid grid-cols-7 border-b border-(--border)">
                        {weekdays.map(
                            (
                                weekday
                            ) => (
                                <div
                                    key={
                                        weekday
                                    }
                                    className="border-r border-(--border) px-0.5 py-2.5 text-center text-[10px] font-medium text-(--text-secondary) last:border-r-0 min-[400px]:px-1.5 sm:px-4 sm:py-3 sm:text-xs"
                                >
                                    {
                                        weekday
                                    }
                                </div>
                            )
                        )}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7">
                        {days.map(
                            (
                                day
                            ) => {
                                /*
                                 * A day is considered OFF when:
                                 *
                                 * 1. Its explicit dayType is OFF
                                 * OR
                                 * 2. It has zero tasks.
                                 */
                                const isOff =
                                    day.dayType ===
                                    "OFF" ||
                                    day.stats
                                        .totalTasks ===
                                    0;

                                return (
                                    <button
                                        key={
                                            day.date
                                        }
                                        type="button"
                                        onClick={() =>
                                            handleDayClick(
                                                day
                                            )
                                        }
                                        className={[
                                            "group relative min-h-27.5 border-r border-b border-(--border) p-1.5 text-left transition last:border-r-0 min-[400px]:min-h-30 min-[400px]:p-2 sm:min-h-40 sm:p-4",
                                            isOff
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
                                            {new Date(
                                                `${day.date}T12:00:00Z`
                                            ).getUTCDate()}
                                        </span>

                                        {/* Tablet / Desktop: Date */}
                                        <div className="hidden sm:flex">
                                            <div
                                                className={[
                                                    "data text-sm font-semibold sm:text-lg",
                                                    isOff
                                                        ? "text-red-400"
                                                        : "text-white",
                                                ].join(
                                                    " "
                                                )}
                                            >
                                                {new Date(
                                                    `${day.date}T12:00:00Z`
                                                ).getUTCDate()}
                                            </div>
                                        </div>

                                        {/* OFF DAY / NO TASKS
                                            Desktop only */}
                                        {isOff ? (
                                            <div className="mt-3 hidden text-[9px] leading-tight text-(--text-secondary) min-[400px]:mt-4 min-[400px]:text-[10px] sm:mt-6 sm:block sm:text-xs">
                                                Off
                                                day
                                            </div>
                                        ) : (
                                            /* WORKING DAY
                                               Desktop only */
                                            <div className="mt-3 hidden space-y-1 min-[400px]:mt-4 min-[400px]:space-y-1.5 sm:mt-5 sm:block">
                                                {/* Tasks */}
                                                <div className="flex items-center justify-between gap-1 text-[8px] leading-tight min-[400px]:text-[9px] sm:text-[11px]">
                                                    <span className="truncate text-(--text-secondary)">
                                                        Tasks
                                                    </span>

                                                    <span className="data shrink-0">
                                                        {
                                                            day
                                                                .stats
                                                                .totalTasks
                                                        }
                                                    </span>
                                                </div>

                                                {/* Score */}
                                                <div className="flex items-center justify-between gap-1 text-[8px] leading-tight min-[400px]:text-[9px] sm:text-[11px]">
                                                    <span className="truncate text-(--text-secondary)">
                                                        Score
                                                    </span>

                                                    <span className="data shrink-0">
                                                        {
                                                            day
                                                                .stats
                                                                .score
                                                        }
                                                    </span>
                                                </div>

                                                {/* Checked */}
                                                <div className="flex items-center justify-between gap-1 text-[8px] leading-tight min-[400px]:text-[9px] sm:text-[11px]">
                                                    <span className="truncate text-(--text-secondary)">
                                                        Checked
                                                    </span>

                                                    <span className="data shrink-0">
                                                        {
                                                            day
                                                                .stats
                                                                .checked
                                                        }
                                                        /
                                                        {
                                                            day
                                                                .stats
                                                                .totalTasks
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Working days only have report arrow - desktop/tablet */}
                                        {!isOff && (
                                            <div className="absolute bottom-1 right-1 hidden opacity-0 transition group-hover:opacity-100 sm:bottom-3 sm:right-3 sm:block">
                                                <ChevronRight
                                                    size={
                                                        15
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

                {/* Mobile interaction hint */}
                <p className="text-center text-[10px] text-(--text-secondary) sm:hidden">
                    Tap any day to view its report
                </p>

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

            {/* Day report modal */}
            <DayReportModal
                day={selectedDay}
                onClose={
                    handleClose
                }
            />
        </>
    );
}