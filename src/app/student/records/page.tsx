"use client";

import {
    useEffect,
    useState,
} from "react";

import RecordsPageShell from "@/app/components/student/records/RecordsPageShell";
import RecordStats from "@/app/components/student/records/RecordStats";
import RecordsLoading from "@/app/components/student/records/RecordsLoading";
import OverviewRecord from "@/app/components/student/records/OverviewRecord";

import type {
    OverviewRecord as OverviewRecordType,
} from "@/lib/student-records/types";

export default function RecordsOverviewPage() {
    const [
        data,
        setData,
    ] =
        useState<OverviewRecordType | null>(
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
        async function loadOverview() {
            try {
                setLoading(
                    true
                );

                setError("");

                const response =
                    await fetch(
                        "/api/student/records/overview",
                        {
                            cache: "no-store",
                        }
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        "Failed to load overview."
                    );
                }

                const result =
                    await response.json();

                setData(result);
            } catch (error) {
                console.error(
                    "OVERVIEW PAGE ERROR:",
                    error
                );

                setError(
                    "Unable to load record overview."
                );
            } finally {
                setLoading(
                    false
                );
            }
        }

        loadOverview();
    }, []);

    return (
        <RecordsPageShell active="overview">
            {loading && (
                <RecordsLoading />
            )}

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

            {!loading &&
                !error &&
                data && (
                    <div
                        className="
                            space-y-7
                            sm:space-y-8
                        "
                    >
                        {/* =====================================================
                            OVERALL STATISTICS
                        ====================================================== */}

                        <section>
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
                                    Overall Performance
                                </h2>

                                <p
                                    className="
                                        mt-1.5
                                        break-words
                                        text-xs
                                        leading-5
                                        text-(--text-secondary)
                                    "
                                >
                                    {
                                        data.createdAt
                                    }{" "}
                                    <span className="mx-1 opacity-50">
                                        →
                                    </span>{" "}
                                    {
                                        data.endDate
                                    }
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

                        {/* =====================================================
                            MONTHLY HISTORY
                        ====================================================== */}

                        <section>
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
                                    Monthly History
                                </h2>

                                <p
                                    className="
                                        mt-1.5
                                        max-w-2xl
                                        text-xs
                                        leading-5
                                        text-(--text-secondary)
                                        sm:text-sm
                                        sm:leading-6
                                    "
                                >
                                    Expand a month to
                                    view its daily
                                    performance.
                                </p>
                            </div>

                            <div className="min-w-0">
                                <OverviewRecord
                                    months={
                                        data.months
                                    }
                                />
                            </div>
                        </section>


                    </div>
                )}
        </RecordsPageShell>
    );
}