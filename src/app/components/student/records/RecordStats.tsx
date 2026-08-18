"use client";

import {
    CheckCircle2,
    CircleAlert,
    CircleGauge,
    CircleOff,
    ClipboardCheck,
    ClipboardList,
    Clock3,
    Trophy,
    XCircle,
} from "lucide-react";

import type {
    RecordStats as RecordStatsType,
} from "@/lib/student-records/types";

type Props = {
    stats: RecordStatsType;
};

export default function RecordStats({
    stats,
}: Props) {
    const items = [
        {
            label: "Total Tasks",
            value: stats.totalTasks,
            icon: ClipboardList,
        },

        {
            label: "Submitted",
            value: stats.submitted,
            icon: CheckCircle2,
        },

        {
            label: "Unsubmitted",
            value: stats.unsubmitted,
            icon: XCircle,
        },

        {
            label: "Delayed",
            value: stats.delayed,
            icon: CircleAlert,
        },

        {
            label: "On Time",
            value: stats.ontime,
            icon: Clock3,
        },

        {
            label: "Checked",
            value: stats.checked,
            icon: ClipboardCheck,
        },

        {
            label: "Unchecked",
            value: stats.unchecked,
            icon: CircleOff,
        },

        {
            label: "Score",
            value: stats.score,
            icon: CircleGauge,
        },

        {
            label: "Leaderboard",
            value:
                stats.position !== null
                    ? `#${stats.position}`
                    : "—",
            icon: Trophy,
        },
    ];

    return (
        <div
            className="
                grid
                grid-cols-2
                gap-2.5
                min-[400px]:gap-3
                sm:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-5
                2xl:grid-cols-6
            "
        >
            {items.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.label}
                        className="
                            group
                            min-w-0
                            rounded-xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            p-3
                            transition
                            hover:border-(--gold-border)
                            hover:bg-(--navy-800)
                            min-[400px]:p-3.5
                            sm:p-4
                        "
                    >
                        {/* Icon */}
                        <div
                            className="
                                mb-3
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-(--border)
                                bg-(--navy-800)
                                sm:mb-4
                                sm:h-9
                                sm:w-9
                            "
                        >
                            <Icon
                                size={16}
                                className="text-(--gold-400) sm:size-[17px]"
                            />
                        </div>

                        {/* Value */}
                        <div
                            className="
                                data
                                truncate
                                text-xl
                                font-semibold
                                tracking-tight
                                min-[400px]:text-2xl
                            "
                        >
                            {item.value}
                        </div>

                        {/* Label */}
                        <div
                            className="
                                mt-1
                                truncate
                                text-[10px]
                                leading-4
                                text-(--text-secondary)
                                min-[400px]:text-xs
                            "
                        >
                            {item.label}
                        </div>
                    </div>
                );
            })}

            {/* Performance Status */}
            <div
                className="
                    min-w-0
                    rounded-xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    p-3
                    transition
                    hover:border-(--gold-border)
                    hover:bg-(--navy-800)
                    min-[400px]:p-3.5
                    sm:p-4
                "
            >
                <div
                    className="
                        mb-3
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-(--border)
                        bg-(--navy-800)
                        sm:mb-4
                        sm:h-9
                        sm:w-9
                    "
                >
                    <Trophy
                        size={16}
                        className="text-(--gold-400) sm:size-[17px]"
                    />
                </div>

                <div
                    className={[
                        "truncate text-lg font-semibold tracking-tight min-[400px]:text-xl",
                        stats.status === "TOP"
                            ? "text-(--gold-400)"
                            : stats.status === "WEAK"
                                ? "text-red-400"
                                : "text-(--gold-500)",
                    ].join(" ")}
                >
                    {stats.status}
                </div>

                <div
                    className="
                        mt-1
                        truncate
                        text-[10px]
                        leading-4
                        text-(--text-secondary)
                        min-[400px]:text-xs
                    "
                >
                    Performance Status
                </div>
            </div>
        </div>
    );
}