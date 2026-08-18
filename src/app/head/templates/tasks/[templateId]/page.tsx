"use client";

import Link from "next/link";

import {
    ArrowLeft,
    Clock3,
    Pencil,
    Trash2,
    UserRound,
    X,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";

type Teacher = {
    id: string;
    name: string;
    username: string;
};

type TaskItem = {
    id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    difficulty: number;
    sortOrder: number;
    teacher: Teacher;
};

type TaskCategory = {
    id: string;
    name: string;
    sortOrder: number;
    tasks: TaskItem[];
};

type TaskTemplate = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    categories: TaskCategory[];
};

function formatDeadline(
    time: string | null
) {
    if (!time) {
        return "No deadline";
    }

    const [
        hours,
        minutes,
    ] = time
        .split(":")
        .map(Number);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return time;
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }
    ).format(date);
}

function getDifficultyLabel(
    difficulty: number
) {
    return `${difficulty}x`;
}

export default function ViewTaskTemplatePage() {
    const router = useRouter();
    const params = useParams();

    const templateId =
        typeof params.templateId ===
        "string"
            ? params.templateId
            : Array.isArray(
                  params.templateId
              )
            ? params.templateId[0]
            : "";

    // ==========================================================
    // PAGE STATE
    // ==========================================================

    const [
        template,
        setTemplate,
    ] = useState<TaskTemplate | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        deleting,
        setDeleting,
    ] = useState(false);

    const [
        deleteError,
        setDeleteError,
    ] = useState("");

    // ==========================================================
    // DELETE CONFIRMATION MODAL
    // ==========================================================

    const [
        deleteModalOpen,
        setDeleteModalOpen,
    ] = useState(false);

    // ==========================================================
    // LOAD TEMPLATE
    // ==========================================================

    useEffect(() => {
        if (!templateId) {
            setError(
                "Task template ID is missing."
            );

            setLoading(false);

            return;
        }

        async function loadTemplate() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `/api/head/templates/tasks/${templateId}`,
                        {
                            method: "GET",
                            cache: "no-store",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    setError(
                        data.message ||
                            "Failed to load task template."
                    );

                    return;
                }

                if (!data.template) {
                    setError(
                        "Task template was not returned by the server."
                    );

                    return;
                }

                setTemplate(
                    data.template as TaskTemplate
                );
            } catch (error) {
                console.error(
                    "LOAD TASK TEMPLATE ERROR:",
                    error
                );

                setError(
                    "Something went wrong while loading the task template."
                );
            } finally {
                setLoading(false);
            }
        }

        loadTemplate();
    }, [templateId]);

    // ==========================================================
    // TOTAL TASKS
    // ==========================================================

    const totalTasks = useMemo(
        () =>
            template?.categories.reduce(
                (
                    total,
                    category
                ) =>
                    total +
                    category.tasks
                        .length,
                0
            ) ?? 0,
        [template]
    );

    // ==========================================================
    // DELETE TEMPLATE
    // ==========================================================

    async function handleDeleteTemplate() {
        if (!templateId) {
            return;
        }

        try {
            setDeleting(true);
            setDeleteError("");

            const response =
                await fetch(
                    `/api/head/templates/tasks/${templateId}`,
                    {
                        method: "DELETE",
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setDeleteError(
                    data.message ||
                        "Failed to delete task template."
                );

                return;
            }

            setDeleteModalOpen(false);

            router.push(
                "/head/templates/tasks"
            );

            router.refresh();
        } catch (error) {
            console.error(
                "DELETE TASK TEMPLATE ERROR:",
                error
            );

            setDeleteError(
                "Something went wrong while deleting the task template."
            );
        } finally {
            setDeleting(false);
        }
    }

    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/head/templates/tasks"
                        )
                    }
                    className="
                        inline-flex
                        min-h-10
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-(--border)
                        px-3
                        py-2
                        text-sm
                        opacity-70
                        transition
                        hover:bg-(--navy-800)
                        hover:text-(--gold-500)
                        hover:opacity-100
                    "
                >
                    <ArrowLeft
                        size={18}
                        strokeWidth={1.8}
                    />

                    <span>Back to Tasks</span>
                </button>

                <div>
                    <h1 className="text-2xl font-semibold tracking-wide sm:text-3xl sm:tracking-wider">
                        Task Template
                    </h1>

                    <p className="mt-1 text-sm opacity-60">
                        Loading task template...
                    </p>
                </div>

                <div
                    className="
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-4
                        py-12
                        text-center
                        text-sm
                        opacity-50
                        sm:p-12
                    "
                >
                    Loading task template...
                </div>
            </div>
        );
    }

    // ==========================================================
    // ERROR
    // ==========================================================

    if (error || !template) {
        return (
            <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/head/templates/tasks"
                        )
                    }
                    className="
                        inline-flex
                        min-h-10
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-(--border)
                        px-3
                        py-2
                        text-sm
                        opacity-70
                        transition
                        hover:bg-(--navy-800)
                        hover:text-(--gold-500)
                        hover:opacity-100
                    "
                >
                    <ArrowLeft
                        size={18}
                        strokeWidth={1.8}
                    />

                    <span>Back to Tasks</span>
                </button>

                <div>
                    <h1 className="text-2xl font-semibold tracking-wide sm:text-3xl sm:tracking-wider">
                        Task Template
                    </h1>

                    <p className="mt-1 text-sm opacity-60">
                        View task template details.
                    </p>
                </div>

                <div
                    className="
                        rounded-xl
                        border
                        border-red-400/30
                        bg-red-400/5
                        px-4
                        py-3
                        text-sm
                        leading-6
                        text-red-300
                    "
                >
                    {error ||
                        "Task template not found."}
                </div>
            </div>
        );
    }

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">

            {/* =====================================================
                BACK BUTTON
            ====================================================== */}

            <button
                type="button"
                onClick={() =>
                    router.push(
                        "/head/templates/tasks"
                    )
                }
                className="
                    inline-flex
                    min-h-10
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-(--border)
                    px-3
                    py-2
                    text-sm
                    opacity-70
                    transition
                    hover:bg-(--navy-800)
                    hover:text-(--gold-500)
                    hover:opacity-100
                "
            >
                <ArrowLeft
                    size={18}
                    strokeWidth={1.8}
                />

                <span>Back to Tasks</span>
            </button>

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-5
                    sm:gap-6
                    lg:flex-row
                    lg:items-start
                    lg:justify-between
                "
            >
                <div className="min-w-0">
                    <h1
                        className="
                            break-words
                            text-2xl
                            font-semibold
                            tracking-wide
                            sm:text-3xl
                            sm:tracking-wider
                        "
                    >
                        {template.name}
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
                        View categories and
                        scheduled tasks in
                        this template.
                    </p>
                </div>

                <div
                    className="
                        grid
                        w-full
                        grid-cols-2
                        gap-2
                        sm:flex
                        sm:w-auto
                        sm:items-center
                        sm:gap-3
                    "
                >

                    {/* EDIT TEMPLATE */}

                    <Link
                        href={`/head/templates/tasks/${template.id}/edit`}
                        className="
                            inline-flex
                            min-h-11
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-(--border)
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            opacity-80
                            transition
                            hover:border-(--gold-500)
                            hover:bg-(--navy-800)
                            hover:text-(--gold-500)
                            hover:opacity-100
                        "
                    >
                        <Pencil
                            size={17}
                            strokeWidth={1.8}
                        />

                        Edit
                    </Link>

                    {/* DELETE TEMPLATE */}

                    <button
                        type="button"
                        onClick={() => {
                            setDeleteError("");
                            setDeleteModalOpen(
                                true
                            );
                        }}
                        className="
                            inline-flex
                            min-h-11
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-red-400/30
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-red-300
                            transition
                            hover:bg-red-400/10
                        "
                    >
                        <Trash2
                            size={17}
                            strokeWidth={1.8}
                        />

                        Delete
                    </button>
                </div>
            </div>

            {/* =====================================================
                TEMPLATE NAME
            ====================================================== */}

            <section
                className="
                    rounded-2xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    p-4
                    sm:p-6
                "
            >
                <div
                    className="
                        flex
                        items-start
                        justify-between
                        gap-4
                    "
                >
                    <div className="min-w-0">
                        <p className="text-sm font-medium">
                            Template Name
                        </p>

                        <p className="mt-1 text-xs leading-5 opacity-40">
                            Name of this task template.
                        </p>
                    </div>

                    <span className="shrink-0 text-xs opacity-40">
                        {template.name.length}
                    </span>
                </div>

                <div
                    className="
                        mt-3
                        w-full
                        overflow-hidden
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-800)
                        px-4
                        py-3
                        text-sm
                        break-words
                    "
                >
                    {template.name}
                </div>
            </section>

            {/* =====================================================
                CATEGORIES
            ====================================================== */}

            <section
                className="
                    rounded-2xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    p-4
                    sm:p-6
                "
            >
                {/* CATEGORY SECTION HEADER */}

                <div
                    className="
                        flex
                        items-start
                        justify-between
                        gap-4
                    "
                >
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold">
                            Categories
                        </h2>

                        <p className="mt-1 text-xs leading-5 opacity-50">
                            {template.categories.length}{" "}
                            {template.categories.length ===
                            1
                                ? "category"
                                : "categories"}{" "}
                            ·{" "}
                            {totalTasks}{" "}
                            {totalTasks === 1
                                ? "task"
                                : "tasks"}
                        </p>
                    </div>
                </div>

                {/* EMPTY CATEGORIES */}

                {template.categories.length ===
                    0 && (
                    <div
                        className="
                            mt-5
                            rounded-xl
                            border
                            border-dashed
                            border-(--border)
                            px-4
                            py-10
                            text-center
                            sm:mt-6
                            sm:px-6
                            sm:py-12
                        "
                    >
                        <p className="text-sm opacity-50">
                            No categories in
                            this template.
                        </p>
                    </div>
                )}

                {/* CATEGORY LIST */}

                <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">

                    {template.categories.map(
                        (
                            category
                        ) => (
                            <div
                                key={
                                    category.id
                                }
                                className="
                                    min-w-0
                                    overflow-hidden
                                    rounded-2xl
                                    border
                                    border-(--border)
                                "
                            >

                                {/* CATEGORY HEADER */}

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        border-b
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-3.5
                                        sm:px-5
                                        sm:py-4
                                    "
                                >
                                    <div className="min-w-0">
                                        <h3 className="break-words font-medium">
                                            {
                                                category.name
                                            }
                                        </h3>

                                        <p className="mt-1 text-xs opacity-40">
                                            {
                                                category
                                                    .tasks
                                                    .length
                                            }{" "}
                                            {category
                                                .tasks
                                                .length ===
                                            1
                                                ? "task"
                                                : "tasks"}
                                        </p>
                                    </div>
                                </div>

                                {/* TASKS */}

                                <div className="p-3.5 sm:p-5">

                                    {/* EMPTY TASKS */}

                                    {category.tasks.length ===
                                        0 && (
                                        <p className="py-4 text-center text-sm leading-6 opacity-40">
                                            No tasks in
                                            this
                                            category.
                                        </p>
                                    )}

                                    {/* TASK LIST */}

                                    {category.tasks.length >
                                        0 && (
                                        <div className="space-y-3">

                                            {category.tasks.map(
                                                (
                                                    task
                                                ) => (
                                                    <div
                                                        key={
                                                            task.id
                                                        }
                                                        className="
                                                            min-w-0
                                                            rounded-xl
                                                            border
                                                            border-(--border)
                                                            px-3.5
                                                            py-3.5
                                                            sm:px-4
                                                            sm:py-4
                                                        "
                                                    >
                                                        <div className="min-w-0">

                                                            {/* TITLE + TAGS */}

                                                            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">

                                                                <p className="min-w-0 max-w-full break-words font-medium leading-6">
                                                                    {
                                                                        task.title
                                                                    }
                                                                </p>

                                                                {/* DEADLINE TAG */}

                                                                <span
                                                                    className="
                                                                        inline-flex
                                                                        max-w-full
                                                                        shrink-0
                                                                        items-center
                                                                        gap-1
                                                                        rounded-md
                                                                        border
                                                                        border-(--gold-500)/30
                                                                        bg-(--gold-500)/10
                                                                        px-2
                                                                        py-1
                                                                        text-[10px]
                                                                        font-medium
                                                                        leading-none
                                                                        text-(--gold-500)
                                                                        sm:text-[11px]
                                                                    "
                                                                >
                                                                    <Clock3
                                                                        size={
                                                                            11
                                                                        }
                                                                    />

                                                                    {formatDeadline(
                                                                        task.deadline
                                                                    )}
                                                                </span>

                                                                {/* DIFFICULTY TAG */}

                                                                <span
                                                                    className="
                                                                        shrink-0
                                                                        rounded-md
                                                                        border
                                                                        border-(--border)
                                                                        bg-(--navy-800)
                                                                        px-2
                                                                        py-1
                                                                        text-[10px]
                                                                        font-medium
                                                                        leading-none
                                                                        opacity-70
                                                                        sm:text-[11px]
                                                                    "
                                                                >
                                                                    {getDifficultyLabel(
                                                                        task.difficulty
                                                                    )}
                                                                </span>

                                                            </div>

                                                            {/* DESCRIPTION */}

                                                            {task.description && (
                                                                <p className="mt-2 break-words text-sm leading-6 opacity-50">
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                            )}

                                                            {/* TEACHER */}

                                                            <p className="mt-3 flex min-w-0 items-start gap-1.5 text-xs leading-5 opacity-50">
                                                                <UserRound
                                                                    size={
                                                                        13
                                                                    }
                                                                    className="mt-0.5 shrink-0"
                                                                />

                                                                <span className="min-w-0 break-words">
                                                                    Teacher:{" "}
                                                                    {task.teacher
                                                                        ?.name ||
                                                                        task
                                                                            .teacher
                                                                            ?.username ||
                                                                        "Unknown"}
                                                                </span>
                                                            </p>

                                                        </div>
                                                    </div>
                                                )
                                            )}

                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                </div>
            </section>

            {/* =====================================================
                DELETE TEMPLATE CONFIRMATION MODAL
            ====================================================== */}

            {deleteModalOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        z-110
                        flex
                        items-end
                        justify-center
                        overflow-y-auto
                        bg-black/60
                        px-3
                        py-3
                        sm:items-center
                        sm:px-4
                        sm:py-8
                    "
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            if (!deleting) {
                                setDeleteModalOpen(
                                    false
                                );

                                setDeleteError(
                                    ""
                                );
                            }
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-md
                            max-h-[calc(100dvh-24px)]
                            overflow-y-auto
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:max-h-[calc(100dvh-48px)]
                        "
                    >

                        {/* MODAL HEADER */}

                        <div
                            className="
                                flex
                                items-start
                                justify-between
                                gap-3
                                border-b
                                border-(--border)
                                px-4
                                py-4
                                sm:px-6
                                sm:py-5
                            "
                        >
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold sm:text-lg">
                                    Delete Task Template
                                </h2>

                                <p className="mt-1 text-xs leading-5 opacity-50">
                                    This action
                                    cannot be
                                    undone.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={
                                    deleting
                                }
                                onClick={() => {
                                    setDeleteModalOpen(
                                        false
                                    );

                                    setDeleteError(
                                        ""
                                    );
                                }}
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    opacity-50
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                    disabled:cursor-not-allowed
                                "
                                aria-label="Close"
                            >
                                <X
                                    size={17}
                                />
                            </button>
                        </div>

                        {/* MODAL CONTENT */}

                        <div className="p-4 sm:p-6">

                            <p className="text-sm leading-6 opacity-70">
                                Are you sure you
                                want to delete{" "}
                                <span className="break-words font-semibold text-white">
                                    "{template.name}"
                                </span>
                                ?
                            </p>

                            <div
                                className="
                                    mt-4
                                    rounded-xl
                                    border
                                    border-red-400/20
                                    bg-red-400/5
                                    px-3.5
                                    py-3
                                    text-sm
                                    leading-6
                                    text-red-300
                                    sm:px-4
                                "
                            >
                                This will permanently
                                delete the template,
                                including all{" "}
                                <span className="font-semibold">
                                    {totalTasks}
                                </span>{" "}
                                {totalTasks === 1
                                    ? "task"
                                    : "tasks"}{" "}
                                inside it.
                            </div>

                            {/* DELETE ERROR */}

                            {deleteError && (
                                <div
                                    className="
                                        mt-4
                                        rounded-xl
                                        border
                                        border-red-400/30
                                        bg-red-400/5
                                        px-3.5
                                        py-3
                                        text-sm
                                        leading-6
                                        text-red-300
                                        sm:px-4
                                    "
                                >
                                    {
                                        deleteError
                                    }
                                </div>
                            )}

                            {/* ACTIONS */}

                            <div
                                className="
                                    mt-6
                                    flex
                                    flex-col-reverse
                                    gap-2.5
                                    sm:flex-row
                                    sm:justify-end
                                    sm:gap-3
                                "
                            >

                                <button
                                    type="button"
                                    disabled={
                                        deleting
                                    }
                                    onClick={() => {
                                        setDeleteModalOpen(
                                            false
                                        );

                                        setDeleteError(
                                            ""
                                        );
                                    }}
                                    className="
                                        min-h-11
                                        rounded-xl
                                        border
                                        border-(--border)
                                        px-4
                                        py-2.5
                                        text-sm
                                        opacity-70
                                        transition
                                        hover:opacity-100
                                        disabled:cursor-not-allowed
                                        disabled:opacity-40
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        deleting
                                    }
                                    onClick={
                                        handleDeleteTemplate
                                    }
                                    className="
                                        inline-flex
                                        min-h-11
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-red-500
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-red-600
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    <Trash2
                                        size={15}
                                    />

                                    {deleting
                                        ? "Deleting..."
                                        : "Delete Template"}
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}