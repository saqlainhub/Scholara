"use client";

import Link from "next/link";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Pencil,
    Plus,
    Save,
    Trash2,
    ArrowLeft,
    X,
} from "lucide-react";

import { useRouter } from "next/navigation";

const TEMPLATE_NAME_MAX_LENGTH = 100;
const TITLE_MAX_LENGTH = 100;
const CATEGORY_MAX_LENGTH = 80;

type Teacher = {
    id: string;
    displayName?: string | null;
    name?: string | null;
    username: string;
};

type TaskItem = {
    id: string;
    title: string;
    description: string;
    deadline: string;
    difficulty: number;
    teacherId: string;
};

type TaskCategory = {
    id: string;
    name: string;
    tasks: TaskItem[];
};

function formatDeadline(time: string) {
    if (!time) {
        return "";
    }

    const [hours, minutes] = time
        .split(":")
        .map(Number);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {
        return "";
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

export default function CreateTaskTemplatePage() {
    const router = useRouter();

    // ==========================================================
    // TEMPLATE
    // ==========================================================

    const [
        templateName,
        setTemplateName,
    ] = useState("");

    const [
        categories,
        setCategories,
    ] = useState<TaskCategory[]>([]);

    // ==========================================================
    // TEACHERS
    // ==========================================================

    const [
        teachers,
        setTeachers,
    ] = useState<Teacher[]>([]);

    const [
        teachersLoading,
        setTeachersLoading,
    ] = useState(true);

    const [
        teacherError,
        setTeacherError,
    ] = useState("");

    // ==========================================================
    // CATEGORY MODAL
    // ==========================================================

    const [
        categoryModalOpen,
        setCategoryModalOpen,
    ] = useState(false);

    const [
        categoryName,
        setCategoryName,
    ] = useState("");

    const [
        editingCategoryId,
        setEditingCategoryId,
    ] = useState<string | null>(null);

    // ==========================================================
    // TASK MODAL
    // ==========================================================

    const [
        taskModalOpen,
        setTaskModalOpen,
    ] = useState(false);

    const [
        taskCategoryId,
        setTaskCategoryId,
    ] = useState<string | null>(null);

    const [
        editingTaskId,
        setEditingTaskId,
    ] = useState<string | null>(null);

    const [
        taskTitle,
        setTaskTitle,
    ] = useState("");

    const [
        taskDescription,
        setTaskDescription,
    ] = useState("");

    const [
        deadline,
        setDeadline,
    ] = useState("");

    const [
        difficulty,
        setDifficulty,
    ] = useState(1);

    const [
        teacherId,
        setTeacherId,
    ] = useState("");

    // ==========================================================
    // DELETE CONFIRMATION MODAL
    // ==========================================================

    const [
        deleteCategoryTarget,
        setDeleteCategoryTarget,
    ] = useState<TaskCategory | null>(null);

    const [
        deleteTaskTarget,
        setDeleteTaskTarget,
    ] = useState<{
        categoryId: string;
        task: TaskItem;
    } | null>(null);

    // ==========================================================
    // SAVE STATE
    // ==========================================================

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        saveMessage,
        setSaveMessage,
    ] = useState("");

    // ==========================================================
    // LOAD TEACHERS
    // ==========================================================

    useEffect(() => {
        async function loadTeachers() {
            try {
                setTeachersLoading(true);
                setTeacherError("");

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
                    setTeacherError(
                        data.message ||
                            "Failed to load teachers."
                    );

                    return;
                }

                const teacherList: Teacher[] =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(
                              data.teachers
                          )
                        ? data.teachers
                        : [];

                setTeachers(
                    teacherList
                );
            } catch (error) {
                console.error(
                    "LOAD TEACHERS ERROR:",
                    error
                );

                setTeacherError(
                    "Something went wrong while loading teachers."
                );
            } finally {
                setTeachersLoading(
                    false
                );
            }
        }

        loadTeachers();
    }, []);

    // ==========================================================
    // CATEGORY HELPERS
    // ==========================================================

    function resetCategoryForm() {
        setCategoryName("");
        setEditingCategoryId(null);
    }

    function openAddCategory() {
        resetCategoryForm();
        setCategoryModalOpen(true);
    }

    function openEditCategory(
        category: TaskCategory
    ) {
        setEditingCategoryId(
            category.id
        );

        setCategoryName(
            category.name
        );

        setCategoryModalOpen(true);
    }

    function closeCategoryModal() {
        setCategoryModalOpen(false);
        resetCategoryForm();
    }

    function saveCategory() {
        const cleanName =
            categoryName.trim();

        if (!cleanName) {
            return;
        }

        if (
            cleanName.length >
            CATEGORY_MAX_LENGTH
        ) {
            return;
        }

        if (editingCategoryId) {
            setCategories(
                (current) =>
                    current.map(
                        (category) =>
                            category.id ===
                            editingCategoryId
                                ? {
                                      ...category,
                                      name: cleanName,
                                  }
                                : category
                    )
            );
        } else {
            const newCategory: TaskCategory =
                {
                    id: crypto.randomUUID(),
                    name: cleanName,
                    tasks: [],
                };

            setCategories(
                (current) => [
                    ...current,
                    newCategory,
                ]
            );
        }

        closeCategoryModal();
    }

    // ==========================================================
    // CATEGORY DELETE
    // ==========================================================

    function openDeleteCategory(
        categoryId: string
    ) {
        const category =
            categories.find(
                (item) =>
                    item.id ===
                    categoryId
            );

        if (!category) {
            return;
        }

        setDeleteCategoryTarget(
            category
        );
    }

    function closeDeleteCategory() {
        setDeleteCategoryTarget(null);
    }

    function confirmDeleteCategory() {
        if (!deleteCategoryTarget) {
            return;
        }

        const categoryId =
            deleteCategoryTarget.id;

        setCategories(
            (current) =>
                current.filter(
                    (item) =>
                        item.id !==
                        categoryId
                )
        );

        setDeleteCategoryTarget(null);
    }

    // ==========================================================
    // TASK HELPERS
    // ==========================================================

    function resetTaskForm() {
        setTaskCategoryId(null);
        setEditingTaskId(null);

        setTaskTitle("");
        setTaskDescription("");
        setDeadline("");

        setDifficulty(1);
        setTeacherId("");
    }

    function openAddTask(
        categoryId: string
    ) {
        resetTaskForm();

        setTaskCategoryId(
            categoryId
        );

        setTaskModalOpen(true);
    }

    function openEditTask(
        categoryId: string,
        task: TaskItem
    ) {
        setTaskCategoryId(
            categoryId
        );

        setEditingTaskId(
            task.id
        );

        setTaskTitle(
            task.title
        );

        setTaskDescription(
            task.description
        );

        setDeadline(
            task.deadline
        );

        setDifficulty(
            task.difficulty
        );

        setTeacherId(
            task.teacherId
        );

        setTaskModalOpen(true);
    }

    function closeTaskModal() {
        setTaskModalOpen(false);
        resetTaskForm();
    }

    function saveTask() {
        const cleanTitle =
            taskTitle.trim();

        if (!cleanTitle) {
            return;
        }

        if (
            cleanTitle.length >
            TITLE_MAX_LENGTH
        ) {
            return;
        }

        if (!taskCategoryId) {
            return;
        }

        if (!deadline) {
            return;
        }

        if (
            difficulty < 1 ||
            difficulty > 5
        ) {
            return;
        }

        if (!teacherId) {
            setSaveMessage(
                "Please select a teacher for this task."
            );

            return;
        }

        setSaveMessage("");

        if (editingTaskId) {
            setCategories(
                (current) =>
                    current.map(
                        (category) => {
                            if (
                                category.id !==
                                taskCategoryId
                            ) {
                                return category;
                            }

                            return {
                                ...category,

                                tasks:
                                    category.tasks.map(
                                        (
                                            task
                                        ) =>
                                            task.id ===
                                            editingTaskId
                                                ? {
                                                      ...task,
                                                      title: cleanTitle,
                                                      description:
                                                          taskDescription.trim(),
                                                      deadline,
                                                      difficulty,
                                                      teacherId,
                                                  }
                                                : task
                                    ),
                            };
                        }
                    )
            );
        } else {
            const newTask: TaskItem =
                {
                    id: crypto.randomUUID(),
                    title: cleanTitle,
                    description:
                        taskDescription.trim(),
                    deadline,
                    difficulty,
                    teacherId,
                };

            setCategories(
                (current) =>
                    current.map(
                        (category) =>
                            category.id ===
                            taskCategoryId
                                ? {
                                      ...category,

                                      tasks: [
                                          ...category.tasks,
                                          newTask,
                                      ],
                                  }
                                : category
                    )
            );
        }

        closeTaskModal();
    }

    // ==========================================================
    // TASK DELETE
    // ==========================================================

    function openDeleteTask(
        categoryId: string,
        taskId: string
    ) {
        const category =
            categories.find(
                (item) =>
                    item.id ===
                    categoryId
            );

        if (!category) {
            return;
        }

        const task =
            category.tasks.find(
                (item) =>
                    item.id ===
                    taskId
            );

        if (!task) {
            return;
        }

        setDeleteTaskTarget({
            categoryId,
            task,
        });
    }

    function closeDeleteTask() {
        setDeleteTaskTarget(null);
    }

    function confirmDeleteTask() {
        if (!deleteTaskTarget) {
            return;
        }

        const {
            categoryId,
            task,
        } = deleteTaskTarget;

        setCategories(
            (current) =>
                current.map(
                    (category) =>
                        category.id ===
                        categoryId
                            ? {
                                  ...category,

                                  tasks:
                                      category.tasks.filter(
                                          (
                                              currentTask
                                          ) =>
                                              currentTask.id !==
                                              task.id
                                      ),
                              }
                            : category
                )
        );

        setDeleteTaskTarget(null);
    }

    // ==========================================================
    // TOTAL TASK COUNT
    // ==========================================================

    const totalTasks =
        useMemo(
            () =>
                categories.reduce(
                    (
                        total,
                        category
                    ) =>
                        total +
                        category.tasks
                            .length,
                    0
                ),
            [categories]
        );

    // ==========================================================
    // TEACHER NAME
    // ==========================================================

    function getTeacherName(
        id: string
    ) {
        const teacher =
            teachers.find(
                (item) =>
                    item.id === id
            );

        if (!teacher) {
            return "Teacher";
        }

        return (
            teacher.displayName ||
            teacher.name ||
            teacher.username
        );
    }

    // ==========================================================
    // TEMPLATE SAVE
    // ==========================================================

    async function handleSaveTemplate() {
        const cleanName =
            templateName.trim();

        if (!cleanName) {
            setSaveMessage(
                "Please enter a template name."
            );

            return;
        }

        if (
            cleanName.length >
            TEMPLATE_NAME_MAX_LENGTH
        ) {
            setSaveMessage(
                `Template name cannot exceed ${TEMPLATE_NAME_MAX_LENGTH} characters.`
            );

            return;
        }

        if (
            categories.length ===
            0
        ) {
            setSaveMessage(
                "Please add at least one category."
            );

            return;
        }

        if (
            totalTasks === 0
        ) {
            setSaveMessage(
                "Please add at least one task."
            );

            return;
        }

        for (const category of categories) {
            if (
                category.tasks.length ===
                0
            ) {
                setSaveMessage(
                    `Category "${category.name}" does not contain any tasks.`
                );

                return;
            }

            for (const task of category.tasks) {
                if (!task.teacherId) {
                    setSaveMessage(
                        `Please assign a teacher to "${task.title}".`
                    );

                    return;
                }
            }
        }

        try {
            setSaving(true);
            setSaveMessage("");

            const response =
                await fetch(
                    "/api/head/templates/tasks",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify(
                            {
                                name:
                                    cleanName,

                                categories:
                                    categories.map(
                                        (
                                            category
                                        ) => ({
                                            name:
                                                category.name,

                                            tasks:
                                                category.tasks.map(
                                                    (
                                                        task
                                                    ) => ({
                                                        title:
                                                            task.title,

                                                        description:
                                                            task.description,

                                                        deadline:
                                                            task.deadline,

                                                        difficulty:
                                                            task.difficulty,

                                                        teacherId:
                                                            task.teacherId,
                                                    })
                                                ),
                                        })
                                    ),
                            }
                        ),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setSaveMessage(
                    data.message ||
                        "Failed to save task template."
                );

                return;
            }

            router.push(
                "/head/templates/tasks"
            );

            router.refresh();
        } catch (error) {
            console.error(
                "SAVE TASK TEMPLATE ERROR:",
                error
            );

            setSaveMessage(
                "Something went wrong while saving the template."
            );
        } finally {
            setSaving(false);
        }
    }

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div className="min-w-0 space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">

            {/* =====================================================
                BACK
            ====================================================== */}

            <Link
                href="/head/templates/tasks"
                className="
                    inline-flex
                    min-h-10
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-(--border)
                    px-3
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

                <span>Back to Templates</span>
            </Link>

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-5
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                    sm:gap-6
                "
            >
                <div className="min-w-0">
                    <h1
                        className="
                            text-2xl
                            font-semibold
                            tracking-wide
                            sm:text-3xl
                            sm:tracking-wider
                        "
                    >
                        Create Task Template
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
                        Create a task template using
                        categories and scheduled tasks.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        handleSaveTemplate
                    }
                    disabled={saving}
                    className="
                        inline-flex
                        min-h-11
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-(--gold-500)
                        px-5
                        py-3
                        text-sm
                        font-semibold
                        text-(--navy-900)
                        transition
                        hover:opacity-90
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        sm:w-auto
                    "
                >
                    <Save
                        size={17}
                        strokeWidth={2}
                    />

                    <span>
                        {saving
                            ? "Saving..."
                            : "Save Task Template"}
                    </span>
                </button>
            </div>

            {/* =====================================================
                SAVE MESSAGE
            ====================================================== */}

            {saveMessage && (
                <div
                    className="
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-4
                        py-3
                        text-sm
                        leading-6
                        opacity-70
                    "
                >
                    {saveMessage}
                </div>
            )}

            {/* =====================================================
                TEACHER ERROR
            ====================================================== */}

            {teacherError && (
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
                    {teacherError}
                </div>
            )}

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
                        flex-col
                        gap-2
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        sm:gap-4
                    "
                >
                    <label
                        htmlFor="template-name"
                        className="text-sm font-medium"
                    >
                        Template Name
                    </label>

                    <span className="text-xs opacity-40">
                        {templateName.length} /{" "}
                        {TEMPLATE_NAME_MAX_LENGTH}
                    </span>
                </div>

                <input
                    id="template-name"
                    type="text"
                    value={
                        templateName
                    }
                    onChange={(
                        event
                    ) =>
                        setTemplateName(
                            event.target
                                .value
                                .slice(
                                    0,
                                    TEMPLATE_NAME_MAX_LENGTH
                                )
                        )
                    }
                    placeholder="e.g. Regular School Day"
                    className="
                        mt-3
                        min-h-11
                        w-full
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-800)
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-(--gold-500)
                    "
                />
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
                        <h2 className="text-lg font-semibold">
                            Categories
                        </h2>

                        <p className="mt-1 text-xs leading-5 opacity-50">
                            Categories belong only to this
                            task template.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            openAddCategory
                        }
                        className="
                            inline-flex
                            min-h-10
                            w-full
                            items-center
                            justify-center
                            gap-2
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
                            sm:w-auto
                        "
                    >
                        <Plus
                            size={16}
                        />

                        <span>
                            Add Category
                        </span>
                    </button>
                </div>

                {/* EMPTY CATEGORIES */}

                {categories.length === 0 && (
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
                            No categories added yet.
                        </p>

                        <button
                            type="button"
                            onClick={
                                openAddCategory
                            }
                            className="
                                mt-4
                                min-h-10
                                rounded-xl
                                border
                                border-(--gold-500)
                                px-4
                                py-2
                                text-sm
                                text-(--gold-500)
                                transition
                                hover:bg-(--gold-500)
                                hover:text-black
                            "
                        >
                            Add Category
                        </button>
                    </div>
                )}

                {/* CATEGORY LIST */}

                <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
                    {categories.map(
                        (
                            category
                        ) => (
                            <div
                                key={
                                    category.id
                                }
                                className="
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
                                        items-start
                                        justify-between
                                        gap-3
                                        border-b
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-4
                                        sm:items-center
                                        sm:px-5
                                    "
                                >
                                    <div className="min-w-0 flex-1">
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

                                    <div className="flex shrink-0 items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditCategory(
                                                    category
                                                )
                                            }
                                            className="
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-lg
                                                opacity-50
                                                transition
                                                hover:bg-(--navy-900)
                                                hover:text-(--gold-500)
                                                hover:opacity-100
                                            "
                                            aria-label={`Edit ${category.name}`}
                                        >
                                            <Pencil
                                                size={15}
                                            />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openDeleteCategory(
                                                    category.id
                                                )
                                            }
                                            className="
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-lg
                                                opacity-50
                                                transition
                                                hover:bg-(--navy-900)
                                                hover:text-red-400
                                                hover:opacity-100
                                            "
                                            aria-label={`Delete ${category.name}`}
                                        >
                                            <Trash2
                                                size={15}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* TASKS */}

                                <div className="p-4 sm:p-5">
                                    {category.tasks.length === 0 && (
                                        <p className="py-4 text-center text-sm opacity-40">
                                            No tasks in this category.
                                        </p>
                                    )}

                                    {category.tasks.length > 0 && (
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
                                                            rounded-xl
                                                            border
                                                            border-(--border)
                                                            p-4
                                                            sm:px-4
                                                            sm:py-4
                                                        "
                                                    >
                                                        <div
                                                            className="
                                                                flex
                                                                flex-col
                                                                gap-4
                                                                sm:flex-row
                                                                sm:items-start
                                                                sm:justify-between
                                                            "
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                {/* TASK TITLE + TAGS */}

                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <p className="min-w-0 break-words font-medium">
                                                                        {
                                                                            task.title
                                                                        }
                                                                    </p>

                                                                    {/* DEADLINE TAG */}

                                                                    <span
                                                                        className="
                                                                            shrink-0
                                                                            rounded-md
                                                                            border
                                                                            border-(--gold-500)/30
                                                                            bg-(--gold-500)/10
                                                                            px-2
                                                                            py-0.5
                                                                            text-[11px]
                                                                            font-medium
                                                                            text-(--gold-500)
                                                                        "
                                                                    >
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
                                                                            py-0.5
                                                                            text-[11px]
                                                                            font-medium
                                                                            opacity-70
                                                                        "
                                                                    >
                                                                        {task.difficulty}x
                                                                    </span>
                                                                </div>

                                                                {/* DESCRIPTION */}

                                                                {task.description && (
                                                                    <p className="mt-2 wrap-break-word text-sm leading-5 opacity-50 sm:truncate">
                                                                        {
                                                                            task.description
                                                                        }
                                                                    </p>
                                                                )}

                                                                {/* TEACHER */}

                                                                <p className="mt-3 wrap-break-word text-xs leading-5 opacity-50">
                                                                    Teacher:{" "}
                                                                    {getTeacherName(
                                                                        task.teacherId
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {/* TASK ACTIONS */}

                                                            <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openEditTask(
                                                                            category.id,
                                                                            task
                                                                        )
                                                                    }
                                                                    className="
                                                                        flex
                                                                        h-10
                                                                        w-10
                                                                        items-center
                                                                        justify-center
                                                                        rounded-lg
                                                                        opacity-50
                                                                        transition
                                                                        hover:bg-(--navy-800)
                                                                        hover:text-(--gold-500)
                                                                        hover:opacity-100
                                                                    "
                                                                    aria-label={`Edit ${task.title}`}
                                                                >
                                                                    <Pencil
                                                                        size={15}
                                                                    />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openDeleteTask(
                                                                            category.id,
                                                                            task.id
                                                                        )
                                                                    }
                                                                    className="
                                                                        flex
                                                                        h-10
                                                                        w-10
                                                                        items-center
                                                                        justify-center
                                                                        rounded-lg
                                                                        opacity-50
                                                                        transition
                                                                        hover:bg-(--navy-800)
                                                                        hover:text-red-400
                                                                        hover:opacity-100
                                                                    "
                                                                    aria-label={`Delete ${task.title}`}
                                                                >
                                                                    <Trash2
                                                                        size={15}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openAddTask(
                                                category.id
                                            )
                                        }
                                        className="
                                            mt-4
                                            inline-flex
                                            min-h-11
                                            w-full
                                            items-center
                                            justify-center
                                            gap-2
                                            rounded-xl
                                            border
                                            border-dashed
                                            border-(--border)
                                            px-4
                                            py-3
                                            text-sm
                                            opacity-60
                                            transition
                                            hover:border-(--gold-500)
                                            hover:text-(--gold-500)
                                            hover:opacity-100
                                        "
                                    >
                                        <Plus
                                            size={16}
                                        />

                                        <span>
                                            Add Task
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </section>

            {/* =====================================================
                CATEGORY MODAL
            ====================================================== */}

            {categoryModalOpen && (
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
                        px-0
                        py-0
                        backdrop-blur-sm
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
                            closeCategoryModal();
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-md
                            overflow-hidden
                            rounded-t-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:rounded-2xl
                        "
                    >
                        <div className="flex items-center justify-between gap-4 border-b border-(--border) px-4 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold">
                                    {editingCategoryId
                                        ? "Edit Category"
                                        : "Add Category"}
                                </h2>

                                <p className="mt-1 text-xs leading-5 opacity-50">
                                    {editingCategoryId
                                        ? "Update this category."
                                        : "Create a category for this template."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeCategoryModal
                                }
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    opacity-50
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                "
                            >
                                <X
                                    size={17}
                                />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            <label
                                htmlFor="category-name"
                                className="text-sm font-medium"
                            >
                                Category Name
                            </label>

                            <input
                                id="category-name"
                                type="text"
                                value={
                                    categoryName
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryName(
                                        event.target.value.slice(
                                            0,
                                            CATEGORY_MAX_LENGTH
                                        )
                                    )
                                }
                                onKeyDown={(
                                    event
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        saveCategory();
                                    }
                                }}
                                placeholder="e.g. Mathematics"
                                autoFocus
                                className="
                                    mt-2
                                    min-h-11
                                    w-full
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-800)
                                    px-4
                                    py-3
                                    text-sm
                                    outline-none
                                    focus:border-(--gold-500)
                                "
                            />

                            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeCategoryModal
                                    }
                                    className="
                                        min-h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-(--border)
                                        px-4
                                        py-2.5
                                        text-sm
                                        opacity-70
                                        transition
                                        hover:opacity-100
                                        sm:w-auto
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        saveCategory
                                    }
                                    className="
                                        min-h-11
                                        w-full
                                        rounded-xl
                                        bg-(--gold-500)
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-(--navy-900)
                                        transition
                                        hover:opacity-90
                                        sm:w-auto
                                    "
                                >
                                    {editingCategoryId
                                        ? "Update Category"
                                        : "Add Category"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                TASK MODAL
            ====================================================== */}

            {taskModalOpen && (
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
                        px-0
                        py-0
                        backdrop-blur-sm
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
                            closeTaskModal();
                        }
                    }}
                >
                    <div
                        className="
                            max-h-[95vh]
                            w-full
                            max-w-xl
                            overflow-y-auto
                            rounded-t-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:max-h-[90vh]
                            sm:rounded-2xl
                        "
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-(--border) bg-(--navy-900) px-4 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold">
                                    {editingTaskId
                                        ? "Edit Task"
                                        : "Add Task"}
                                </h2>

                                <p className="mt-1 text-xs leading-5 opacity-50">
                                    {editingTaskId
                                        ? "Update this task."
                                        : "Create a task inside this category."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeTaskModal
                                }
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    opacity-50
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                "
                            >
                                <X
                                    size={17}
                                />
                            </button>
                        </div>

                        <div className="space-y-5 p-4 sm:p-6">
                            {/* TITLE */}

                            <div>
                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-1
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >
                                    <label
                                        htmlFor="task-title"
                                        className="text-sm font-medium"
                                    >
                                        Task Title
                                    </label>

                                    <span className="text-xs opacity-40">
                                        {
                                            taskTitle.length
                                        }{" "}
                                        /{" "}
                                        {
                                            TITLE_MAX_LENGTH
                                        }
                                    </span>
                                </div>

                                <input
                                    id="task-title"
                                    type="text"
                                    value={
                                        taskTitle
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setTaskTitle(
                                            event.target.value.slice(
                                                0,
                                                TITLE_MAX_LENGTH
                                            )
                                        )
                                    }
                                    placeholder="e.g. Complete exercise 5"
                                    autoFocus
                                    className="
                                        mt-2
                                        min-h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-3
                                        text-sm
                                        outline-none
                                        focus:border-(--gold-500)
                                    "
                                />
                            </div>

                            {/* DESCRIPTION */}

                            <div>
                                <label
                                    htmlFor="task-description"
                                    className="text-sm font-medium"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="task-description"
                                    value={
                                        taskDescription
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setTaskDescription(
                                            event.target.value
                                        )
                                    }
                                    rows={4}
                                    placeholder="Optional task description..."
                                    className="
                                        mt-2
                                        min-h-28
                                        w-full
                                        resize-none
                                        rounded-xl
                                        border
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-3
                                        text-sm
                                        leading-6
                                        outline-none
                                        focus:border-(--gold-500)
                                    "
                                />
                            </div>

                            {/* DEADLINE */}

                            <div>
                                <label
                                    htmlFor="task-deadline"
                                    className="text-sm font-medium"
                                >
                                    Deadline
                                </label>

                                <input
                                    id="task-deadline"
                                    type="time"
                                    value={
                                        deadline
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDeadline(
                                            event.target.value
                                        )
                                    }
                                    className="
                                        mt-2
                                        min-h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-3
                                        text-sm
                                        outline-none
                                        focus:border-(--gold-500)
                                    "
                                />
                            </div>

                            {/* DIFFICULTY */}

                            <div>
                                <label
                                    htmlFor="task-difficulty"
                                    className="text-sm font-medium"
                                >
                                    Difficulty
                                </label>

                                <select
                                    id="task-difficulty"
                                    value={
                                        difficulty
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setDifficulty(
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            )
                                        )
                                    }
                                    className="
                                        mt-2
                                        min-h-11
                                        w-full
                                        appearance-none
                                        rounded-xl
                                        border
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-3
                                        text-sm
                                        outline-none
                                        focus:border-(--gold-500)
                                    "
                                >
                                    <option value={1}>
                                        1x — Very Easy
                                    </option>

                                    <option value={2}>
                                        2x — Easy
                                    </option>

                                    <option value={3}>
                                        3x — Moderate
                                    </option>

                                    <option value={4}>
                                        4x — Difficult
                                    </option>

                                    <option value={5}>
                                        5x — Very Difficult
                                    </option>
                                </select>
                            </div>

                            {/* TEACHER */}

                            <div>
                                <label
                                    htmlFor="task-teacher"
                                    className="text-sm font-medium"
                                >
                                    Teacher
                                </label>

                                <div className="relative">
                                    <select
                                        id="task-teacher"
                                        value={
                                            teacherId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setTeacherId(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            teachersLoading
                                        }
                                        className="
                                            mt-2
                                            min-h-11
                                            w-full
                                            appearance-none
                                            rounded-xl
                                            border
                                            border-(--border)
                                            bg-(--navy-800)
                                            px-4
                                            py-3
                                            pr-10
                                            text-sm
                                            outline-none
                                            focus:border-(--gold-500)
                                            disabled:cursor-not-allowed
                                            disabled:opacity-50
                                        "
                                    >
                                        <option value="">
                                            {teachersLoading
                                                ? "Loading teachers..."
                                                : "Select Teacher"}
                                        </option>

                                        {teachers.map(
                                            (
                                                teacher
                                            ) => (
                                                <option
                                                    key={
                                                        teacher.id
                                                    }
                                                    value={
                                                        teacher.id
                                                    }
                                                >
                                                    {teacher.displayName ||
                                                    teacher.name
                                                        ? `${teacher.displayName || teacher.name} (${teacher.username})`
                                                        : teacher.username}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <div
                                        className="
                                            pointer-events-none
                                            absolute
                                            right-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-sm
                                            opacity-50
                                        "
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m19 9-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {!teachersLoading &&
                                    teachers.length ===
                                        0 && (
                                        <p className="mt-2 text-xs leading-5 text-red-300">
                                            No active teachers are available.
                                        </p>
                                    )}
                            </div>

                            {/* ACTIONS */}

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeTaskModal
                                    }
                                    className="
                                        min-h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-(--border)
                                        px-4
                                        py-2.5
                                        text-sm
                                        opacity-70
                                        transition
                                        hover:opacity-100
                                        sm:w-auto
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        saveTask
                                    }
                                    className="
                                        min-h-11
                                        w-full
                                        rounded-xl
                                        bg-(--gold-500)
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-(--navy-900)
                                        transition
                                        hover:opacity-90
                                        sm:w-auto
                                    "
                                >
                                    {editingTaskId
                                        ? "Update Task"
                                        : "Add Task"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                DELETE CATEGORY CONFIRMATION MODAL
            ====================================================== */}

            {deleteCategoryTarget && (
                <div
                    className="
                        fixed
                        inset-0
                        z-110
                        flex
                        items-end
                        justify-center
                        bg-black/60
                        px-0
                        backdrop-blur-sm
                        sm:items-center
                        sm:px-4
                    "
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeDeleteCategory();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-category-title"
                        className="
                            w-full
                            max-w-md
                            overflow-hidden
                            rounded-t-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:rounded-2xl
                        "
                    >
                        <div className="p-5 sm:p-6">
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-red-500/10
                                    text-red-400
                                "
                            >
                                <Trash2
                                    size={20}
                                    strokeWidth={2}
                                />
                            </div>

                            <h2
                                id="delete-category-title"
                                className="
                                    mt-5
                                    text-lg
                                    font-semibold
                                "
                            >
                                Delete Category?
                            </h2>

                            <p
                                className="
                                    mt-2
                                    text-sm
                                    leading-6
                                    opacity-60
                                "
                            >
                                This action cannot be
                                undone. The category{" "}
                                <span className="font-medium text-white opacity-100 break-words">
                                    "{deleteCategoryTarget.name}"
                                </span>{" "}
                                and all{" "}
                                <span className="font-medium text-white opacity-100">
                                    {
                                        deleteCategoryTarget
                                            .tasks
                                            .length
                                    }
                                </span>{" "}
                                task
                                {deleteCategoryTarget.tasks
                                    .length === 1
                                    ? ""
                                    : "s"}{" "}
                                inside it will be
                                permanently deleted.
                            </p>
                        </div>

                        <div
                            className="
                                flex
                                flex-col-reverse
                                gap-3
                                border-t
                                border-(--border)
                                px-5
                                py-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-end
                                sm:px-6
                            "
                        >
                            <button
                                type="button"
                                onClick={
                                    closeDeleteCategory
                                }
                                className="
                                    min-h-11
                                    w-full
                                    rounded-xl
                                    border
                                    border-(--border)
                                    px-4
                                    py-2.5
                                    text-sm
                                    transition
                                    hover:bg-(--navy-800)
                                    sm:w-auto
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    confirmDeleteCategory
                                }
                                className="
                                    inline-flex
                                    min-h-11
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-red-500
                                    px-5
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-red-600
                                    sm:w-auto
                                "
                            >
                                <Trash2
                                    size={16}
                                    strokeWidth={2}
                                />

                                Delete Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                DELETE TASK CONFIRMATION MODAL
            ====================================================== */}

            {deleteTaskTarget && (
                <div
                    className="
                        fixed
                        inset-0
                        z-110
                        flex
                        items-end
                        justify-center
                        bg-black/60
                        px-0
                        backdrop-blur-sm
                        sm:items-center
                        sm:px-4
                    "
                    onMouseDown={(
                        event
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeDeleteTask();
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-task-title"
                        className="
                            w-full
                            max-w-md
                            overflow-hidden
                            rounded-t-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:rounded-2xl
                        "
                    >
                        <div className="p-5 sm:p-6">
                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-red-500/10
                                    text-red-400
                                "
                            >
                                <Trash2
                                    size={20}
                                    strokeWidth={2}
                                />
                            </div>

                            <h2
                                id="delete-task-title"
                                className="
                                    mt-5
                                    text-lg
                                    font-semibold
                                "
                            >
                                Delete Task?
                            </h2>

                            <p
                                className="
                                    mt-2
                                    text-sm
                                    leading-6
                                    opacity-60
                                "
                            >
                                Are you sure you want to
                                permanently delete{" "}
                                <span className="font-medium text-white opacity-100 break-words">
                                    "{deleteTaskTarget.task.title}"
                                </span>
                                ? This action cannot be
                                undone.
                            </p>
                        </div>

                        <div
                            className="
                                flex
                                flex-col-reverse
                                gap-3
                                border-t
                                border-(--border)
                                px-5
                                py-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-end
                                sm:px-6
                            "
                        >
                            <button
                                type="button"
                                onClick={
                                    closeDeleteTask
                                }
                                className="
                                    min-h-11
                                    w-full
                                    rounded-xl
                                    border
                                    border-(--border)
                                    px-4
                                    py-2.5
                                    text-sm
                                    transition
                                    hover:bg-(--navy-800)
                                    sm:w-auto
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    confirmDeleteTask
                                }
                                className="
                                    inline-flex
                                    min-h-11
                                    w-full
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    bg-red-500
                                    px-5
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-red-600
                                    sm:w-auto
                                "
                            >
                                <Trash2
                                    size={16}
                                    strokeWidth={2}
                                />

                                Delete Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}