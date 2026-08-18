"use client";

import Link from "next/link";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

type Template = {
    id: string;
    name: string;
};

type Teacher = {
    id: string;
    name: string;
    username: string;
};

type DayPlan = {
    id: string;
    dayOfWeek: string;
    routineTemplateId: string | null;
    taskTemplateId: string | null;
    routineTemplate: Template | null;
    taskTemplate: Template | null;
};

type Student = {
    id: string;
    username: string;
    name: string;
    profileImg: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    teacher: Teacher | null;
};

type RoutineTemplate = Template & {
    items: {
        id: string;
        title: string;
        description: string | null;
        startTime: string;
        endTime: string;
        durationMin: number;
        sortOrder: number;
    }[];
};

type TaskTemplate = Template & {
    categories: {
        id: string;
        name: string;
        sortOrder: number;
        tasks: {
            id: string;
            title: string;
            description: string | null;
            deadline: string | null;
            difficulty: number;
            sortOrder: number;
        }[];
    }[];
};

type StudentAction =
    | "ACTIVATE"
    | "DEACTIVATE"
    | "DELETE"
    | null;

const DAYS = [
    {
        value: "MONDAY",
        label: "Monday",
    },
    {
        value: "TUESDAY",
        label: "Tuesday",
    },
    {
        value: "WEDNESDAY",
        label: "Wednesday",
    },
    {
        value: "THURSDAY",
        label: "Thursday",
    },
    {
        value: "FRIDAY",
        label: "Friday",
    },
    {
        value: "SATURDAY",
        label: "Saturday",
    },
    {
        value: "SUNDAY",
        label: "Sunday",
    },
] as const;

function getInitials(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (!parts.length) {
        return "S";
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

export default function StudentDetail({
    studentId,
}: {
    studentId: string;
}) {
    const [student, setStudent] =
        useState<Student | null>(null);

    const [
        routineTemplates,
        setRoutineTemplates,
    ] = useState<RoutineTemplate[]>([]);

    const [
        taskTemplates,
        setTaskTemplates,
    ] = useState<TaskTemplate[]>([]);

    const [plans, setPlans] =
        useState<DayPlan[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [
        confirmationAction,
        setConfirmationAction,
    ] = useState<StudentAction>(null);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [
                studentResponse,
                plansResponse,
            ] = await Promise.all([
                fetch(
                    `/api/head/students/${studentId}`,
                    {
                        cache: "no-store",
                    }
                ),
                fetch(
                    `/api/head/students/${studentId}/plans`,
                    {
                        cache: "no-store",
                    }
                ),
            ]);

            const studentData =
                await studentResponse.json();

            const plansData =
                await plansResponse.json();

            if (!studentResponse.ok) {
                throw new Error(
                    studentData?.message ||
                    "Failed to load student."
                );
            }

            if (!plansResponse.ok) {
                throw new Error(
                    plansData?.message ||
                    "Failed to load weekly plans."
                );
            }

            setStudent(
                studentData.student
            );

            setRoutineTemplates(
                Array.isArray(
                    plansData.routineTemplates
                )
                    ? plansData.routineTemplates
                    : []
            );

            setTaskTemplates(
                Array.isArray(
                    plansData.taskTemplates
                )
                    ? plansData.taskTemplates
                    : []
            );

            setPlans(
                Array.isArray(
                    plansData.plans
                )
                    ? plansData.plans
                    : []
            );
        } catch (error) {
            console.error(
                "LOAD STUDENT ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load student."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!studentId) {
            return;
        }

        void loadData();
    }, [studentId]);

    /*
     * Close confirmation modal with Escape.
     */

    useEffect(() => {
        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (
                event.key === "Escape" &&
                !actionLoading
            ) {
                setConfirmationAction(
                    null
                );
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

    function getPlan(
        dayOfWeek: string
    ): DayPlan {
        return (
            plans.find(
                (plan) =>
                    plan.dayOfWeek ===
                    dayOfWeek
            ) || {
                id: "",
                dayOfWeek,
                routineTemplateId: null,
                taskTemplateId: null,
                routineTemplate: null,
                taskTemplate: null,
            }
        );
    }

    function updatePlan(
        dayOfWeek: string,
        changes: Partial<DayPlan>
    ) {
        setPlans((current) => {
            const existing =
                current.find(
                    (plan) =>
                        plan.dayOfWeek ===
                        dayOfWeek
                );

            if (existing) {
                return current.map(
                    (plan) =>
                        plan.dayOfWeek ===
                            dayOfWeek
                            ? {
                                ...plan,
                                ...changes,
                            }
                            : plan
                );
            }

            return [
                ...current,
                {
                    id: "",
                    dayOfWeek,
                    routineTemplateId: null,
                    taskTemplateId: null,
                    routineTemplate: null,
                    taskTemplate: null,
                    ...changes,
                },
            ];
        });
    }

    function toggleOff(
        dayOfWeek: string
    ) {
        const plan =
            getPlan(dayOfWeek);

        const currentlyOff =
            plan.routineTemplateId ===
            null &&
            plan.taskTemplateId === null &&
            plan.id !== "";

        if (currentlyOff) {
            return;
        }

        updatePlan(
            dayOfWeek,
            {
                routineTemplateId: null,
                taskTemplateId: null,
                routineTemplate: null,
                taskTemplate: null,
            }
        );
    }

    function hasAssignment(
        plan: DayPlan
    ) {
        return Boolean(
            plan.routineTemplateId ||
            plan.taskTemplateId
        );
    }

    async function savePlans() {
        try {
            setSaving(true);
            setError("");
            setMessage("");

            const assignments =
                DAYS.map((day) => {
                    const plan =
                        getPlan(
                            day.value
                        );

                    return {
                        dayOfWeek:
                            day.value,
                        routineTemplateId:
                            plan.routineTemplateId,
                        taskTemplateId:
                            plan.taskTemplateId,
                    };
                });

            const response =
                await fetch(
                    `/api/head/students/${studentId}/plans`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            assignments,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to save plans."
                );
            }

            setPlans(
                Array.isArray(
                    data.plans
                )
                    ? data.plans
                    : []
            );

            setMessage(
                "Weekly routine and task assignments saved successfully."
            );
        } catch (error) {
            console.error(
                "SAVE PLANS ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to save plans."
            );
        } finally {
            setSaving(false);
        }
    }

    /*
     * Open confirmation modal.
     */

    function openConfirmation(
        action: Exclude<
            StudentAction,
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

    /*
     * Close confirmation modal.
     */

    function closeConfirmation() {
        if (actionLoading) {
            return;
        }

        setConfirmationAction(null);
    }

    /*
     * Perform confirmed student action.
     */

    async function confirmStudentAction() {
        if (
            !confirmationAction ||
            actionLoading
        ) {
            return;
        }

        const action =
            confirmationAction;

        try {
            setActionLoading(true);
            setError("");
            setMessage("");

            const response =
                await fetch(
                    `/api/head/students/${studentId}/actions`,
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
                    "Student action failed."
                );
            }

            if (
                action === "DELETE"
            ) {
                window.location.href =
                    "/head/students";
                return;
            }

            setConfirmationAction(
                null
            );

            setMessage(
                data.message ||
                "Student status updated successfully."
            );

            await loadData();
        } catch (error) {
            console.error(
                "STUDENT ACTION ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Student action failed."
            );

            setConfirmationAction(
                null
            );
        } finally {
            setActionLoading(false);
        }
    }

    /*
     * Weekly plan calculations
     */

    const weeklyStats = useMemo(() => {
        const configured = DAYS.filter(
            (day) => {
                const plan =
                    getPlan(day.value);

                return hasAssignment(
                    plan
                );
            }
        ).length;

        const routineDays = DAYS.filter(
            (day) =>
                Boolean(
                    getPlan(day.value)
                        .routineTemplateId
                )
        ).length;

        const taskDays = DAYS.filter(
            (day) =>
                Boolean(
                    getPlan(day.value)
                        .taskTemplateId
                )
        ).length;

        const offDays =
            DAYS.length - configured;

        return {
            configured,
            routineDays,
            taskDays,
            offDays,
        };
    }, [plans]);

    if (loading) {
        return (
            <div className="p-4 text-sm opacity-60 sm:p-6 lg:p-8">
                Loading student...
            </div>
        );
    }

    if (error && !student) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="rounded-2xl border border-red-400/30 bg-red-400/5 p-4 text-sm leading-6 text-red-300 sm:p-5">
                    {error}
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="p-4 text-sm opacity-60 sm:p-6 lg:p-8">
                Student not found.
            </div>
        );
    }

    const active =
        student.isActive;

    return (
        <>
            <main className="min-w-0 space-y-5 overflow-x-hidden p-4 sm:space-y-6 sm:p-6 lg:space-y-7 lg:p-8">
                {/* =====================================================
                    PROFILE HEADER
                ====================================================== */}

                <section className="rounded-2xl border border-(--border) p-4 sm:p-5 lg:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                        {/* PROFILE */}

                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            {student.profileImg ? (
                                <img
                                    src={
                                        student.profileImg
                                    }
                                    alt={
                                        student.name
                                    }
                                    className="h-16 w-16 shrink-0 rounded-full border border-(--border) object-cover sm:h-20 sm:w-20"
                                />
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-(--navy-800) text-lg font-semibold opacity-70 sm:h-20 sm:w-20 sm:text-xl">
                                    {getInitials(
                                        student.name
                                    )}
                                </div>
                            )}

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h1 className="min-w-0 break-words font-serif text-xl font-semibold leading-tight sm:text-2xl">
                                        {
                                            student.name
                                        }
                                    </h1>

                                    <span
                                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold tracking-wide sm:text-xs ${active
                                                ? "bg-green-400/10 text-green-400"
                                                : "bg-red-400/10 text-red-400"
                                            }`}
                                    >
                                        {active
                                            ? "ACTIVE"
                                            : "INACTIVE"}
                                    </span>
                                </div>

                                <div className="mt-1 truncate text-sm opacity-60">
                                    @
                                    {
                                        student.username
                                    }
                                </div>

                                <div className="mt-1 break-words text-xs leading-5 opacity-40">
                                    Student
                                    {student.teacher
                                        ? ` · ${student.teacher.name || student.teacher.username}`
                                        : ""}
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                            <Link
                                href={`/head/students/${student.id}/edit`}
                                className="flex min-h-11 items-center justify-center rounded-xl border border-(--gold-500) px-4 py-2.5 text-center text-sm font-medium text-(--gold-500) transition hover:bg-(--gold-500) hover:text-black sm:px-6"
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
                                    className="flex min-h-11 items-center justify-center rounded-xl border border-(--gold-500) px-3 py-2.5 text-center text-sm font-medium text-(--gold-500) transition hover:bg-(--gold-500) hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
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
                                    className="flex min-h-11 items-center justify-center rounded-xl border border-(--gold-500) px-3 py-2.5 text-center text-sm font-medium text-(--gold-500) transition hover:bg-(--gold-500) hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
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
                                className="flex min-h-11 items-center justify-center rounded-xl border border-(--gold-500) px-3 py-2.5 text-center text-sm font-medium text-(--gold-500) transition hover:bg-(--gold-500) hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                            >
                                Delete
                            </button>

                            <Link
                                href={`/api/head/students/${student.id}/view`}
                                className="col-span-2 flex min-h-11 items-center justify-center rounded-xl bg-(--gold-500) px-4 py-2.5 text-center text-sm font-medium text-black transition hover:bg-(--gold-500)/80 sm:col-span-1"
                            >
                                View Student Page
                            </Link>
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    MESSAGES
                ====================================================== */}

                {message && (
                    <div className="rounded-xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-sm leading-6 text-green-300">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300">
                        {error}
                    </div>
                )}

                {/* =====================================================
                    PROFILE INFORMATION + WEEKLY PLAN
                ====================================================== */}

                <section className="grid min-w-0 gap-4 sm:gap-5 lg:grid-cols-2">
                    {/* PROFILE INFORMATION */}

                    <div className="min-w-0 rounded-2xl border border-(--border) p-4 sm:p-5 lg:p-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gold-400) sm:text-xs">
                                Account
                            </p>

                            <h2 className="mt-1 font-serif text-lg sm:text-xl">
                                Profile Information
                            </h2>
                        </div>

                        <div className="mt-5 space-y-4 sm:mt-6">
                            <InfoRow
                                label="Name"
                                value={
                                    student.name
                                }
                            />

                            <InfoRow
                                label="Username"
                                value={`@${student.username}`}
                            />

                            <InfoRow
                                label="Status"
                                value={
                                    active
                                        ? "Active"
                                        : "Inactive"
                                }
                            />

                            <InfoRow
                                label="Created"
                                value={formatDate(
                                    student.createdAt
                                )}
                            />
                        </div>
                    </div>

                    {/* WEEKLY PLAN */}

                    <div className="min-w-0 rounded-2xl border border-(--border) p-4 sm:p-5 lg:p-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-(--gold-400) sm:text-xs">
                                Schedule
                            </p>

                            <h2 className="mt-1 font-serif text-lg sm:text-xl">
                                Weekly Plan
                            </h2>
                        </div>

                        <div className="mt-5 space-y-4 sm:mt-6">
                            <InfoRow
                                label="Configured"
                                value={`${weeklyStats.configured}/7`}
                            />

                            <InfoRow
                                label="Routine Days"
                                value={String(
                                    weeklyStats.routineDays
                                )}
                            />

                            <InfoRow
                                label="Task Days"
                                value={String(
                                    weeklyStats.taskDays
                                )}
                            />

                            <InfoRow
                                label="Off Days"
                                value={String(
                                    weeklyStats.offDays
                                )}
                            />
                        </div>
                    </div>
                </section>

                {/* =====================================================
                    ROUTINE + TASKS
                ====================================================== */}

                <section className="min-w-0 space-y-4 sm:space-y-5">
                    <div>
                        <h2 className="mt-1 font-serif text-xl sm:text-2xl">
                            Routine & Tasks
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm leading-6 opacity-50">
                            Assign the routine and
                            task template for each
                            day of the week.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-(--border)">
                        {DAYS.map(
                            (
                                day,
                                index
                            ) => {
                                const plan =
                                    getPlan(
                                        day.value
                                    );

                                const isOff =
                                    !hasAssignment(
                                        plan
                                    );

                                return (
                                    <div
                                        key={
                                            day.value
                                        }
                                        className={`p-4 sm:p-5 ${index >
                                                0
                                                ? "border-t border-(--border)"
                                                : ""
                                            }`}
                                    >
                                        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[140px_1fr_auto] lg:items-center">
                                            {/* DAY */}

                                            <div className="flex items-center justify-between lg:block">
                                                <div className="font-medium">
                                                    {
                                                        day.label
                                                    }
                                                </div>

                                                {isOff && (
                                                    <div className="text-xs font-medium text-red-400 lg:mt-1">
                                                        OFF
                                                    </div>
                                                )}
                                            </div>

                                            {/* ROUTINE + TASK */}

                                            <div className="grid min-w-0 gap-3 md:grid-cols-2">
                                                <div className="min-w-0">
                                                    <label
                                                        htmlFor={`routine-${day.value}`}
                                                        className="mb-1.5 block text-[11px] font-medium opacity-40 md:hidden"
                                                    >
                                                        Routine
                                                    </label>

                                                    <select
                                                        id={`routine-${day.value}`}
                                                        value={
                                                            plan.routineTemplateId ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            event
                                                        ) => {
                                                            updatePlan(
                                                                day.value,
                                                                {
                                                                    routineTemplateId:
                                                                        event
                                                                            .target
                                                                            .value ||
                                                                        null,
                                                                    routineTemplate:
                                                                        null,
                                                                }
                                                            );
                                                        }}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-(--border) bg-(--navy-900) px-3 py-3 text-sm outline-none transition focus:border-(--gold-500) sm:px-4"
                                                    >
                                                        <option value="">
                                                            No routine
                                                        </option>

                                                        {routineTemplates.map(
                                                            (
                                                                template
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        template.id
                                                                    }
                                                                    value={
                                                                        template.id
                                                                    }
                                                                >
                                                                    {
                                                                        template.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="min-w-0">
                                                    <label
                                                        htmlFor={`tasks-${day.value}`}
                                                        className="mb-1.5 block text-[11px] font-medium opacity-40 md:hidden"
                                                    >
                                                        Tasks
                                                    </label>

                                                    <select
                                                        id={`tasks-${day.value}`}
                                                        value={
                                                            plan.taskTemplateId ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            event
                                                        ) => {
                                                            updatePlan(
                                                                day.value,
                                                                {
                                                                    taskTemplateId:
                                                                        event
                                                                            .target
                                                                            .value ||
                                                                        null,
                                                                    taskTemplate:
                                                                        null,
                                                                }
                                                            );
                                                        }}
                                                        className="min-h-11 w-full min-w-0 rounded-xl border border-(--border) bg-(--navy-900) px-3 py-3 text-sm outline-none transition focus:border-(--gold-500) sm:px-4"
                                                    >
                                                        <option value="">
                                                            No tasks
                                                        </option>

                                                        {taskTemplates.map(
                                                            (
                                                                template
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        template.id
                                                                    }
                                                                    value={
                                                                        template.id
                                                                    }
                                                                >
                                                                    {
                                                                        template.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* OFF */}

                                            <div className="flex w-full">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleOff(
                                                            day.value
                                                        )
                                                    }
                                                    className={`min-h-11 w-full rounded-xl border px-4 py-3 text-sm transition sm:w-auto ${isOff
                                                            ? "border-red-400/40 bg-red-400/10 text-red-400"
                                                            : "border-(--border) hover:border-(--gold-500)"
                                                        }`}
                                                >
                                                    {isOff
                                                        ? "Off"
                                                        : "Set Off"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    <div className="flex w-full justify-stretch sm:justify-end">
                        <button
                            type="button"
                            disabled={saving}
                            onClick={
                                savePlans
                            }
                            className="min-h-11 w-full rounded-xl bg-(--gold-500) px-6 py-3 font-medium text-black transition hover:bg-(--gold-500)/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </section>
            </main>

            {/* =====================================================
                CONFIRMATION MODAL
            ====================================================== */}

            {confirmationAction && (
                <div
                    className="fixed inset-0 z-100 flex items-end justify-center overflow-y-auto bg-black/60 px-3 py-3 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-8"
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
                        className="w-full max-w-97.5 overflow-hidden rounded-2xl border border-(--border) bg-(--navy-900) shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
                    >
                        <div className="px-4 pb-5 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
                            {/* ICON */}

                            <div
                                className={`flex h-11 w-11 items-center justify-center rounded-full ${confirmationAction ===
                                        "DELETE"
                                        ? "bg-red-400/10 text-red-400"
                                        : "bg-(--gold-500)/10 text-(--gold-400)"
                                    }`}
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

                            {/* TITLE */}

                            <h2
                                id="confirmation-title"
                                className="mt-5 font-serif text-lg font-semibold sm:text-xl"
                            >
                                {confirmationAction ===
                                    "DELETE"
                                    ? "Delete student?"
                                    : confirmationAction ===
                                        "ACTIVATE"
                                        ? "Activate student?"
                                        : "Deactivate student?"}
                            </h2>

                            {/* DESCRIPTION */}

                            <p className="mt-2 text-sm leading-6 opacity-55">
                                {confirmationAction ===
                                    "DELETE"
                                    ? `This will permanently remove ${student.name}'s account. This action cannot be undone.`
                                    : confirmationAction ===
                                        "ACTIVATE"
                                        ? `${student.name} will be able to access their account again.`
                                        : `${student.name} will no longer be able to access their account until activated again.`}
                            </p>
                        </div>

                        {/* ACTIONS */}

                        <div className="grid grid-cols-2 gap-2 border-t border-(--border) px-4 py-4 sm:flex sm:items-center sm:justify-end sm:px-6">
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={
                                    closeConfirmation
                                }
                                className="min-h-11 rounded-xl px-4 py-2 text-sm opacity-60 transition hover:bg-white/4 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={
                                    confirmStudentAction
                                }
                                className={`min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmationAction ===
                                        "DELETE"
                                        ? "bg-red-400 text-white hover:bg-red-400/85"
                                        : "bg-(--gold-500) text-black hover:bg-(--gold-500)/85"
                                    }`}
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

/* ==========================================================
   INFO ROW
========================================================== */

function InfoRow({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-(--border) pb-3 text-sm last:border-b-0 last:pb-0">
            <span className="shrink-0 opacity-40">
                {label}
            </span>

            <span className="min-w-0 break-words text-right">
                {value}
            </span>
        </div>
    );
}