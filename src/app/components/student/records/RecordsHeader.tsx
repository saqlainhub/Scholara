"use client";

import Link from "next/link";

import {
    BarChart3,
    CalendarDays,
    Clock3,
    LayoutDashboard,
} from "lucide-react";

type Props = {
    active:
        | "overview"
        | "daily"
        | "weekly"
        | "monthly";
};

const navigation = [
    {
        key: "overview" as const,
        label: "Overview",
        href: "/student/records/",
        icon: LayoutDashboard,
    },
    {
        key: "daily" as const,
        label: "Daily",
        href: "/student/records/daily",
        icon: Clock3,
    },
    {
        key: "weekly" as const,
        label: "Weekly",
        href: "/student/records/weekly",
        icon: CalendarDays,
    },
    {
        key: "monthly" as const,
        label: "Monthly",
        href: "/student/records/monthly",
        icon: BarChart3,
    },
];

export default function RecordsHeader({
    active,
}: Props) {
    return (
        <div className="mb-5 sm:mb-6">
            {/* Header */}
            <div className="mb-4 sm:mb-5">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-(--gold-400) sm:mb-2 sm:text-xs sm:tracking-[0.3em]">
                    Student Portal
                </p>

                <h1 className="font-heading text-3xl font-bold tracking-wide text-white sm:text-4xl md:text-5xl">
                    Records
                </h1>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 opacity-70 sm:mt-2 sm:text-sm sm:leading-6">
                    Track your task performance
                    and academic activity.
                </p>
            </div>

            {/* Navigation */}
            <nav
                aria-label="Records navigation"
                className="w-full overflow-x-auto rounded-xl border border-(--border) bg-(--navy-900) p-1.5 scrollbar-none sm:p-2"
            >
                <div className="flex min-w-max gap-1 sm:gap-2">
                    {navigation.map(
                        (item) => {
                            const Icon =
                                item.icon;

                            const isActive =
                                active ===
                                item.key;

                            return (
                                <Link
                                    key={
                                        item.key
                                    }
                                    href={
                                        item.href
                                    }
                                    className={[
                                        "flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition active:scale-[0.98] sm:min-h-10 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                                        isActive
                                            ? "bg-(--gold-500) text-black shadow-sm"
                                            : "text-(--text-secondary) hover:bg-(--navy-800) hover:text-(--text-primary)",
                                    ].join(
                                        " "
                                    )}
                                >
                                    <Icon
                                        size={
                                            15
                                        }
                                        strokeWidth={
                                            2
                                        }
                                        className="shrink-0 sm:h-4 sm:w-4"
                                    />

                                    <span>
                                        {
                                            item.label
                                        }
                                    </span>
                                </Link>
                            );
                        }
                    )}
                </div>
            </nav>
        </div>
    );
}