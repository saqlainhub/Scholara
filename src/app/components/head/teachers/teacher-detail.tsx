"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type TeacherPerformance = {
    totalRecentTasks: number;
    checkedRecentTasks: number;
    uncheckedRecentTasks: number;
    checkedPercentage: number;
    performance:
        | "DILIGENT"
        | "LAZY";
};

type Teacher = {
    id: string;
    username: string;
    name: string;
    profileImg: string | null;
    isActive: boolean;

    totalTasks: number;
    checkedTasks: number;
    uncheckedTasks: number;

    performance: TeacherPerformance;

    createdAt: string;
    updatedAt: string;
};

type TeacherAction =
    | "ACTIVATE"
    | "DEACTIVATE"
    | "DELETE"
    | null;

function getInitials(name: string) {
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
            part.charAt(0).toUpperCase()
        )
        .join("");
}

function formatDate(value: string) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    );
}

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div
            className="
                flex
                items-start
                justify-between
                gap-4
                border-b
                border-(--border)
                pb-3
                text-sm
                last:border-b-0
                last:pb-0
            "
        >
            <span className="shrink-0 opacity-40">
                {label}
            </span>

            <span className="min-w-0 break-words text-right">
                {value}
            </span>
        </div>
    );
}

function StatCard({
    label,
    value,
    description,
    styling,
}: {
    label: string;
    value: string | number;
    description?: string;
    styling?: string;
}) {
    return (
        <div
            className="
                min-w-0
                rounded-2xl
                border
                border-(--border)
                p-4
                sm:p-5
            "
        >
            <p
                className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    opacity-45
                    sm:text-xs
                    sm:tracking-[0.15em]
                "
            >
                {label}
            </p>

            <p
                className={`
                    mt-2
                    break-words
                    text-2xl
                    font-semibold
                    sm:mt-3
                    sm:text-3xl
                    ${styling ?? ""}
                `}
            >
                {value}
            </p>

            {description && (
                <p className="mt-1 text-[11px] leading-4 opacity-40 sm:text-xs">
                    {description}
                </p>
            )}
        </div>
    );
}

export default function TeacherDetail({
    teacherId,
}: {
    teacherId: string;
}) {
    const router = useRouter();

    const [teacher, setTeacher] =
        useState<Teacher | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [
        confirmationAction,
        setConfirmationAction,
    ] = useState<TeacherAction>(null);

    // ======================================================
    // LOAD TEACHER
    // ======================================================

    async function loadTeacher() {
        try {
            setLoading(true);
            setError("");

            const response =
                await fetch(
                    `/api/head/teachers/${teacherId}`,
                    {
                        cache: "no-store",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to load teacher."
                );
            }

            setTeacher(data.teacher);
        } catch (error) {
            console.error(
                "LOAD TEACHER ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load teacher."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!teacherId) {
            return;
        }

        void loadTeacher();
    }, [teacherId]);

    // ======================================================
    // ESCAPE KEY
    // ======================================================

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (
                event.key === "Escape" &&
                !actionLoading
            ) {
                setConfirmationAction(null);
            }
        }

        if (confirmationAction) {
            document.addEventListener(
                "keydown",
                handleKeyDown
            );
        }

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        confirmationAction,
        actionLoading,
    ]);

    // ======================================================
    // OPEN CONFIRMATION
    // ======================================================

    function openConfirmation(
        action: Exclude<
            TeacherAction,
            null
        >
    ) {
        if (actionLoading) {
            return;
        }

        setError("");
        setMessage("");

        setConfirmationAction(action);
    }

    // ======================================================
    // CLOSE CONFIRMATION
    // ======================================================

    function closeConfirmation() {
        if (actionLoading) {
            return;
        }

        setConfirmationAction(null);
    }

    // ======================================================
    // CONFIRM TEACHER ACTION
    // ======================================================

    async function confirmTeacherAction() {
        if (
            !confirmationAction ||
            actionLoading
        ) {
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setMessage("");

            const action =
                confirmationAction;

            const response =
                await fetch(
                    `/api/head/teachers/${teacherId}/actions`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            action,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Teacher action failed."
                );
            }

            // ==========================================
            // DELETE
            // ==========================================

            if (action === "DELETE") {
                setConfirmationAction(null);

                setMessage(
                    data?.message ||
                        "Teacher deleted successfully."
                );

                setTimeout(() => {
                    router.push(
                        "/head/teachers"
                    );

                    router.refresh();
                }, 500);

                return;
            }

            // ==========================================
            // ACTIVATE / DEACTIVATE
            // ==========================================

            setTeacher((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    isActive:
                        action ===
                        "ACTIVATE",
                };
            });

            setConfirmationAction(null);

            setMessage(
                data?.message ||
                    (
                        action ===
                        "ACTIVATE"
                            ? "Teacher activated successfully."
                            : "Teacher deactivated successfully."
                    )
            );

            router.refresh();
        } catch (error) {
            console.error(
                "TEACHER ACTION ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Teacher action failed."
            );
        } finally {
            setActionLoading(false);
        }
    }

    // ======================================================
    // TASK STATISTICS
    // ======================================================

    const taskStats = useMemo(() => {
        if (!teacher) {
            return {
                total: 0,
                checked: 0,
                unchecked: 0,
            };
        }

        return {
            total:
                Number(
                    teacher.totalTasks
                ) || 0,

            checked:
                Number(
                    teacher.checkedTasks
                ) || 0,

            unchecked:
                Number(
                    teacher.uncheckedTasks
                ) || 0,
        };
    }, [teacher]);

    // ======================================================
    // PERFORMANCE STATISTICS
    // ======================================================

    const performanceStats = useMemo(() => {
        if (!teacher?.performance) {
            return {
                totalRecentTasks: 0,
                checkedRecentTasks: 0,
                uncheckedRecentTasks: 0,
                checkedPercentage: 0,
                performance: "LAZY" as const,
            };
        }

        return {
            totalRecentTasks:
                Number(
                    teacher.performance
                        .totalRecentTasks
                ) || 0,

            checkedRecentTasks:
                Number(
                    teacher.performance
                        .checkedRecentTasks
                ) || 0,

            uncheckedRecentTasks:
                Number(
                    teacher.performance
                        .uncheckedRecentTasks
                ) || 0,

            checkedPercentage:
                Number(
                    teacher.performance
                        .checkedPercentage
                ) || 0,

            performance:
                teacher.performance
                    .performance,
        };
    }, [teacher]);

    // ======================================================
    // PERFORMANCE LABEL
    // ======================================================

    const performanceLabel =
        performanceStats.performance ===
        "DILIGENT"
            ? "Diligent"
            : "Lazy";

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div
                className="
                    p-4
                    text-sm
                    opacity-60
                    sm:p-6
                    lg:p-8
                "
            >
                Loading teacher...
            </div>
        );
    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error && !teacher) {
        return (
            <div
                className="
                    p-4
                    sm:p-6
                    lg:p-8
                "
            >
                <div
                    className="
                        rounded-2xl
                        border
                        border-red-400/30
                        bg-red-400/5
                        p-4
                        text-sm
                        text-red-300
                        sm:p-5
                    "
                >
                    {error}
                </div>
            </div>
        );
    }

    // ======================================================
    // NOT FOUND
    // ======================================================

    if (!teacher) {
        return (
            <div
                className="
                    p-4
                    text-sm
                    opacity-60
                    sm:p-6
                    lg:p-8
                "
            >
                Teacher not found.
            </div>
        );
    }

    // ======================================================
    // PROFILE STATUS
    // ======================================================

    const active =
        teacher.isActive;

    // ======================================================
    // UI
    // ======================================================

    return (
        <>
            <main
                className="
                    w-full
                    min-w-0
                    space-y-5
                    p-4
                    sm:space-y-6
                    sm:p-6
                    lg:space-y-7
                    lg:p-8
                "
            >
                {/* =====================================================
                    PROFILE HEADER
                ====================================================== */}

                <section
                    className="
                        rounded-2xl
                        border
                        border-(--border)
                        p-4
                        sm:p-6
                    "
                >
                    <div
                        className="
                            flex
                            min-w-0
                            flex-col
                            gap-5
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                            lg:gap-6
                        "
                    >
                        {/* PROFILE */}

                        <div
                            className="
                                flex
                                min-w-0
                                items-center
                                gap-3
                                sm:gap-4
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
                                        h-16
                                        w-16
                                        shrink-0
                                        rounded-full
                                        border
                                        border-(--border)
                                        object-cover
                                        sm:h-20
                                        sm:w-20
                                    "
                                />
                            ) : (
                                <div
                                    className="
                                        flex
                                        h-16
                                        w-16
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-(--navy-800)
                                        text-lg
                                        font-semibold
                                        opacity-70
                                        sm:h-20
                                        sm:w-20
                                        sm:text-xl
                                    "
                                >
                                    {getInitials(
                                        teacher.name
                                    )}
                                </div>
                            )}

                            <div className="min-w-0">
                                <div
                                    className="
                                        flex
                                        min-w-0
                                        flex-wrap
                                        items-center
                                        gap-2
                                        sm:gap-3
                                    "
                                >
                                    <h1
                                        className="
                                            min-w-0
                                            max-w-full
                                            break-words
                                            font-serif
                                            text-xl
                                            font-semibold
                                            sm:text-2xl
                                        "
                                    >
                                        {
                                            teacher.name
                                        }
                                    </h1>

                                    {/* PROFILE STATUS */}

                                    <span
                                        className={`
                                            shrink-0
                                            rounded-lg
                                            px-2
                                            py-1
                                            text-[10px]
                                            font-semibold
                                            sm:px-2.5
                                            sm:py-1
                                            sm:text-xs
                                            ${
                                                active
                                                    ? "bg-green-400/10 text-green-400"
                                                    : "bg-red-400/10 text-red-400"
                                            }
                                        `}
                                    >
                                        {active
                                            ? "ACTIVE"
                                            : "INACTIVE"}
                                    </span>
                                </div>

                                <div
                                    className="
                                        mt-1
                                        truncate
                                        text-sm
                                        opacity-60
                                    "
                                >
                                    @
                                    {
                                        teacher.username
                                    }
                                </div>

                                <div
                                    className="
                                        mt-1
                                        text-xs
                                        opacity-40
                                    "
                                >
                                    Teacher
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                            ACTION BUTTONS
                        ================================================== */}

                        <div
                            className="
                                grid
                                w-full
                                grid-cols-2
                                gap-2
                                lg:w-auto
                                lg:flex
                                lg:flex-wrap
                            "
                        >
                            <Link
                                href={`/head/teachers/${teacher.id}/edit`}
                                className="
                                    inline-flex
                                    min-h-11
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
                                    hover:bg-(--gold-500)
                                    hover:text-black
                                    sm:px-6
                                "
                            >
                                Edit
                            </Link>

                            {active ? (
                                <button
                                    type="button"
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() =>
                                        openConfirmation(
                                            "DEACTIVATE"
                                        )
                                    }
                                    className="
                                        inline-flex
                                        min-h-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-(--gold-500)
                                        px-3
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-(--gold-500)
                                        transition
                                        hover:bg-(--gold-500)
                                        hover:text-black
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    Deactivate
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() =>
                                        openConfirmation(
                                            "ACTIVATE"
                                        )
                                    }
                                    className="
                                        inline-flex
                                        min-h-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-(--gold-500)
                                        px-3
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-(--gold-500)
                                        transition
                                        hover:bg-(--gold-500)
                                        hover:text-black
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    Activate
                                </button>
                            )}

                            <button
                                type="button"
                                disabled={
                                    actionLoading
                                }
                                onClick={() =>
                                    openConfirmation(
                                        "DELETE"
                                    )
                                }
                                className="
                                    inline-flex
                                    min-h-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    border
                                    border-(--gold-500)
                                    px-3
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-(--gold-500)
                                    transition
                                    hover:bg-(--gold-500)
                                    hover:text-black
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                Delete
                            </button>

                            <Link
                                href={`/api/head/teachers/${teacher.id}/view`}
                                className="
                                    col-span-2
                                    inline-flex
                                    min-h-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-(--gold-500)
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-black
                                    transition
                                    hover:bg-(--gold-500)/80
                                    lg:col-span-1
                                "
                            >
                                View Teacher Page
                            </Link>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    MESSAGES
                ====================================================== */}

                {message && (
                    <div
                        className="
                            rounded-xl
                            border
                            border-green-400/20
                            bg-green-400/5
                            px-4
                            py-3
                            text-sm
                            text-green-300
                        "
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        className="
                            rounded-xl
                            border
                            border-red-400/20
                            bg-red-400/5
                            px-4
                            py-3
                            text-sm
                            text-red-300
                        "
                    >
                        {error}
                    </div>
                )}

                {/* =====================================================
                    PROFILE + TASK STATISTICS
                ====================================================== */}

                <section
                    className="
                        grid
                        min-w-0
                        gap-4
                        lg:grid-cols-2
                        lg:gap-5
                    "
                >
                    {/* =================================================
                        PROFILE INFORMATION
                    ================================================== */}

                    <div
                        className="
                            min-w-0
                            rounded-2xl
                            border
                            border-(--border)
                            p-4
                            sm:p-6
                        "
                    >
                        <div>
                            <p
                                className="
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.18em]
                                    text-(--gold-400)
                                    sm:text-xs
                                    sm:tracking-[0.2em]
                                "
                            >
                                Account
                            </p>

                            <h2
                                className="
                                    mt-1
                                    font-serif
                                    text-lg
                                    sm:text-xl
                                "
                            >
                                Profile Information
                            </h2>
                        </div>

                        <div className="mt-5 space-y-4 sm:mt-6">
                            <InfoRow
                                label="Name"
                                value={
                                    teacher.name
                                }
                            />

                            <InfoRow
                                label="Username"
                                value={`@${teacher.username}`}
                            />

                            <InfoRow
                                label="Role"
                                value="Teacher"
                            />

                            <InfoRow
                                label="Profile Status"
                                value={
                                    active
                                        ? "Active"
                                        : "Inactive"
                                }
                            />

                            <InfoRow
                                label="Created At"
                                value={formatDate(
                                    teacher.createdAt
                                )}
                            />
                        </div>
                    </div>

                    {/* =================================================
                        TASK STATISTICS
                    ================================================== */}

                    <div
                        className="
                            min-w-0
                            rounded-2xl
                            border
                            border-(--border)
                            p-4
                            sm:p-6
                        "
                    >
                        <div>
                            <p
                                className="
                                    text-[10px]
                                    font-bold
                                    uppercase
                                    tracking-[0.18em]
                                    text-(--gold-400)
                                    sm:text-xs
                                    sm:tracking-[0.2em]
                                "
                            >
                                Activity
                            </p>

                            <h2
                                className="
                                    mt-1
                                    font-serif
                                    text-lg
                                    sm:text-xl
                                "
                            >
                                Task Statistics
                            </h2>
                        </div>

                        <div
                            className="
                                mt-5
                                grid
                                grid-cols-2
                                gap-2.5
                                sm:mt-6
                                sm:gap-3
                            "
                        >
                            <StatCard
                                label="Total Tasks"
                                value={
                                    taskStats.total
                                }
                            />

                            <StatCard
                                label="Checked Tasks"
                                value={
                                    taskStats.checked
                                }
                            />

                            <StatCard
                                label="Unchecked Tasks"
                                value={
                                    taskStats.unchecked
                                }
                            />

                            <StatCard
                                label="Performance"
                                value={
                                    performanceLabel
                                }
                                styling={`
                                    text-lg
                                    sm:text-[25px]
                                    ${
                                        performanceStats.performance ===
                                        "DILIGENT"
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }
                                `}
                            />
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    PERFORMANCE SUMMARY
                ====================================================== */}

                <section
                    className="
                        min-w-0
                        rounded-2xl
                        border
                        border-(--border)
                        p-4
                        sm:p-6
                    "
                >
                    <div>
                        <p
                            className="
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-[0.18em]
                                text-(--gold-400)
                                sm:text-xs
                                sm:tracking-[0.2em]
                            "
                        >
                            Performance
                        </p>

                        <h2
                            className="
                                mt-1
                                font-serif
                                text-xl
                                sm:text-2xl
                            "
                        >
                            Teacher Performance
                        </h2>

                        <p
                            className="
                                mt-1
                                max-w-2xl
                                text-xs
                                leading-5
                                opacity-50
                                sm:text-sm
                                sm:leading-6
                            "
                        >
                            Performance is calculated
                            from the teacher&apos;s task
                            activity over the previous
                            five days.
                        </p>
                    </div>

                    <div
                        className="
                            mt-5
                            grid
                            grid-cols-2
                            gap-2.5
                            sm:mt-6
                            sm:grid-cols-2
                            sm:gap-3
                            lg:grid-cols-4
                        "
                    >
                        <StatCard
                            label="Recent Tasks"
                            value={
                                performanceStats.totalRecentTasks
                            }
                            description="Tasks from previous five days"
                        />

                        <StatCard
                            label="Checked"
                            value={
                                performanceStats.checkedRecentTasks
                            }
                            description="Recently checked tasks"
                        />

                        <StatCard
                            label="Unchecked"
                            value={
                                performanceStats.uncheckedRecentTasks
                            }
                            description="Recently unchecked tasks"
                        />

                        <StatCard
                            label="Checked Rate"
                            value={`${performanceStats.checkedPercentage.toFixed(1)}%`}
                            description="Recent task completion rate"
                        />
                    </div>

                    {/* PERFORMANCE RESULT */}

                    <div
                        className="
                            mt-4
                            rounded-2xl
                            border
                            border-(--border)
                            p-4
                            sm:mt-5
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
                            "
                        >
                            <div className="min-w-0">
                                <p
                                    className="
                                        text-[10px]
                                        font-semibold
                                        uppercase
                                        tracking-[0.12em]
                                        opacity-45
                                        sm:text-xs
                                        sm:tracking-[0.15em]
                                    "
                                >
                                    Current Performance
                                </p>

                                <p
                                    className={`
                                        mt-1
                                        text-xl
                                        font-semibold
                                        sm:mt-2
                                        sm:text-2xl
                                        ${
                                            performanceStats.performance ===
                                            "DILIGENT"
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }
                                    `}
                                >
                                    {performanceLabel}
                                </p>
                            </div>

                            <div
                                className="
                                    border-t
                                    border-(--border)
                                    pt-3
                                    sm:border-t-0
                                    sm:pt-0
                                    sm:text-right
                                "
                            >
                                <p className="text-xs opacity-40">
                                    Recent checked rate
                                </p>

                                <p className="mt-1 text-lg font-semibold">
                                    {performanceStats.checkedPercentage.toFixed(
                                        1
                                    )}
                                    %
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* =========================================================
                CONFIRMATION MODAL
            ========================================================== */}

            {confirmationAction && (
                <div
                    className="
                        fixed
                        inset-0
                        z-100
                        flex
                        items-end
                        justify-center
                        overflow-y-auto
                        bg-black/60
                        px-3
                        py-3
                        backdrop-blur-[2px]
                        sm:items-center
                        sm:px-4
                        sm:py-8
                    "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                                event.currentTarget &&
                            !actionLoading
                        ) {
                            closeConfirmation();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirmation-title"
                        className="
                            w-full
                            max-w-97.5
                            overflow-hidden
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-[0_20px_70px_rgba(0,0,0,0.35)]
                        "
                    >
                        <div
                            className="
                                px-4
                                pb-5
                                pt-5
                                sm:px-6
                                sm:pb-5
                                sm:pt-6
                            "
                        >
                            {/* =================================================
                                ICON
                            ================================================== */}

                            <div
                                className={`
                                    flex
                                    h-10
                                    w-10
                                    items-center
                                    justify-center
                                    rounded-full
                                    sm:h-11
                                    sm:w-11
                                    ${
                                        confirmationAction ===
                                        "DELETE"
                                            ? "bg-red-400/10 text-red-400"
                                            : "bg-(--gold-500)/10 text-(--gold-400)"
                                    }
                                `}
                            >
                                {confirmationAction ===
                                "DELETE" ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            d="M4 7h16"
                                            strokeLinecap="round"
                                        />

                                        <path
                                            d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"
                                            strokeLinecap="round"
                                        />

                                        <path
                                            d="M18 7l-.7 12.5H6.7L6 7"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        <path
                                            d="M10 10.5v5M14 10.5v5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : confirmationAction ===
                                  "ACTIVATE" ? (
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            d="M12 4v16M4 12h16"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="h-5 w-5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            d="M6 6l12 12M18 6L6 18"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* =================================================
                                TITLE
                            ================================================== */}

                            <h2
                                id="confirmation-title"
                                className="
                                    mt-4
                                    font-serif
                                    text-lg
                                    font-semibold
                                    sm:mt-5
                                    sm:text-xl
                                "
                            >
                                {confirmationAction ===
                                "DELETE"
                                    ? "Delete teacher?"
                                    : confirmationAction ===
                                        "ACTIVATE"
                                      ? "Activate teacher?"
                                      : "Deactivate teacher?"}
                            </h2>

                            {/* =================================================
                                DESCRIPTION
                            ================================================== */}

                            <p
                                className="
                                    mt-2
                                    text-sm
                                    leading-5
                                    opacity-55
                                    sm:leading-6
                                "
                            >
                                {confirmationAction ===
                                "DELETE"
                                    ? `This will permanently remove ${teacher.name}'s account. This action cannot be undone.`
                                    : confirmationAction ===
                                        "ACTIVATE"
                                      ? `${teacher.name} will be able to access their account again.`
                                      : `${teacher.name} will no longer be able to access their account until activated again.`}
                            </p>
                        </div>

                        {/* =================================================
                            MODAL ACTIONS
                        ================================================== */}

                        <div
                            className="
                                flex
                                flex-col-reverse
                                gap-2
                                border-t
                                border-(--border)
                                px-4
                                py-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-end
                                sm:px-6
                            "
                        >
                            <button
                                type="button"
                                disabled={
                                    actionLoading
                                }
                                onClick={
                                    closeConfirmation
                                }
                                className="
                                    min-h-10
                                    rounded-lg
                                    px-4
                                    py-2
                                    text-sm
                                    opacity-60
                                    transition
                                    hover:bg-white/4
                                    hover:opacity-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-30
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    actionLoading
                                }
                                onClick={
                                    confirmTeacherAction
                                }
                                className={`
                                    min-h-10
                                    rounded-lg
                                    px-4
                                    py-2
                                    text-sm
                                    font-medium
                                    transition
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                    ${
                                        confirmationAction ===
                                        "DELETE"
                                            ? "bg-red-400 text-white hover:bg-red-400/85"
                                            : "bg-(--gold-500) text-black hover:bg-(--gold-500)/85"
                                    }
                                `}
                            >
                                {actionLoading
                                    ? "Processing..."
                                    : confirmationAction ===
                                        "DELETE"
                                      ? "Delete"
                                      : confirmationAction ===
                                          "ACTIVATE"
                                        ? "Activate"
                                        : "Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}