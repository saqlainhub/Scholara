"use client";

import Link from "next/link";

import {
    Eye,
    Pencil,
    Plus,
    Trash2,
    X,
    AlertTriangle,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

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

export default function TasksPage() {
    const [
        templates,
        setTemplates,
    ] = useState<TaskTemplate[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        deletingId,
        setDeletingId,
    ] = useState<string | null>(null);

    const [
        deleteTarget,
        setDeleteTarget,
    ] = useState<TaskTemplate | null>(
        null
    );

    // ==========================================================
    // LOAD TASK TEMPLATES
    // ==========================================================

    async function loadTemplates() {
        try {
            setLoading(true);
            setError("");

            const response =
                await fetch(
                    "/api/head/templates/tasks",
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
                    "Failed to load task templates."
                );

                return;
            }

            setTemplates(
                Array.isArray(
                    data.templates
                )
                    ? data.templates
                    : []
            );
        } catch (error) {
            console.error(
                "LOAD TASK TEMPLATES ERROR:",
                error
            );

            setError(
                "Something went wrong while loading task templates."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTemplates();
    }, []);

    // ==========================================================
    // TOTAL TASK COUNT
    // ==========================================================

    function getTaskCount(
        template: TaskTemplate
    ) {
        return template.categories.reduce(
            (
                total,
                category
            ) =>
                total +
                category.tasks.length,
            0
        );
    }

    // ==========================================================
    // OPEN DELETE MODAL
    // ==========================================================

    function openDeleteModal(
        template: TaskTemplate
    ) {
        if (deletingId) {
            return;
        }

        setError("");
        setDeleteTarget(template);
    }

    // ==========================================================
    // CLOSE DELETE MODAL
    // ==========================================================

    function closeDeleteModal() {
        if (deletingId) {
            return;
        }

        setDeleteTarget(null);
    }

    // ==========================================================
    // DELETE TEMPLATE
    // ==========================================================

    async function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        const templateId =
            deleteTarget.id;

        try {
            setDeletingId(templateId);
            setError("");

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
                setError(
                    data.message ||
                    "Failed to delete task template."
                );

                return;
            }

            setTemplates(
                (currentTemplates) =>
                    currentTemplates.filter(
                        (template) =>
                            template.id !==
                            templateId
                    )
            );

            setDeleteTarget(null);
        } catch (error) {
            console.error(
                "DELETE TASK TEMPLATE ERROR:",
                error
            );

            setError(
                "Something went wrong while deleting the task template."
            );
        } finally {
            setDeletingId(null);
        }
    }

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div
            className="
                w-full
                space-y-6
                px-4
                py-5
                sm:space-y-7
                sm:px-6
                sm:py-7
                lg:space-y-8
                lg:px-8
                lg:py-8
            "
        >

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-5
                    sm:flex-row
                    sm:items-end
                    sm:justify-between
                    sm:gap-6
                "
            >
                <div className="min-w-0">
                    <p
                        className="
                            mb-2
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-[0.22em]
                            text-(--gold-400)
                            sm:text-xs
                            sm:tracking-[0.3em]
                        "
                    >
                        Head Portal
                    </p>

                    <h1
                        className="
                            font-heading
                            text-2xl
                            font-bold
                            tracking-wide
                            text-white
                            sm:text-3xl
                            md:text-4xl
                            lg:text-5xl
                        "
                    >
                        Task Templates
                    </h1>

                    <p
                        className="
                            mt-2
                            max-w-2xl
                            text-xs
                            leading-5
                            opacity-60
                            sm:mt-3
                            sm:text-sm
                            sm:leading-6
                        "
                    >
                        Create and manage task templates
                    </p>
                </div>

                <Link
                    href="/head/templates/tasks/create"
                    className="
                        inline-flex
                        min-h-11
                        w-full
                        shrink-0
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-(--gold-500)
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-black
                        transition
                        hover:opacity-90
                        active:scale-[0.98]
                        sm:w-auto
                    "
                >
                    <Plus
                        size={18}
                        strokeWidth={2}
                    />

                    <span>Create New</span>
                </Link>
            </div>

            {/* =====================================================
                ERROR
            ====================================================== */}

            {error && (
                <div
                    className="
                        rounded-xl
                        border
                        border-red-400/30
                        bg-red-400/5
                        px-4
                        py-3
                        text-xs
                        leading-5
                        text-red-300
                        sm:text-sm
                    "
                >
                    {error}
                </div>
            )}

            {/* =====================================================
                MOBILE TEMPLATE CARDS
            ====================================================== */}

            <div
                className="
                    space-y-3
                    md:hidden
                "
            >
                {loading && (
                    <div
                        className="
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            px-5
                            py-14
                            text-center
                        "
                    >
                        <p className="text-sm opacity-50">
                            Loading task templates...
                        </p>
                    </div>
                )}

                {!loading &&
                    templates.length === 0 && (
                        <div
                            className="
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                px-5
                                py-12
                                text-center
                            "
                        >
                            <div className="space-y-2">
                                <p className="text-sm font-semibold">
                                    No task templates yet
                                </p>

                                <p className="text-xs leading-5 opacity-50">
                                    Create your first task
                                    template to get started.
                                </p>
                            </div>

                            <Link
                                href="/head/templates/tasks/create"
                                className="
                                    mt-5
                                    inline-flex
                                    min-h-10
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-(--gold-500)
                                    px-4
                                    py-2.5
                                    text-xs
                                    font-medium
                                    text-(--gold-500)
                                    transition
                                    hover:bg-(--gold-500)
                                    hover:text-black
                                "
                            >
                                <Plus
                                    size={16}
                                />

                                Create Template
                            </Link>
                        </div>
                    )}

                {!loading &&
                    templates.map(
                        (template) => {
                            const taskCount =
                                getTaskCount(
                                    template
                                );

                            return (
                                <div
                                    key={
                                        template.id
                                    }
                                    className="
                                        overflow-hidden
                                        rounded-2xl
                                        border
                                        border-(--border)
                                        bg-(--navy-900)
                                    "
                                >
                                    {/* Card Content */}

                                    <div
                                        className="
                                            min-w-0
                                            px-4
                                            py-4
                                        "
                                    >
                                        <div className="min-w-0">
                                            <h2
                                                className="
                                                    truncate
                                                    text-[15px]
                                                    font-semibold
                                                    leading-6
                                                "
                                                title={
                                                    template.name
                                                }
                                            >
                                                {
                                                    template.name
                                                }
                                            </h2>

                                            <div
                                                className="
                                                    mt-2
                                                    flex
                                                    flex-wrap
                                                    items-center
                                                    gap-x-2
                                                    gap-y-1
                                                    text-[11px]
                                                    opacity-45
                                                "
                                            >
                                                <span>
                                                    {
                                                        template
                                                            .categories
                                                            .length
                                                    }{" "}
                                                    {template
                                                        .categories
                                                        .length ===
                                                    1
                                                        ? "category"
                                                        : "categories"}
                                                </span>

                                                <span
                                                    className="
                                                        h-1
                                                        w-1
                                                        rounded-full
                                                        bg-current
                                                    "
                                                />

                                                <span>
                                                    {
                                                        taskCount
                                                    }{" "}
                                                    {taskCount ===
                                                    1
                                                        ? "task"
                                                        : "tasks"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Actions */}

                                    <div
                                        className="
                                            grid
                                            grid-cols-3
                                            border-t
                                            border-(--border)
                                        "
                                    >
                                        <Link
                                            href={`/head/templates/tasks/${template.id}/edit`}
                                            className="
                                                flex
                                                min-h-11
                                                items-center
                                                justify-center
                                                gap-2
                                                border-r
                                                border-(--border)
                                                text-xs
                                                font-medium
                                                opacity-65
                                                transition
                                                hover:bg-(--navy-800)
                                                hover:text-(--gold-500)
                                                hover:opacity-100
                                                active:bg-(--navy-800)
                                            "
                                            aria-label={`Edit ${template.name}`}
                                        >
                                            <Pencil
                                                size={15}
                                                strokeWidth={
                                                    1.8
                                                }
                                            />

                                            <span>
                                                Edit
                                            </span>
                                        </Link>

                                        <Link
                                            href={`/head/templates/tasks/${template.id}`}
                                            className="
                                                flex
                                                min-h-11
                                                items-center
                                                justify-center
                                                gap-2
                                                border-r
                                                border-(--border)
                                                text-xs
                                                font-medium
                                                opacity-65
                                                transition
                                                hover:bg-(--navy-800)
                                                hover:text-(--gold-500)
                                                hover:opacity-100
                                                active:bg-(--navy-800)
                                            "
                                            aria-label={`View ${template.name}`}
                                        >
                                            <Eye
                                                size={16}
                                                strokeWidth={
                                                    1.8
                                                }
                                            />

                                            <span>
                                                View
                                            </span>
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openDeleteModal(
                                                    template
                                                )
                                            }
                                            disabled={
                                                deletingId !==
                                                null
                                            }
                                            className="
                                                flex
                                                min-h-11
                                                items-center
                                                justify-center
                                                gap-2
                                                text-xs
                                                font-medium
                                                opacity-65
                                                transition
                                                hover:bg-red-400/10
                                                hover:text-red-400
                                                hover:opacity-100
                                                active:bg-red-400/10
                                                disabled:cursor-not-allowed
                                                disabled:opacity-30
                                            "
                                            aria-label={`Delete ${template.name}`}
                                        >
                                            <Trash2
                                                size={15}
                                                strokeWidth={
                                                    1.8
                                                }
                                            />

                                            <span>
                                                Delete
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                    )}
            </div>

            {/* =====================================================
                DESKTOP TABLE
            ====================================================== */}

            <div
                className="
                    hidden
                    overflow-hidden
                    rounded-2xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    md:block
                "
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr
                                className="
                                    border-b
                                    border-(--border)
                                    text-left
                                    text-sm
                                    opacity-70
                                "
                            >
                                <th className="px-6 py-4 font-medium">
                                    Name
                                </th>

                                <th className="w-24 px-4 py-4 text-center font-medium">
                                    Edit
                                </th>

                                <th className="w-24 px-4 py-4 text-center font-medium">
                                    View
                                </th>

                                <th className="w-24 px-4 py-4 text-center font-medium">
                                    Delete
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {/* LOADING */}

                            {loading && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="
                                            px-6
                                            py-16
                                            text-center
                                        "
                                    >
                                        <p className="text-sm opacity-50">
                                            Loading task templates...
                                        </p>
                                    </td>
                                </tr>
                            )}

                            {/* EMPTY */}

                            {!loading &&
                                templates.length ===
                                    0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="
                                                px-6
                                                py-16
                                                text-center
                                            "
                                        >
                                            <div className="space-y-2">
                                                <p className="text-base font-medium">
                                                    No task templates yet
                                                </p>

                                                <p className="text-sm opacity-50">
                                                    Create your first task
                                                    template to get started.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                            {/* TEMPLATES */}

                            {!loading &&
                                templates.map(
                                    (
                                        template
                                    ) => (
                                        <tr
                                            key={
                                                template.id
                                            }
                                            className="
                                                border-b
                                                border-(--border)
                                                last:border-b-0
                                                transition-colors
                                                hover:bg-(--navy-800)
                                            "
                                        >
                                            {/* Name */}

                                            <td className="px-6 py-4">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">
                                                        {
                                                            template.name
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs opacity-40">
                                                        {
                                                            template
                                                                .categories
                                                                .length
                                                        }{" "}
                                                        {
                                                            template
                                                                .categories
                                                                .length ===
                                                            1
                                                                ? "category"
                                                                : "categories"
                                                        }{" "}
                                                        •{" "}
                                                        {
                                                            getTaskCount(
                                                                template
                                                            )
                                                        }{" "}
                                                        {
                                                            getTaskCount(
                                                                template
                                                            ) ===
                                                            1
                                                                ? "task"
                                                                : "tasks"
                                                        }
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Edit */}

                                            <td className="px-4 py-4 text-center">
                                                <Link
                                                    href={`/head/templates/tasks/${template.id}/edit`}
                                                    className="
                                                        mx-auto
                                                        flex
                                                        h-9
                                                        w-9
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        opacity-50
                                                        transition
                                                        hover:bg-(--navy-800)
                                                        hover:text-(--gold-500)
                                                        hover:opacity-100
                                                    "
                                                    aria-label={`Edit ${template.name}`}
                                                >
                                                    <Pencil
                                                        size={
                                                            16
                                                        }
                                                        strokeWidth={
                                                            1.8
                                                        }
                                                    />
                                                </Link>
                                            </td>

                                            {/* View */}

                                            <td className="px-4 py-4 text-center">
                                                <Link
                                                    href={`/head/templates/tasks/${template.id}`}
                                                    className="
                                                        mx-auto
                                                        flex
                                                        h-9
                                                        w-9
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        opacity-50
                                                        transition
                                                        hover:bg-(--navy-800)
                                                        hover:text-(--gold-500)
                                                        hover:opacity-100
                                                    "
                                                    aria-label={`View ${template.name}`}
                                                >
                                                    <Eye
                                                        size={
                                                            17
                                                        }
                                                        strokeWidth={
                                                            1.8
                                                        }
                                                    />
                                                </Link>
                                            </td>

                                            {/* Delete */}

                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            template
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId !==
                                                        null
                                                    }
                                                    className="
                                                        mx-auto
                                                        flex
                                                        h-9
                                                        w-9
                                                        items-center
                                                        justify-center
                                                        rounded-lg
                                                        opacity-50
                                                        transition
                                                        hover:bg-red-400/10
                                                        hover:text-red-400
                                                        hover:opacity-100
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-30
                                                    "
                                                    aria-label={`Delete ${template.name}`}
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                        strokeWidth={
                                                            1.8
                                                        }
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* =====================================================
                DELETE CONFIRMATION MODAL
            ====================================================== */}

            {deleteTarget && (
                <div
                    className="
                        fixed
                        inset-0
                        z-100
                        flex
                        items-end
                        justify-center
                        bg-black/60
                        px-3
                        py-3
                        sm:items-center
                        sm:px-4
                        sm:py-8
                    "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeDeleteModal();
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-md
                            overflow-hidden
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:rounded-2xl
                        "
                    >
                        {/* Modal Header */}

                        <div
                            className="
                                flex
                                items-start
                                justify-between
                                gap-3
                                p-4
                                sm:gap-4
                                sm:p-6
                            "
                        >
                            <div
                                className="
                                    flex
                                    min-w-0
                                    items-start
                                    gap-3
                                    sm:gap-4
                                "
                            >
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-red-400/10
                                        text-red-400
                                        sm:h-11
                                        sm:w-11
                                    "
                                >
                                    <AlertTriangle
                                        size={20}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-base font-semibold sm:text-lg">
                                        Delete Template
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 opacity-50 sm:text-sm">
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeDeleteModal
                                }
                                disabled={
                                    deletingId !==
                                    null
                                }
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
                                <X size={17} />
                            </button>
                        </div>

                        {/* Modal Body */}

                        <div
                            className="
                                border-t
                                border-(--border)
                                px-4
                                py-4
                                sm:px-6
                                sm:py-5
                            "
                        >
                            <p className="text-sm leading-6 opacity-70">
                                Are you sure you want to delete
                                <span className="mx-1 wrap-break-word font-semibold opacity-100">
                                    "{deleteTarget.name}"
                                </span>
                                ?
                            </p>

                            <p className="mt-3 text-xs leading-5 opacity-40">
                                The template, its categories,
                                and all tasks belonging to this
                                template will be permanently
                                deleted.
                            </p>
                        </div>

                        {/* Modal Actions */}

                        <div
                            className="
                                grid
                                grid-cols-2
                                gap-2
                                border-t
                                border-(--border)
                                p-4
                                sm:flex
                                sm:justify-end
                                sm:gap-3
                                sm:px-6
                                sm:py-4
                            "
                        >
                            <button
                                type="button"
                                onClick={
                                    closeDeleteModal
                                }
                                disabled={
                                    deletingId !==
                                    null
                                }
                                className="
                                    min-h-11
                                    rounded-xl
                                    border
                                    border-(--border)
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    opacity-70
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                    disabled:cursor-not-allowed
                                    disabled:opacity-30
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDelete
                                }
                                disabled={
                                    deletingId !==
                                    null
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
                                    active:bg-red-600
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                <Trash2
                                    size={16}
                                />

                                <span>
                                    {deletingId ===
                                    deleteTarget.id
                                        ? "Deleting..."
                                        : "Delete"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}