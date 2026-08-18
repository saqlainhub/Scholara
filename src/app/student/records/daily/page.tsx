"use client";

import {
    useEffect,
    useState,
} from "react";

import Link from "next/link";

import {
    ArrowRight,
    CalendarDays,
    CircleOff,
} from "lucide-react";

import RecordsPageShell from "@/app/components/student/records/RecordsPageShell";
import RecordStats from "@/app/components/student/records/RecordStats";
import RecordsLoading from "@/app/components/student/records/RecordsLoading";

import type {
    RecordStats as RecordStatsType,
    DayRecord,
} from "@/lib/student-records/types";

type DailyResponse = {
    date: string;
    stats: RecordStatsType;
    day: DayRecord | null;
};

function formatDate(
    date: string
) {
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

export default function DailyRecordsPage() {
    const [
        data,
        setData,
    ] =
        useState<DailyResponse | null>(
            null
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        "/api/student/records/daily",
                        {
                            cache: "no-store",
                        }
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        "Failed to load records."
                    );
                }

                const result =
                    (await response.json()) as DailyResponse;

                setData(result);
            } catch (error) {
                console.error(
                    error
                );

                setError(
                    "Unable to load daily record."
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    /*
     * A day is considered an OFF DAY when:
     *
     * 1. The backend explicitly marks it as OFF
     * OR
     * 2. There are zero tasks
     *
     * This makes the daily page consistent
     * with the weekly record.
     */
    const isOffDay =
        data !== null &&
        (
            data.stats.totalTasks === 0 ||
            data.day?.dayType === "OFF"
        );

    return (
        <RecordsPageShell active="daily">
            {/* Loading */}

            {loading && (
                <RecordsLoading />
            )}

            {/* Error */}

            {!loading &&
                error && (
                    <div
                        className="
                            w-full
                            rounded-xl
                            border
                            border-red-500/20
                            bg-red-500/5
                            p-4
                            text-sm
                            leading-6
                            text-red-400
                            sm:p-5
                        "
                    >
                        {error}
                    </div>
                )}

            {/* Data */}

            {!loading &&
                !error &&
                data && (
                    <div
                        className="
                            w-full
                            min-w-0
                            space-y-6
                            sm:space-y-7
                        "
                    >
                        {/* Date */}

                        <section className="min-w-0">
                            <div
                                className="
                                    mb-4
                                    min-w-0
                                    px-0.5
                                    sm:mb-5
                                "
                            >
                                <div
                                    className="
                                        mb-1.5
                                        flex
                                        items-center
                                        gap-2
                                        text-xs
                                        text-(--text-secondary)
                                        sm:text-sm
                                    "
                                >
                                    <CalendarDays
                                        size={15}
                                        className="shrink-0 sm:h-4 sm:w-4"
                                    />

                                    <span>
                                        Yesterday
                                    </span>
                                </div>

                                <h2
                                    className="
                                        break-words
                                        text-xl
                                        font-semibold
                                        leading-7
                                        sm:text-2xl
                                        sm:leading-8
                                    "
                                >
                                    {formatDate(
                                        data.date
                                    )}
                                </h2>
                            </div>

                            {/* =========================
                                OFF DAY
                               ========================= */}

                            {isOffDay && (
                                <div
                                    className="
                                        flex
                                        min-h-64
                                        w-full
                                        flex-col
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-(--border)
                                        bg-(--navy-900)
                                        px-5
                                        py-10
                                        text-center
                                        sm:min-h-72
                                    "
                                >
                                    {/* Icon */}

                                    <div
                                        className="
                                            mb-4
                                            flex
                                            h-14
                                            w-14
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-full
                                            border
                                            border-(--border)
                                            bg-(--navy-800)
                                            sm:mb-5
                                            sm:h-16
                                            sm:w-16
                                        "
                                    >
                                        <CircleOff
                                            size={25}
                                            className="
                                                text-(--text-secondary)
                                                sm:h-7
                                                sm:w-7
                                            "
                                        />
                                    </div>

                                    {/* Badge */}

                                    <div
                                        className="
                                            mb-2
                                            rounded-full
                                            border
                                            border-slate-400/20
                                            bg-slate-400/10
                                            px-3
                                            py-1
                                            text-[10px]
                                            font-medium
                                            tracking-wide
                                            text-slate-400
                                            sm:text-xs
                                        "
                                    >
                                        OFF DAY
                                    </div>

                                    {/* Title */}

                                    <h3
                                        className="
                                            text-lg
                                            font-semibold
                                            leading-6
                                            sm:text-xl
                                        "
                                    >
                                        No Academic Tasks
                                    </h3>

                                    {/* Description */}

                                    <p
                                        className="
                                            mt-2
                                            max-w-md
                                            text-xs
                                            leading-5
                                            text-(--text-secondary)
                                            sm:text-sm
                                            sm:leading-6
                                        "
                                    >
                                        No academic
                                        tasks were
                                        scheduled
                                        for this
                                        date.
                                    </p>
                                </div>
                            )}

                            {/* =========================
                                WORKING DAY STATS
                               ========================= */}

                            {!isOffDay && (
                                <div className="min-w-0">
                                    <RecordStats
                                        stats={
                                            data.stats
                                        }
                                    />
                                </div>
                            )}
                        </section>

                        {/* =========================
                            DAILY REPORT
                           ========================= */}

                        {!isOffDay &&
                            data.day && (
                                <section className="min-w-0">
                                    <div
                                        className="
                                            mb-3
                                            px-0.5
                                            sm:mb-4
                                        "
                                    >
                                        <h2
                                            className="
                                                text-base
                                                font-semibold
                                                leading-6
                                                sm:text-lg
                                            "
                                        >
                                            Daily Report
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
                                            Complete
                                            performance
                                            for{" "}
                                            {formatDate(
                                                data.date
                                            )}
                                        </p>
                                    </div>

                                    <div
                                        className="
                                            w-full
                                            rounded-xl
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
                                                flex-col
                                                gap-4
                                                sm:flex-row
                                                sm:items-center
                                                sm:justify-between
                                                sm:gap-5
                                            "
                                        >
                                            {/* Day information */}

                                            <div className="min-w-0">
                                                <div
                                                    className="
                                                        text-sm
                                                        font-medium
                                                        sm:text-base
                                                    "
                                                >
                                                    {
                                                        data
                                                            .day
                                                            .dayName
                                                    }
                                                </div>

                                                <div
                                                    className="
                                                        mt-1
                                                        break-words
                                                        text-xs
                                                        leading-5
                                                        text-(--text-secondary)
                                                        sm:text-sm
                                                    "
                                                >
                                                    {
                                                        formatDate(
                                                            data.date
                                                        )
                                                    }
                                                </div>
                                            </div>

                                            {/* View Report */}

                                            <Link
                                                href={`/student/records/day/${data.date}`}
                                                className="
                                                    inline-flex
                                                    min-h-11
                                                    w-full
                                                    shrink-0
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
                                                    transition
                                                    hover:opacity-90
                                                    active:scale-[0.98]
                                                    sm:w-auto
                                                "
                                            >
                                                View Report

                                                <ArrowRight
                                                    size={
                                                        16
                                                    }
                                                    className="shrink-0"
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                </section>
                            )}
                    </div>
                )}
        </RecordsPageShell>
    );
}