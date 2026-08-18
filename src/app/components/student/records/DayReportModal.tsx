"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    CircleGauge,
    CircleOff,
    ClipboardCheck,
    ClipboardList,
    Clock3,
    Trophy,
    X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import type {
    DayRecord,
    RecordStats,
} from "@/lib/student-records/types";

type Props = {
    day: DayRecord | null;
    onClose: () => void;
};

type DayResponse = {
    date: string;
    stats: RecordStats;
    day: DayRecord | null;
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        }
    ).format(
        new Date(
            `${date}T12:00:00Z`
        )
    );
}

function StatItem({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value:
        | string
        | number
        | null
        | undefined;
    icon: typeof ClipboardList;
}) {
    return (
        <div
            className="
                min-w-0
                rounded-lg
                border
                border-(--border)
                bg-(--navy-800)
                p-2.5
                min-[400px]:p-3
            "
        >
            <div
                className="
                    mb-2.5
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-md
                    border
                    border-(--border)
                    min-[400px]:mb-3
                "
            >
                <Icon
                    size={15}
                    className="text-(--gold-400)"
                />
            </div>

            <div className="data truncate text-lg font-semibold">
                {value ?? "—"}
            </div>

            <div className="mt-0.5 truncate text-[10px] leading-4 text-(--text-secondary) min-[400px]:text-[11px]">
                {label}
            </div>
        </div>
    );
}

export default function DayReportModal({
    day,
    onClose,
}: Props) {
    const router = useRouter();

    const [data, setData] =
        useState<DayResponse | null>(
            null
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    /*
     * Load the selected day.
     */
    useEffect(() => {
        if (!day) {
            setData(null);
            setError("");
            setLoading(false);

            return;
        }

        const dayIsOff =
            day.dayType === "OFF" ||
            day.stats.totalTasks === 0;

        /*
         * OFF DAY
         *
         * No report API request.
         */
        if (dayIsOff) {
            setData(null);
            setError("");
            setLoading(false);

            return;
        }

        const date = day.date;

        let cancelled = false;

        async function loadDay() {
            try {
                setLoading(true);
                setError("");
                setData(null);

                const response =
                    await fetch(
                        `/api/student/records/day/${encodeURIComponent(
                            date
                        )}`,
                        {
                            cache: "no-store",
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        `Failed to load day report. Status: ${response.status}`
                    );
                }

                const result =
                    (await response.json()) as DayResponse;

                if (cancelled) {
                    return;
                }

                setData(result);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Day report error:",
                    error
                );

                setError(
                    "Unable to load this day report."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDay();

        return () => {
            cancelled = true;
        };
    }, [day]);

    /*
     * Escape key + body scroll lock.
     */
    useEffect(() => {
        if (!day) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (
                event.key === "Escape"
            ) {
                onClose();
            }
        }

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        const originalOverflow =
            document.body.style
                .overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow =
                originalOverflow;
        };
    }, [day, onClose]);

    /*
     * Modal closed.
     */
    if (!day) {
        return null;
    }

    /*
     * IMPORTANT:
     *
     * Create a non-null local reference.
     *
     * TypeScript now knows that selectedDay
     * can NEVER be null.
     */
    const selectedDay = day;

    /*
     * Initial day status.
     */
    const isOffDay =
        selectedDay.dayType ===
            "OFF" ||
        selectedDay.stats
            .totalTasks === 0;

    /*
     * API response can also identify
     * a zero-task day as OFF.
     */
    const responseIsOffDay =
        data?.day?.dayType ===
            "OFF" ||
        data?.stats.totalTasks ===
            0;

    const shouldShowOffDay =
        isOffDay ||
        responseIsOffDay;

    /*
     * View Report button.
     *
     * Opens:
     *
     * /student/records/day/[date]
     */
    function handleViewReport() {
        if (shouldShowOffDay) {
            return;
        }

        const reportDate =
            selectedDay.date;

        onClose();

        router.push(
            `/student/records/day/${encodeURIComponent(
                reportDate
            )}`
        );
    }

    const showViewReport =
        !shouldShowOffDay;

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-end
                justify-center
                bg-black/70
                p-0
                backdrop-blur-sm
                sm:items-center
                sm:p-4
            "
            onMouseDown={(
                event
            ) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    flex
                    max-h-[94dvh]
                    w-full
                    max-w-2xl
                    flex-col
                    overflow-hidden
                    rounded-t-2xl
                    border
                    border-(--border)
                    bg-(--navy-950)
                    shadow-2xl
                    sm:max-h-[calc(100dvh-2rem)]
                    sm:rounded-2xl
                "
            >
                {/* Header */}
                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        gap-3
                        border-b
                        border-(--border)
                        px-4
                        py-3.5
                        min-[400px]:px-5
                        min-[400px]:py-4
                    "
                >
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-(--text-secondary) min-[400px]:text-xs">
                            <CalendarDays
                                size={14}
                                className="shrink-0"
                            />

                            <span>
                                Day Report
                            </span>
                        </div>

                        <h2
                            className="
                                mt-1
                                truncate
                                text-base
                                font-semibold
                                min-[400px]:text-lg
                            "
                        >
                            {formatDate(
                                selectedDay.date
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            border
                            border-(--border)
                            text-(--text-secondary)
                            transition
                            hover:bg-(--navy-800)
                            hover:text-(--text-primary)
                            active:scale-95
                        "
                        aria-label="Close"
                    >
                        <X
                            size={18}
                        />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="
                        scholar-scrollbar
                        min-h-0
                        flex-1
                        overflow-y-auto
                        p-3.5
                        min-[400px]:p-4
                        sm:p-5
                    "
                >
                    {/* OFF DAY */}
                    {shouldShowOffDay && (
                        <div
                            className="
                                flex
                                min-h-60
                                flex-col
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                px-4
                                text-center
                                min-[400px]:min-h-64
                                min-[400px]:px-5
                            "
                        >
                            <div
                                className="
                                    mb-4
                                    flex
                                    h-14
                                    w-14
                                    items-center
                                    justify-center
                                    rounded-full
                                    border
                                    border-(--border)
                                    bg-(--navy-800)
                                    min-[400px]:mb-5
                                    min-[400px]:h-16
                                    min-[400px]:w-16
                                "
                            >
                                <CircleOff
                                    size={26}
                                    className="text-(--text-secondary) min-[400px]:size-7"
                                />
                            </div>

                            <div className="mb-2 rounded-full border border-slate-400/20 bg-slate-400/10 px-3 py-1 text-[10px] font-medium text-slate-400 min-[400px]:text-xs">
                                OFF DAY
                            </div>

                            <h3 className="text-lg font-semibold min-[400px]:text-xl">
                                No Academic
                                Tasks
                            </h3>

                            <p className="mt-2 max-w-md text-xs leading-5 text-(--text-secondary) min-[400px]:text-sm min-[400px]:leading-6">
                                No academic
                                tasks were
                                scheduled
                                for this
                                date.
                            </p>
                        </div>
                    )}

                    {/* WORKING DAY */}
                    {!shouldShowOffDay && (
                        <>
                            {/* Loading */}
                            {loading && (
                                <div className="space-y-3">
                                    <div className="h-14 animate-pulse rounded-xl bg-(--navy-900) min-[400px]:h-16" />

                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {Array.from(
                                            {
                                                length: 8,
                                            }
                                        ).map(
                                            (
                                                _,
                                                index
                                            ) => (
                                                <div
                                                    key={
                                                        index
                                                    }
                                                    className="h-22 animate-pulse rounded-lg bg-(--navy-900) min-[400px]:h-24"
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {!loading &&
                                error && (
                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs leading-5 text-red-400 min-[400px]:p-4 min-[400px]:text-sm">
                                        {
                                            error
                                        }
                                    </div>
                                )}

                            {/* No data */}
                            {!loading &&
                                !error &&
                                !data && (
                                    <div className="rounded-xl border border-(--border) bg-(--navy-900) p-5 text-center min-[400px]:p-6">
                                        <p className="text-xs text-(--text-secondary) min-[400px]:text-sm">
                                            No report
                                            data was
                                            returned
                                            for this
                                            date.
                                        </p>
                                    </div>
                                )}

                            {/* Report */}
                            {!loading &&
                                !error &&
                                data &&
                                !responseIsOffDay && (
                                    <div className="space-y-4 min-[400px]:space-y-5">

                                        {/* Day Status */}
                                        <div
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                rounded-xl
                                                border
                                                border-(--border)
                                                bg-(--navy-900)
                                                p-3.5
                                                min-[400px]:p-4
                                            "
                                        >
                                            <div>
                                                <div className="text-[11px] text-(--text-secondary) min-[400px]:text-xs">
                                                    Day
                                                    Status
                                                </div>

                                                <div className="mt-1 text-sm font-semibold min-[400px]:text-base">
                                                    Working
                                                    Day
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            <StatItem
                                                label="Total Tasks"
                                                value={
                                                    data
                                                        .stats
                                                        .totalTasks
                                                }
                                                icon={
                                                    ClipboardList
                                                }
                                            />

                                            <StatItem
                                                label="Submitted"
                                                value={
                                                    data
                                                        .stats
                                                        .submitted
                                                }
                                                icon={
                                                    CheckCircle2
                                                }
                                            />

                                            <StatItem
                                                label="Unsubmitted"
                                                value={
                                                    data
                                                        .stats
                                                        .unsubmitted
                                                }
                                                icon={
                                                    X
                                                }
                                            />

                                            <StatItem
                                                label="Delayed"
                                                value={
                                                    data
                                                        .stats
                                                        .delayed
                                                }
                                                icon={
                                                    CircleAlert
                                                }
                                            />

                                            <StatItem
                                                label="On Time"
                                                value={
                                                    data
                                                        .stats
                                                        .ontime
                                                }
                                                icon={
                                                    Clock3
                                                }
                                            />

                                            <StatItem
                                                label="Checked"
                                                value={
                                                    data
                                                        .stats
                                                        .checked
                                                }
                                                icon={
                                                    ClipboardCheck
                                                }
                                            />

                                            <StatItem
                                                label="Unchecked"
                                                value={
                                                    data
                                                        .stats
                                                        .unchecked
                                                }
                                                icon={
                                                    CircleOff
                                                }
                                            />

                                            <StatItem
                                                label="Score"
                                                value={
                                                    data
                                                        .stats
                                                        .score
                                                }
                                                icon={
                                                    CircleGauge
                                                }
                                            />
                                        </div>

                                        {/* Performance */}
                                        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">

                                            {/* Leaderboard */}
                                            <div
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-(--border)
                                                    bg-(--navy-900)
                                                    p-3.5
                                                    min-[400px]:p-4
                                                "
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            border-(--border)
                                                            bg-(--navy-800)
                                                            min-[400px]:h-10
                                                            min-[400px]:w-10
                                                        "
                                                    >
                                                        <Trophy
                                                            size={
                                                                17
                                                            }
                                                            className="text-(--gold-400)"
                                                        />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="text-[11px] text-(--text-secondary) min-[400px]:text-xs">
                                                            Leaderboard
                                                            Position
                                                        </div>

                                                        <div className="mt-0.5 data text-lg font-semibold min-[400px]:text-xl">
                                                            {data
                                                                .stats
                                                                .position !==
                                                                null &&
                                                            data
                                                                .stats
                                                                .position !==
                                                                undefined
                                                                ? `#${data.stats.position}`
                                                                : "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance */}
                                            <div
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-(--border)
                                                    bg-(--navy-900)
                                                    p-3.5
                                                    min-[400px]:p-4
                                                "
                                            >
                                                <div className="text-[11px] text-(--text-secondary) min-[400px]:text-xs">
                                                    Performance
                                                    Status
                                                </div>

                                                <div
                                                    className={[
                                                        "mt-1 truncate text-lg font-semibold min-[400px]:text-xl",
                                                        data
                                                            .stats
                                                            .status ===
                                                        "TOP"
                                                            ? "text-(--gold-400)"
                                                            : data
                                                                  .stats
                                                                  .status ===
                                                                "WEAK"
                                                              ? "text-red-400"
                                                              : "text-(--text-primary)",
                                                    ].join(
                                                        " "
                                                    )}
                                                >
                                                    {data
                                                        .stats
                                                        .status ??
                                                        "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="
                        flex
                        shrink-0
                        flex-col-reverse
                        gap-2.5
                        border-t
                        border-(--border)
                        px-3.5
                        py-3
                        min-[400px]:px-4
                        min-[400px]:py-3.5
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        sm:gap-3
                        sm:px-5
                        sm:py-4
                    "
                >
                    {/* View Report */}
                    {showViewReport ? (
                        <button
                            type="button"
                            onClick={
                                handleViewReport
                            }
                            className="
                                inline-flex
                                min-h-11
                                w-full
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                bg-(--gold-500)
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-black
                                shadow-sm
                                transition
                                hover:opacity-90
                                active:scale-[0.99]
                                sm:w-auto
                            "
                        >
                            View Report

                            <ArrowRight
                                size={16}
                                strokeWidth={
                                    2.5
                                }
                            />
                        </button>
                    ) : (
                        <div className="hidden sm:block" />
                    )}

                    {/* Close */}
                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="
                            min-h-11
                            w-full
                            rounded-lg
                            border
                            border-(--border)
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-(--text-secondary)
                            transition
                            hover:bg-(--navy-800)
                            hover:text-(--text-primary)
                            active:scale-[0.99]
                            sm:w-auto
                        "
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}