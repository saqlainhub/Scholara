"use client";

import {
    useEffect,
    useState,
} from "react";

import RecordsPageShell from "@/app/components/student/records/RecordsPageShell";
import RecordStats from "@/app/components/student/records/RecordStats";
import RecordsLoading from "@/app/components/student/records/RecordsLoading";
import MonthlyRecord from "@/app/components/student/records/MonthlyRecord";

import type {
    DayRecord,
    RecordStats as RecordStatsType,
} from "@/lib/student-records/types";

type MonthlyResponse = {
    year: number;
    month: number;
    monthName: string;
    daysInMonth: number;
    startDate: string;
    endDate: string;
    firstDayIndex: number;
    stats: RecordStatsType;
    days: DayRecord[];
};

export default function MonthlyRecordsPage() {
    const [
        data,
        setData,
    ] =
        useState<MonthlyResponse | null>(
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
        async function loadMonthlyRecord() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        "/api/student/records/monthly",
                        {
                            cache: "no-store",
                        }
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        "Failed to load monthly record."
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
                    "Unable to load monthly record."
                );
            } finally {
                setLoading(false);
            }
        }

        loadMonthlyRecord();
    }, []);

    return (
        <RecordsPageShell active="monthly">
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

            {/* =====================================================
                CONTENT
            ====================================================== */}

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
                        {/* =================================================
                            SUMMARY
                        ================================================= */}

                        <section className="min-w-0">
                            <div
                                className="
                                    mb-4
                                    min-w-0
                                    px-0.5
                                    sm:mb-5
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
                                    Monthly Performance
                                </h2>

                                <p
                                    className="
                                        mt-1.5
                                        text-xs
                                        leading-5
                                        text-(--text-secondary)
                                        sm:text-sm
                                    "
                                >
                                    {data.monthName}{" "}
                                    {data.year}{" "}
                                    <span className="opacity-50">
                                        —
                                    </span>{" "}
                                    {data.daysInMonth}{" "}
                                    {data.daysInMonth ===
                                    1
                                        ? "Day"
                                        : "Days"}
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
                            <MonthlyRecord
                                monthName={
                                    data.monthName
                                }
                                year={
                                    data.year
                                }
                                month={
                                    data.month
                                }
                                daysInMonth={
                                    data.daysInMonth
                                }
                                firstDayIndex={
                                    data.firstDayIndex
                                }
                                days={
                                    data.days
                                }
                                stats={
                                    data.stats
                                }
                            />
                        </section>
                    </div>
                )}
        </RecordsPageShell>
    );
}