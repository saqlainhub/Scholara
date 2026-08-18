"use client";

import {
    useEffect,
    useState,
} from "react";

import RecordsPageShell from "@/app/components/student/records/RecordsPageShell";
import RecordStats from "@/app/components/student/records/RecordStats";
import RecordsLoading from "@/app/components/student/records/RecordsLoading";
import WeeklyRecord from "@/app/components/student/records/WeeklyRecord";

import type {
    DayRecord,
    RecordStats as RecordStatsType,
} from "@/lib/student-records/types";

type WeeklyResponse = {
    startDate: string;
    endDate: string;
    stats: RecordStatsType;
    days: DayRecord[];
};

/* ============================================================
   FORMAT DATE RANGE
============================================================ */

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

    if (
        Number.isNaN(
            start.getTime()
        ) ||
        Number.isNaN(
            end.getTime()
        )
    ) {
        return `${startDate} – ${endDate}`;
    }

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

    /*
     * Example:
     * August 10 – 16, 2026
     */
    if (
        sameMonth &&
        sameYear
    ) {
        return `${startText} – ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
    }

    /*
     * Example:
     * August 28 – September 3, 2026
     */
    if (sameYear) {
        return `${startText} – ${endText}, ${end.getUTCFullYear()}`;
    }

    /*
     * Example:
     * December 29, 2026 – January 4, 2027
     */
    return `${startText}, ${start.getUTCFullYear()} – ${endText}, ${end.getUTCFullYear()}`;
}

/* ============================================================
   PAGE
============================================================ */

export default function WeeklyRecordsPage() {
    const [
        data,
        setData,
    ] =
        useState<WeeklyResponse | null>(
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
                        "/api/student/records/weekly",
                        {
                            cache: "no-store",
                        }
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        "Failed to load weekly record."
                    );
                }

                const result =
                    await response.json();

                setData(result);
            } catch (error) {
                console.error(
                    error
                );

                setError(
                    "Unable to load weekly record."
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    return (
        <RecordsPageShell active="weekly">
            {/* =====================================================
                LOADING
            ====================================================== */}

            {loading && (
                <RecordsLoading />
            )}

            {/* =====================================================
                ERROR
            ====================================================== */}

            {!loading &&
                error && (
                    <div
                        className="
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

            {/* =====================================================
                CONTENT
            ====================================================== */}

            {!loading &&
                !error &&
                data && (
                    <div
                        className="
                            min-w-0
                            space-y-7
                            sm:space-y-8
                        "
                    >
                        {/* =================================================
                            STATS
                        ================================================= */}

                        <section className="min-w-0">
                            <div
                                className="
                                    mb-4
                                    px-0.5
                                    sm:mb-5
                                "
                            >
                                <h2
                                    className="
                                        text-lg
                                        font-semibold
                                        tracking-tight
                                        sm:text-xl
                                    "
                                >
                                    Weekly Performance
                                </h2>

                                <p
                                    className="
                                        mt-1.5
                                        break-words
                                        text-xs
                                        leading-5
                                        text-(--text-secondary)
                                        sm:text-sm
                                        sm:leading-6
                                    "
                                >
                                    {formatDateRange(
                                        data.startDate,
                                        data.endDate
                                    )}
                                </p>
                            </div>

                            <div className="min-w-0">
                                <RecordStats
                                    stats={
                                        data.stats
                                    }
                                />
                            </div>
                        </section>

                        {/* =================================================
                            CALENDAR
                        ================================================= */}

                        <section className="min-w-0">
                            <div
                                className="
                                    min-w-0
                                    overflow-x-auto
                                    overscroll-x-contain
                                "
                            >
                                <WeeklyRecord
                                    startDate={
                                        data.startDate
                                    }
                                    endDate={
                                        data.endDate
                                    }
                                    days={
                                        data.days
                                    }
                                    stats={
                                        data.stats
                                    }
                                />
                            </div>
                        </section>
                    </div>
                )}
        </RecordsPageShell>
    );
}