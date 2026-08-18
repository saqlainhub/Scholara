"use client";

import {
    useState,
} from "react";

import {
    CalendarDays,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

import DayReportModal from "./DayReportModal";

import type {
    DayRecord,
    MonthlyOverview,
} from "@/lib/student-records/types";

type Props = {
    months: MonthlyOverview[];
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

function getMondayBasedDayIndex(
    date: string
) {
    const day =
        new Date(
            `${date}T00:00:00Z`
        ).getUTCDay();

    return day === 0
        ? 6
        : day - 1;
}

function formatMonthTitle(
    month: MonthlyOverview
) {
    return `${month.monthName} ${month.year}`;
}

export default function OverviewRecord({
    months,
}: Props) {
    const [
        openMonths,
        setOpenMonths,
    ] =
        useState<Set<string>>(
            () => {
                const current =
                    months.at(-1);

                return current
                    ? new Set([
                        `${current.year}-${current.month}`,
                    ])
                    : new Set();
            }
        );

    const [
        selectedDay,
        setSelectedDay,
    ] =
        useState<DayRecord | null>(
            null
        );

    function toggleMonth(
        key: string
    ) {
        setOpenMonths(
            (
                current
            ) => {
                const next =
                    new Set(
                        current
                    );

                if (
                    next.has(
                        key
                    )
                ) {
                    next.delete(
                        key
                    );
                } else {
                    next.add(
                        key
                    );
                }

                return next;
            }
        );
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
            <div className="space-y-3 sm:space-y-4">
                {months.map(
                    (
                        month
                    ) => {
                        const key = `${month.year}-${month.month}`;

                        const isOpen =
                            openMonths.has(
                                key
                            );

                        const firstDay =
                            month.days[0]
                                ? getMondayBasedDayIndex(
                                    month
                                        .days[0]
                                        .date
                                )
                                : 0;

                        const cells:
                            (
                                | string
                                | null
                            )[] =
                            [];

                        for (
                            let index = 0;
                            index <
                            firstDay;
                            index++
                        ) {
                            cells.push(
                                null
                            );
                        }

                        for (
                            const day of month.days
                        ) {
                            cells.push(
                                day.date
                            );
                        }

                        while (
                            cells.length %
                            7 !==
                            0
                        ) {
                            cells.push(
                                null
                            );
                        }

                        return (
                            <section
                                key={
                                    key
                                }
                                className="overflow-hidden rounded-xl border border-(--border) bg-(--navy-900)"
                            >
                                {/* Month header */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleMonth(
                                            key
                                        )
                                    }
                                    className="flex w-full items-center justify-between gap-2 px-3 py-3.5 text-left transition hover:bg-(--navy-800) active:bg-(--navy-800) sm:gap-4 sm:px-5 sm:py-4"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--border) bg-(--navy-950) sm:h-10 sm:w-10">
                                            <CalendarDays
                                                size={
                                                    16
                                                }
                                                className="text-(--gold-400) sm:size-[17px]"
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold sm:text-lg">
                                                {
                                                    formatMonthTitle(
                                                        month
                                                    )
                                                }{" "}
                                                <span className="font-normal text-(--text-secondary)">
                                                    ·{" "}
                                                    {
                                                        month.totalDays
                                                    }{" "}
                                                    days
                                                </span>
                                            </h3>

                                            <p className="mt-0.5 text-[10px] text-(--text-secondary) sm:text-xs">
                                                {
                                                    month
                                                        .stats
                                                        .workingDays
                                                }{" "}
                                                working
                                                {" · "}
                                                {
                                                    month
                                                        .stats
                                                        .offDays
                                                }{" "}
                                                off
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--border) sm:h-9 sm:w-9">
                                        {isOpen ? (
                                            <ChevronDown
                                                size={
                                                    16
                                                }
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={
                                                    16
                                                }
                                            />
                                        )}
                                    </div>
                                </button>

                                {/* Month content */}
                                {isOpen && (
                                    <div className="border-t border-(--border)">
                                        {/* Weekdays */}
                                        <div className="grid grid-cols-7 border-b border-(--border)">
                                            {weekdays.map(
                                                (
                                                    weekday
                                                ) => (
                                                    <div
                                                        key={
                                                            weekday
                                                        }
                                                        className="border-r border-(--border) px-0.5 py-2 text-center text-[9px] font-medium text-(--text-secondary) last:border-r-0 min-[400px]:text-[10px] sm:px-2 sm:py-3 sm:text-xs"
                                                    >
                                                        {
                                                            weekday
                                                        }
                                                    </div>
                                                )
                                            )}
                                        </div>

                                        {/* Dates */}
                                        <div className="grid grid-cols-7">
                                            {cells.map(
                                                (
                                                    date,
                                                    index
                                                ) => {
                                                    if (
                                                        !date
                                                    ) {
                                                        return (
                                                            <div
                                                                key={`empty-${index}`}
                                                                className="min-h-14 border-r border-b border-(--border) bg-(--navy-950)/40 min-[400px]:min-h-16 sm:min-h-28"
                                                            />
                                                        );
                                                    }

                                                    const day =
                                                        month.days.find(
                                                            (
                                                                item
                                                            ) =>
                                                                item.date ===
                                                                date
                                                        );

                                                    if (
                                                        !day
                                                    ) {
                                                        return null;
                                                    }

                                                    const isOff =
                                                        day.dayType ===
                                                        "OFF";

                                                    return (
                                                        <button
                                                            key={
                                                                date
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                handleDayClick(
                                                                    day
                                                                )
                                                            }
                                                            className={[
                                                                "group relative min-h-14 border-r border-b border-(--border) p-1.5 text-left transition active:bg-(--navy-800) min-[400px]:min-h-16 min-[400px]:p-2 sm:min-h-28 sm:p-3",
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
                                                                {Number(
                                                                    date.slice(
                                                                        8,
                                                                        10
                                                                    )
                                                                )}
                                                            </span>

                                                            {/* Tablet / Desktop: Date */}
                                                            <div className="hidden items-start justify-between gap-1 sm:flex">
                                                                <span
                                                                    className={[
                                                                        "data text-xs font-semibold sm:text-sm",
                                                                        isOff
                                                                            ? "text-red-400"
                                                                            : "text-white",
                                                                    ].join(
                                                                        " "
                                                                    )}
                                                                >
                                                                    {Number(
                                                                        date.slice(
                                                                            8,
                                                                            10
                                                                        )
                                                                    )}
                                                                </span>
                                                            </div>

                                                            {/* Desktop / Tablet: OFF DAY */}
                                                            {isOff ? (
                                                                <div className="mt-2 hidden text-[8px] leading-tight text-(--text-secondary) min-[400px]:mt-3 min-[400px]:text-[9px] sm:mt-4 sm:block sm:text-xs">
                                                                    Off
                                                                    day
                                                                </div>
                                                            ) : (
                                                                /* Desktop / Tablet: WORKING DAY */
                                                                <div className="mt-2 hidden space-y-1 min-[400px]:mt-2.5 sm:mt-3 sm:block">
                                                                    {/* Tasks */}
                                                                    <div className="flex justify-between gap-1 text-[7px] leading-tight min-[400px]:text-[8px] sm:text-[10px]">
                                                                        <span className="text-(--text-secondary)">
                                                                            Tasks
                                                                        </span>

                                                                        <span className="data">
                                                                            {
                                                                                day
                                                                                    .stats
                                                                                    .totalTasks
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    {/* Score */}
                                                                    <div className="flex justify-between gap-1 text-[7px] leading-tight min-[400px]:text-[8px] sm:text-[10px]">
                                                                        <span className="text-(--text-secondary)">
                                                                            Score
                                                                        </span>

                                                                        <span className="data">
                                                                            {
                                                                                day
                                                                                    .stats
                                                                                    .score
                                                                            }
                                                                        </span>
                                                                    </div>

                                                                    {/* Checked */}
                                                                    <div className="hidden justify-between gap-1 text-[10px] sm:flex">
                                                                        <span className="text-(--text-secondary)">
                                                                            Checked
                                                                        </span>

                                                                        <span className="data">
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

                                                            {/* Desktop / Tablet: Working days only show arrow */}
                                                            {!isOff && (
                                                                <div className="absolute right-1 bottom-1 hidden opacity-0 transition group-hover:opacity-100 sm:right-2 sm:bottom-2 sm:block">
                                                                    <ChevronRight
                                                                        size={
                                                                            13
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

                                        {/* Month summary */}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-(--border) px-3 py-3 text-[10px] text-(--text-secondary) min-[400px]:text-xs sm:flex sm:flex-wrap sm:gap-x-5 sm:px-4">
                                            <span>
                                                Tasks:{" "}
                                                <strong className="data font-medium text-(--text-primary)">
                                                    {
                                                        month
                                                            .stats
                                                            .totalTasks
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Submitted:{" "}
                                                <strong className="data font-medium text-(--text-primary)">
                                                    {
                                                        month
                                                            .stats
                                                            .submitted
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Checked:{" "}
                                                <strong className="data font-medium text-(--text-primary)">
                                                    {
                                                        month
                                                            .stats
                                                            .checked
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Score:{" "}
                                                <strong className="data font-medium text-(--text-primary)">
                                                    {
                                                        month
                                                            .stats
                                                            .score
                                                    }
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                )}


                                
                            </section>
                            
                        );
                    }
                )}

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
            </div>

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