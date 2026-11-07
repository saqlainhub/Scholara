"use client";

import Link from "next/link";

import {
    useEffect,
    useState,
} from "react";

type TeacherPerformance =
    | "DILIGENT"
    | "LAZY";

type Teacher = {
    id: string;
    name: string;
    profileImg: string | null;
    username: string;

    // ==========================================
    // REAL TASK STATISTICS
    // ==========================================

    totalTasks: number;
    checkedTasks: number;
    uncheckedTasks: number;

    checkedPercentage: number;

    // ==========================================
    // RECENT ACTIVITY
    // ==========================================

    recentTasks: number;
    recentCheckedTasks: number;
    recentUncheckedTasks: number;
    recentCheckedPercentage: number;

    // ==========================================
    // PERFORMANCE
    // ==========================================

    performance: TeacherPerformance;

    createdAt: string;
};

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string | number;
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
                px-4
                py-4
                sm:px-5
                sm:py-4
            "
        >
            <div
                className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wider
                    opacity-50
                    sm:text-xs
                "
            >
                {label}
            </div>

            <div
                className="
                    mt-1.5
                    text-2xl
                    font-semibold
                    sm:mt-2
                    sm:text-2xl
                "
            >
                {value}
            </div>

            {description && (
                <div
                    className="
                        mt-1
                        max-w-full
                        text-[11px]
                        leading-4
                        opacity-40
                        sm:text-xs
                    "
                >
                    {description}
                </div>
            )}
        </div>
    );
}

// ======================================================
// INITIALS
// ======================================================

function getInitials(
    name: string
) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (!parts.length) {
        return "T";
    }

    return parts
        .map((part) =>
            part
                .charAt(0)
                .toUpperCase()
        )
        .join("");
}

// ======================================================
// PERFORMANCE BADGE
// ======================================================

function PerformanceBadge({
    performance,
}: {
    performance: TeacherPerformance;
}) {
    const diligent =
        performance === "DILIGENT";

    return (
        <span
            className={`
                inline-flex
                items-center
                justify-center
                rounded-lg
                px-2.5
                py-1
                text-[10px]
                font-semibold
                sm:px-3
                sm:py-1.5
                sm:text-xs
                ${
                    diligent
                        ? "bg-green-400/10 text-green-400"
                        : "bg-red-400/10 text-red-400"
                }
            `}
        >
            {diligent
                ? "DILIGENT"
                : "LAZY"}
        </span>
    );
}

// ======================================================
// NUMBER BADGE
// ======================================================

function NumberBadge({
    value,
    className = "",
}: {
    value: number;
    className?: string;
}) {
    return (
        <span
            className={`
                inline-flex
                min-w-9
                items-center
                justify-center
                rounded-lg
                bg-(--navy-800)
                px-2.5
                py-1.5
                text-sm
                font-semibold
                sm:min-w-10
                sm:px-3
                ${className}
            `}
        >
            {value}
        </span>
    );
}

// ======================================================
// TEACHER TABLE
// ======================================================

export default function TeacherTable() {
    const [teachers, setTeachers] =
        useState<Teacher[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // ======================================================
    // LOAD TEACHERS
    // ======================================================

    useEffect(() => {
        let cancelled = false;

        async function loadTeachers() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        "/api/head/teachers",
                        {
                            method: "GET",
                            cache: "no-store",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    if (!cancelled) {
                        setError(
                            data?.message ||
                                "Failed to load teachers."
                        );
                    }

                    return;
                }

                if (
                    !Array.isArray(data)
                ) {
                    if (!cancelled) {
                        setError(
                            "Invalid teachers response from server."
                        );
                    }

                    return;
                }

                if (!cancelled) {
                    setTeachers(data);
                }
            } catch (error) {
                console.error(
                    "LOAD TEACHERS ERROR:",
                    error
                );

                if (!cancelled) {
                    setError(
                        "Something went wrong while loading teachers."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadTeachers();

        return () => {
            cancelled = true;
        };
    }, []);

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div
                className="
                    rounded-2xl
                    border
                    border-(--border)
                    px-4
                    py-12
                    text-center
                    sm:px-6
                    sm:py-14
                "
            >
                <p className="text-sm opacity-60">
                    Loading teachers...
                </p>
            </div>
        );
    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error) {
        return (
            <div
                className="
                    rounded-xl
                    border
                    border-red-400/30
                    bg-red-400/5
                    px-4
                    py-3
                    text-sm
                    leading-5
                    text-red-300
                "
            >
                {error}
            </div>
        );
    }

    // ======================================================
    // SUMMARY
    // ======================================================

    const totalTeachers =
        teachers.length;

    const diligentTeachers =
        teachers.filter(
            (teacher) =>
                teacher.performance ===
                "DILIGENT"
        ).length;

    const lazyTeachers =
        teachers.filter(
            (teacher) =>
                teacher.performance ===
                "LAZY"
        ).length;

    // ======================================================
    // EMPTY
    // ======================================================

    if (teachers.length === 0) {
        return (
            <div className="space-y-5 sm:space-y-6">

                {/* ==================================================
                    SUMMARY
                ================================================== */}

                <div
                    className="
                        grid
                        grid-cols-1
                        gap-3
                        sm:grid-cols-3
                    "
                >
                    <SummaryCard
                        label="Total Teachers"
                        value={0}
                        description="All teacher accounts"
                    />

                    <SummaryCard
                        label="Diligent"
                        value={0}
                        description="90%+ checked in recent activity"
                    />

                    <SummaryCard
                        label="Lazy"
                        value={0}
                        description="Below 90% checked"
                    />
                </div>

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                <div
                    className="
                        rounded-2xl
                        border
                        border-dashed
                        border-(--border)
                        px-4
                        py-12
                        text-center
                        sm:px-6
                        sm:py-14
                    "
                >
                    <p className="font-medium">
                        No teachers found
                    </p>

                    <p
                        className="
                            mx-auto
                            mt-1
                            max-w-sm
                            text-xs
                            leading-5
                            opacity-50
                            sm:text-sm
                        "
                    >
                        Create a teacher account
                        to see it here.
                    </p>
                </div>
            </div>
        );
    }

    // ======================================================
    // TABLE + MOBILE / TABLET CARDS
    // ======================================================

    return (
        <div className="space-y-5 sm:space-y-6">

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div
                className="
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-3
                "
            >
                <SummaryCard
                    label="Total Teachers"
                    value={
                        totalTeachers
                    }
                    description="All teacher accounts"
                />

                <SummaryCard
                    label="Diligent"
                    value={
                        diligentTeachers
                    }
                    description="90%+ checked in recent activity"
                />

                <SummaryCard
                    label="Lazy"
                    value={
                        lazyTeachers
                    }
                    description="Below 90% checked"
                />
            </div>

            {/* ==================================================
                MOBILE + TABLET CARDS
                Hidden on large desktop
            ================================================== */}

            <div
                className="
                    grid
                    grid-cols-1
                    gap-3
                    lg:hidden
                    sm:gap-4
                "
            >
                {teachers.map(
                    (
                        teacher,
                        index
                    ) => {
                        const total =
                            Number(
                                teacher.totalTasks
                            ) || 0;

                        const checked =
                            Number(
                                teacher.checkedTasks
                            ) || 0;

                        const unchecked =
                            Number(
                                teacher.uncheckedTasks
                            ) || 0;

                        const checkedPercentage =
                            Number(
                                teacher.checkedPercentage ??
                                    0
                            );

                        return (
                            <div
                                key={
                                    teacher.id
                                }
                                className="
                                    overflow-hidden
                                    rounded-2xl
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    p-4
                                    sm:p-5
                                "
                            >
                                {/* ==================================================
                                    TOP SECTION
                                ================================================== */}

                                <div
                                    className="
                                        flex
                                        items-start
                                        justify-between
                                        gap-3
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            min-w-0
                                            items-center
                                            gap-3
                                        "
                                    >
                                        {/* PROFILE IMAGE */}

                                        {teacher.profileImg ? (
                                            <img
                                                src={
                                                    teacher.profileImg
                                                }
                                                alt={
                                                    teacher.name
                                                }
                                                className="
                                                    h-11
                                                    w-11
                                                    shrink-0
                                                    rounded-full
                                                    object-cover
                                                    sm:h-12
                                                    sm:w-12
                                                "
                                            />
                                        ) : (
                                            <div
                                                className="
                                                    flex
                                                    h-11
                                                    w-11
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-(--navy-800)
                                                    text-xs
                                                    font-semibold
                                                    opacity-60
                                                    sm:h-12
                                                    sm:w-12
                                                "
                                            >
                                                {getInitials(
                                                    teacher.name
                                                )}
                                            </div>
                                        )}

                                        {/* NAME + USERNAME */}

                                        <div
                                            className="
                                                min-w-0
                                                flex-1
                                            "
                                        >
                                            <p
                                                className="
                                                    truncate
                                                    text-sm
                                                    font-semibold
                                                    sm:text-base
                                                "
                                            >
                                                {
                                                    teacher.name
                                                }
                                            </p>

                                            <p
                                                className="
                                                    mt-0.5
                                                    truncate
                                                    text-xs
                                                    opacity-40
                                                "
                                            >
                                                @
                                                {
                                                    teacher.username
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* NUMBER */}

                                    <span
                                        className="
                                            shrink-0
                                            text-[11px]
                                            opacity-40
                                            sm:text-xs
                                        "
                                    >
                                        #
                                        {index +
                                            1}
                                    </span>
                                </div>

                                {/* ==================================================
                                    PERFORMANCE
                                ================================================== */}

                                <div
                                    className="
                                        mt-4
                                        flex
                                        items-center
                                        justify-between
                                        rounded-xl
                                        bg-(--navy-800)/60
                                        px-3
                                        py-3
                                    "
                                >
                                    <div>
                                        <p
                                            className="
                                                text-[10px]
                                                font-semibold
                                                uppercase
                                                tracking-wider
                                                opacity-40
                                            "
                                        >
                                            Performance
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-xs
                                                opacity-50
                                            "
                                        >
                                            Recent task activity
                                        </p>
                                    </div>

                                    <PerformanceBadge
                                        performance={
                                            teacher.performance
                                        }
                                    />
                                </div>

                                {/* ==================================================
                                    STATISTICS
                                ================================================== */}

                                <div
                                    className="
                                        mt-3
                                        grid
                                        grid-cols-2
                                        gap-2
                                        sm:grid-cols-4
                                        sm:gap-3
                                    "
                                >
                                    {/* TOTAL */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-(--border)
                                            px-3
                                            py-3
                                        "
                                    >
                                        <p
                                            className="
                                                text-[9px]
                                                font-semibold
                                                uppercase
                                                tracking-wider
                                                opacity-40
                                                sm:text-[10px]
                                            "
                                        >
                                            Total
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-base
                                                font-semibold
                                            "
                                        >
                                            {total}
                                        </p>

                                        <p
                                            className="
                                                mt-0.5
                                                text-[10px]
                                                opacity-35
                                            "
                                        >
                                            Tasks
                                        </p>
                                    </div>

                                    {/* CHECKED */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-(--border)
                                            px-3
                                            py-3
                                        "
                                    >
                                        <p
                                            className="
                                                text-[9px]
                                                font-semibold
                                                uppercase
                                                tracking-wider
                                                text-green-400/70
                                                sm:text-[10px]
                                            "
                                        >
                                            Checked
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-base
                                                font-semibold
                                                text-green-400
                                            "
                                        >
                                            {checked}
                                        </p>

                                        <p
                                            className="
                                                mt-0.5
                                                text-[10px]
                                                opacity-35
                                            "
                                        >
                                            Completed
                                        </p>
                                    </div>

                                    {/* UNCHECKED */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-(--border)
                                            px-3
                                            py-3
                                        "
                                    >
                                        <p
                                            className="
                                                text-[9px]
                                                font-semibold
                                                uppercase
                                                tracking-wider
                                                text-red-400/70
                                                sm:text-[10px]
                                            "
                                        >
                                            Unchecked
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-base
                                                font-semibold
                                                text-red-400
                                            "
                                        >
                                            {unchecked}
                                        </p>

                                        <p
                                            className="
                                                mt-0.5
                                                text-[10px]
                                                opacity-35
                                            "
                                        >
                                            Pending
                                        </p>
                                    </div>

                                    {/* PERCENTAGE */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-(--border)
                                            px-3
                                            py-3
                                        "
                                    >
                                        <p
                                            className="
                                                text-[9px]
                                                font-semibold
                                                uppercase
                                                tracking-wider
                                                opacity-40
                                                sm:text-[10px]
                                            "
                                        >
                                            Rate
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-base
                                                font-semibold
                                            "
                                        >
                                            {checkedPercentage.toFixed(
                                                0
                                            )}
                                            %
                                        </p>

                                        <p
                                            className="
                                                mt-0.5
                                                text-[10px]
                                                opacity-35
                                            "
                                        >
                                            Checked
                                        </p>
                                    </div>
                                </div>

                                {/* ==================================================
                                    ACTION
                                ================================================== */}

                                <Link
                                    href={`/head/teachers/${teacher.id}`}
                                    className="
                                        mt-3
                                        flex
                                        min-h-11
                                        w-full
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-(--gold-500)
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-(--gold-500)
                                        transition
                                        active:scale-[0.99]
                                        hover:bg-(--gold-500)
                                        hover:text-black
                                        sm:min-h-12
                                    "
                                >
                                    View Teacher
                                </Link>
                            </div>
                        );
                    }
                )}
            </div>

            {/* ==================================================
                DESKTOP TABLE
                Large desktop only
            ================================================== */}

            <div
                className="
                    scrollbar-portal
                    hidden
                    overflow-x-auto
                    rounded-2xl
                    border
                    border-(--border)
                    lg:block
                "
            >
                <table
                    className="
                        w-full
                        min-w-250
                        text-left
                    "
                >
                    <thead>
                        <tr
                            className="
                                border-b
                                border-(--border)
                                bg-(--navy-900)
                            "
                        >
                            {/* NUMBER */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                #
                            </th>

                            {/* TEACHER */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Teacher
                            </th>

                            {/* TOTAL */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-center
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Total Tasks
                            </th>

                            {/* CHECKED */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-center
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Checked
                            </th>

                            {/* UNCHECKED */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-center
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Unchecked
                            </th>

                            {/* PERFORMANCE */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-center
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Performance
                            </th>

                            {/* ACTION */}

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {teachers.map(
                            (
                                teacher,
                                index
                            ) => {
                                const total =
                                    Number(
                                        teacher.totalTasks
                                    ) || 0;

                                const checked =
                                    Number(
                                        teacher.checkedTasks
                                    ) || 0;

                                const unchecked =
                                    Number(
                                        teacher.uncheckedTasks
                                    ) || 0;

                                const checkedPercentage =
                                    Number(
                                        teacher.checkedPercentage ??
                                            0
                                    );

                                return (
                                    <tr
                                        key={
                                            teacher.id
                                        }
                                        className="
                                            border-t
                                            border-(--border)
                                            transition
                                            hover:bg-(--navy-900)
                                        "
                                    >
                                        {/* NUMBER */}

                                        <td
                                            className="
                                                px-5
                                                py-4
                                                text-sm
                                                opacity-50
                                            "
                                        >
                                            {index +
                                                1}
                                        </td>

                                        {/* TEACHER */}

                                        <td className="px-5 py-4">
                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-3
                                                "
                                            >
                                                {teacher.profileImg ? (
                                                    <img
                                                        src={
                                                            teacher.profileImg
                                                        }
                                                        alt={
                                                            teacher.name
                                                        }
                                                        className="
                                                            h-10
                                                            w-10
                                                            shrink-0
                                                            rounded-full
                                                            object-cover
                                                        "
                                                    />
                                                ) : (
                                                    <div
                                                        className="
                                                            flex
                                                            h-10
                                                            w-10
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-(--navy-800)
                                                            text-xs
                                                            font-semibold
                                                            opacity-60
                                                        "
                                                    >
                                                        {getInitials(
                                                            teacher.name
                                                        )}
                                                    </div>
                                                )}

                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">
                                                        {
                                                            teacher.name
                                                        }
                                                    </p>

                                                    <p className="mt-0.5 truncate text-xs opacity-40">
                                                        @
                                                        {
                                                            teacher.username
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* TOTAL TASKS */}

                                        <td className="px-5 py-4 text-center">
                                            <NumberBadge
                                                value={
                                                    total
                                                }
                                            />
                                        </td>

                                        {/* CHECKED */}

                                        <td className="px-5 py-4 text-center">
                                            <NumberBadge
                                                value={
                                                    checked
                                                }
                                            />
                                        </td>

                                        {/* UNCHECKED */}

                                        <td className="px-5 py-4 text-center">
                                            <NumberBadge
                                                value={
                                                    unchecked
                                                }
                                            />
                                        </td>

                                        {/* PERFORMANCE */}

                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <PerformanceBadge
                                                    performance={
                                                        teacher.performance
                                                    }
                                                />
                                            </div>
                                        </td>

                                        {/* ACTION */}

                                        <td className="px-5 py-4">
                                            <Link
                                                href={`/head/teachers/${teacher.id}`}
                                                className="
                                                    inline-flex
                                                    rounded-lg
                                                    border
                                                    border-(--gold-500)
                                                    px-3
                                                    py-2
                                                    text-sm
                                                    font-medium
                                                    text-(--gold-500)
                                                    transition
                                                    hover:bg-(--gold-500)
                                                    hover:text-black
                                                "
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            }
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}