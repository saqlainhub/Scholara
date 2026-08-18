"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CircleOff,
    Clock3,
    ClipboardList,
    Trophy,
    XCircle,
} from "lucide-react";

import Link from "next/link";

import DayTasks from "./DayTasks";

import type {
    RecordStats,
} from "@/lib/student-records/types";

type DayRecordResponse = {
    date: string;
    dayName: string;
    shortDayName: string;
    dayType:
        | "WORKING"
        | "OFF";
    stats: RecordStats;
};

type Props = {
    params: Promise<{
        date: string;
    }>;
};

function formatDate(
    date: string
) {
    const value =
        new Date(
            `${date}T12:00:00Z`
        );

    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    ).format(value);
}

function StatBox({
    label,
    value,
    icon,
    description,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
}) {
    return (
        <div
            className="
                min-w-0
                rounded-2xl
                border
                border-(--border)
                bg-(--navy-900)
                p-4
                sm:p-5
            "
        >
            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-3
                    sm:gap-4
                "
            >
                <div className="min-w-0">
                    <p
                        className="
                            text-[10px]
                            uppercase
                            tracking-wider
                            text-(--text-secondary)
                            sm:text-xs
                        "
                    >
                        {label}
                    </p>

                    <p
                        className="
                            mt-2
                            text-xl
                            font-semibold
                            sm:mt-3
                            sm:text-2xl
                        "
                    >
                        {value}
                    </p>

                    {description && (
                        <p
                            className="
                                mt-1
                                text-xs
                                leading-5
                                text-(--text-secondary)
                            "
                        >
                            {description}
                        </p>
                    )}
                </div>

                <div
                    className="
                        shrink-0
                        rounded-xl
                        border
                        border-(--border)
                        p-2
                        text-(--gold-500)
                        sm:p-2.5
                    "
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

export default function DayReportPage({
    params,
}: Props) {
    const [
        date,
        setDate,
    ] = useState<string | null>(
        null
    );

    const [
        record,
        setRecord,
    ] =
        useState<DayRecordResponse | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    /*
     * Resolve the dynamic route parameter.
     */
    useEffect(() => {
        params.then(
            ({
                date,
            }) => {
                setDate(date);
            }
        );
    }, [params]);

    /*
     * Load the selected day's report.
     */
    useEffect(() => {
        if (!date) {
            return;
        }

        const requestedDate =
            date;

        async function loadRecord() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `/api/student/records/day/${encodeURIComponent(
                            requestedDate
                        )}`,
                        {
                            cache:
                                "no-store",
                            credentials:
                                "include",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to load day report."
                    );
                }

                setRecord(data);
            } catch (error) {
                console.error(
                    "DAY REPORT ERROR:",
                    error
                );

                setError(
                    error instanceof
                        Error
                        ? error.message
                        : "Failed to load day report."
                );
            } finally {
                setLoading(false);
            }
        }

        loadRecord();
    }, [date]);

    /*
     * Loading state.
     */
    if (loading || !date) {
        return (
            <main
                className="
                    min-w-0
                    p-4
                    sm:p-6
                    lg:p-8
                "
            >
                <div
                    className="
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        p-8
                        text-center
                        text-sm
                        text-(--text-secondary)
                        sm:p-12
                    "
                >
                    Loading day report...
                </div>
            </main>
        );
    }

    /*
     * Error state.
     */
    if (error || !record) {
        return (
            <main
                className="
                    min-w-0
                    space-y-5
                    p-4
                    sm:space-y-6
                    sm:p-6
                    lg:p-8
                "
            >
                <Link
                    href="/student/records"
                    className="
                        inline-flex
                        min-h-10
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-(--border)
                        px-3
                        py-2
                        text-sm
                        text-(--text-secondary)
                        transition
                        hover:border-(--gold-500)
                        hover:text-(--gold-500)
                    "
                >
                    <ArrowLeft
                        size={16}
                    />

                    Back to Records
                </Link>

                <div
                    className="
                        rounded-2xl
                        border
                        border-red-400/30
                        bg-red-400/5
                        p-5
                        text-sm
                        leading-6
                        text-red-300
                        sm:p-8
                    "
                >
                    {error ||
                        "Day report not found."}
                </div>
            </main>
        );
    }

    const stats =
        record.stats;

    /*
     * A day is considered OFF when:
     *
     * 1. Backend explicitly marks it as OFF
     * OR
     * 2. There are zero tasks.
     *
     * This means even if the backend incorrectly
     * returns WORKING with totalTasks = 0,
     * the UI will still correctly show OFF DAY.
     */
    const isOffDay =
        record.dayType === "OFF" ||
        stats.totalTasks === 0;

    return (
        <main
            className="
                min-w-0
                space-y-6
                overflow-x-hidden
                p-4
                sm:space-y-8
                sm:p-6
                lg:p-8
            "
        >
            {/* =========================
                HEADER
               ========================= */}

            <section className="min-w-0">
                <Link
                    href="/student/records"
                    className="
                        mb-4
                        inline-flex
                        min-h-10
                        items-center
                        gap-2
                        rounded-lg
                        border
                        border-(--border)
                        px-3
                        py-2
                        text-xs
                        text-(--text-secondary)
                        transition
                        hover:border-(--gold-500)
                        hover:text-(--gold-500)
                        sm:mb-5
                        sm:text-sm
                    "
                >
                    <ArrowLeft
                        size={15}
                        className="sm:h-4 sm:w-4"
                    />

                    Back to Records
                </Link>

                <div
                    className="
                        flex
                        min-w-0
                        flex-col
                        justify-between
                        gap-4
                        lg:flex-row
                        lg:items-end
                    "
                >
                    <div className="min-w-0">
                        <p
                            className="
                                mb-1.5
                                text-[10px]
                                font-medium
                                uppercase
                                tracking-[0.22em]
                                text-(--gold-500)
                                sm:mb-2
                                sm:text-xs
                                sm:tracking-[0.25em]
                            "
                        >
                            Student Records
                        </p>

                        <h1
                            className="
                                break-words
                                text-2xl
                                font-semibold
                                leading-8
                                tracking-wide
                                sm:text-3xl
                            "
                        >
                            {record.dayName}
                        </h1>

                        <div
                            className="
                                mt-2.5
                                flex
                                min-w-0
                                flex-wrap
                                items-center
                                gap-2.5
                                text-xs
                                text-(--text-secondary)
                                sm:mt-3
                                sm:gap-3
                                sm:text-sm
                            "
                        >
                            <span
                                className="
                                    inline-flex
                                    min-w-0
                                    items-center
                                    gap-1.5
                                "
                            >
                                <CalendarDays
                                    size={15}
                                    className="shrink-0 sm:h-4 sm:w-4"
                                />

                                <span className="break-words">
                                    {formatDate(
                                        record.date
                                    )}
                                </span>
                            </span>

                            <span
                                className={[
                                    "rounded-lg border px-2.5 py-1.5 text-[10px] sm:px-3 sm:text-xs",
                                    isOffDay
                                        ? "border-slate-400/30 text-slate-300"
                                        : "border-green-400/30 text-green-300",
                                ].join(
                                    " "
                                )}
                            >
                                {isOffDay
                                    ? "Off Day"
                                    : "Working Day"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================
                OFF DAY
               ========================= */}

            {isOffDay && (
                <section
                    className="
                        flex
                        min-h-72
                        flex-col
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-5
                        py-10
                        text-center
                        sm:min-h-80
                        sm:px-6
                    "
                >
                    {/* Icon */}

                    <div
                        className="
                            mb-4
                            flex
                            h-16
                            w-16
                            items-center
                            justify-center
                            rounded-full
                            border
                            border-(--border)
                            bg-(--navy-800)
                            sm:mb-5
                            sm:h-20
                            sm:w-20
                        "
                    >
                        <CircleOff
                            size={29}
                            className="
                                text-(--text-secondary)
                                sm:h-[34px]
                                sm:w-[34px]
                            "
                        />
                    </div>

                    {/* Badge */}

                    <div
                        className="
                            mb-2.5
                            rounded-full
                            border
                            border-slate-400/20
                            bg-slate-400/10
                            px-3
                            py-1.5
                            text-[10px]
                            font-medium
                            tracking-wide
                            text-slate-400
                            sm:mb-3
                            sm:text-xs
                        "
                    >
                        OFF DAY
                    </div>

                    {/* Heading */}

                    <h2
                        className="
                            text-xl
                            font-semibold
                            leading-7
                            sm:text-2xl
                        "
                    >
                        No Academic Tasks
                    </h2>

                    {/* Description */}

                    <p
                        className="
                            mt-2
                            max-w-lg
                            text-xs
                            leading-5
                            text-(--text-secondary)
                            sm:text-sm
                            sm:leading-6
                        "
                    >
                        No academic tasks were
                        scheduled for this date.
                        There is no daily
                        performance record to
                        display.
                    </p>
                </section>
            )}

            {/* =========================
                WORKING DAY CONTENT
               ========================= */}

            {!isOffDay && (
                <>
                    {/* SUMMARY BOXES */}

                    <section className="min-w-0">
                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-3
                                sm:grid-cols-2
                                sm:gap-4
                                xl:grid-cols-5
                            "
                        >
                            <StatBox
                                label="Total Tasks"
                                value={
                                    stats.totalTasks
                                }
                                icon={
                                    <ClipboardList
                                        size={
                                            18
                                        }
                                    />
                                }
                            />

                            <StatBox
                                label="Submitted"
                                value={
                                    stats.submitted
                                }
                                icon={
                                    <CheckCircle2
                                        size={
                                            18
                                        }
                                    />
                                }
                            />

                            <StatBox
                                label="Checked"
                                value={
                                    stats.checked
                                }
                                icon={
                                    <CheckCircle2
                                        size={
                                            18
                                        }
                                    />
                                }
                            />

                            <StatBox
                                label="Score"
                                value={
                                    stats.score
                                }
                                icon={
                                    <Trophy
                                        size={
                                            18
                                        }
                                    />
                                }
                            />

                            <StatBox
                                label="Position"
                                value={
                                    stats.position !==
                                    null
                                        ? `#${stats.position}`
                                        : "—"
                                }
                                icon={
                                    <Trophy
                                        size={
                                            18
                                        }
                                    />
                                }
                            />
                        </div>
                    </section>

                    {/* PERFORMANCE SUMMARY */}

                    <section
                        className="
                            min-w-0
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            p-4
                            sm:p-6
                        "
                    >
                        <div
                            className="
                                flex
                                min-w-0
                                flex-col
                                justify-between
                                gap-4
                                sm:flex-row
                                sm:items-center
                                sm:gap-5
                            "
                        >
                            <div className="min-w-0">
                                <h2 className="font-semibold">
                                    Day Summary
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        leading-5
                                        text-(--text-secondary)
                                        sm:text-sm
                                    "
                                >
                                    Your task
                                    performance
                                    for this
                                    day.
                                </p>
                            </div>

                            <div
                                className={[
                                    "inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:px-4 sm:text-sm",
                                    stats.status ===
                                    "TOP"
                                        ? "border-green-400/30 text-green-300"
                                        : stats.status ===
                                            "WEAK"
                                          ? "border-red-400/30 text-red-300"
                                          : "border-(--gold-500)/30 text-(--gold-500)",
                                ].join(
                                    " "
                                )}
                            >
                                {stats.status ===
                                "TOP" ? (
                                    <CheckCircle2
                                        size={
                                            15
                                        }
                                    />
                                ) : stats.status ===
                                  "WEAK" ? (
                                    <XCircle
                                        size={
                                            15
                                        }
                                    />
                                ) : (
                                    <Clock3
                                        size={
                                            15
                                        }
                                    />
                                )}

                                {stats.status}
                            </div>
                        </div>

                        <div
                            className="
                                mt-5
                                grid
                                grid-cols-2
                                gap-3
                                sm:mt-6
                                sm:grid-cols-4
                                sm:gap-4
                            "
                        >
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-(--border)
                                    p-3
                                    sm:p-4
                                "
                            >
                                <p
                                    className="
                                        text-[10px]
                                        text-(--text-secondary)
                                        sm:text-xs
                                    "
                                >
                                    Submitted
                                </p>

                                <p
                                    className="
                                        mt-1.5
                                        text-base
                                        font-semibold
                                        sm:mt-2
                                        sm:text-lg
                                    "
                                >
                                    {
                                        stats.submitted
                                    }
                                </p>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-(--border)
                                    p-3
                                    sm:p-4
                                "
                            >
                                <p
                                    className="
                                        text-[10px]
                                        text-(--text-secondary)
                                        sm:text-xs
                                    "
                                >
                                    Unsubmitted
                                </p>

                                <p
                                    className="
                                        mt-1.5
                                        text-base
                                        font-semibold
                                        sm:mt-2
                                        sm:text-lg
                                    "
                                >
                                    {
                                        stats.unsubmitted
                                    }
                                </p>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-(--border)
                                    p-3
                                    sm:p-4
                                "
                            >
                                <p
                                    className="
                                        text-[10px]
                                        text-(--text-secondary)
                                        sm:text-xs
                                    "
                                >
                                    On Time
                                </p>

                                <p
                                    className="
                                        mt-1.5
                                        text-base
                                        font-semibold
                                        text-green-300
                                        sm:mt-2
                                        sm:text-lg
                                    "
                                >
                                    {
                                        stats.ontime
                                    }
                                </p>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-(--border)
                                    p-3
                                    sm:p-4
                                "
                            >
                                <p
                                    className="
                                        text-[10px]
                                        text-(--text-secondary)
                                        sm:text-xs
                                    "
                                >
                                    Delayed
                                </p>

                                <p
                                    className="
                                        mt-1.5
                                        text-base
                                        font-semibold
                                        text-red-300
                                        sm:mt-2
                                        sm:text-lg
                                    "
                                >
                                    {
                                        stats.delayed
                                    }
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* =========================
                        DAILY TASKS
                       ========================= */}

                    <DayTasks
                        date={
                            record.date
                        }
                        dayName={
                            record.dayName
                        }
                    />
                </>
            )}
        </main>
    );
}