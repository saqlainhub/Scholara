"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeft,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

import {
    useParams,
    useRouter,
} from "next/navigation";

const TEMPLATE_NAME_MAX_LENGTH = 100;
const TITLE_MAX_LENGTH = 100;
const CATEGORY_MAX_LENGTH = 80;

type Teacher = {
    id: string;
    name: string;
    username: string;
};

type TaskItem = {
    id: string;
    title: string;
    description: string;
    deadline: string;
    difficulty: number;
    teacherId: string;
    teacher?: Teacher;
};

type TaskCategory = {
    id: string;
    name: string;
    sortOrder?: number;
    tasks: TaskItem[];
};

type TaskTemplate = {
    id: string;
    name: string;
    categories: TaskCategory[];
};

type DeleteTarget =
    | {
          type: "category";
          categoryId: string;
          name: string;
          taskCount: number;
      }
    | {
          type: "task";
          categoryId: string;
          taskId: string;
          name: string;
      }
    | null;

function formatDeadline(time: string) {
    if (!time) {
        return "";
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
        return "";
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

export default function EditTaskTemplatePage() {
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

    const [
        teachers,
        setTeachers,
    ] = useState<Teacher[]>([]);

    // ==========================================================
    // PAGE STATE
    // ==========================================================

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        saveMessage,
        setSaveMessage,
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
    ] = useState<string | null>(
        null
    );

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
    ] = useState<string | null>(
        null
    );

    const [
        editingTaskId,
        setEditingTaskId,
    ] = useState<string | null>(
        null
    );

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
        deleteTarget,
        setDeleteTarget,
    ] = useState<DeleteTarget>(
        null
    );

    const deleteModalOpen =
        deleteTarget !== null;

    // ==========================================================
    // LOAD TEMPLATE + TEACHERS
    // ==========================================================

    useEffect(() => {
        if (!templateId) {
            setError(
                "Template ID is missing."
            );

            setLoading(false);

            return;
        }

        async function loadData() {
            try {
                setLoading(true);
                setError("");

                const [
                    templateResponse,
                    teachersResponse,
                ] = await Promise.all([
                    fetch(
                        `/api/head/templates/tasks/${templateId}`,
                        {
                            cache: "no-store",
                        }
                    ),

                    fetch(
                        "/api/head/teachers",
                        {
                            cache: "no-store",
                        }
                    ),
                ]);

                const templateData =
                    await templateResponse.json();

                const teachersData =
                    await teachersResponse.json();

                if (
                    !templateResponse.ok
                ) {
                    setError(
                        templateData.message ||
                            "Failed to load task template."
                    );

                    return;
                }

                if (
                    !teachersResponse.ok
                ) {
                    setError(
                        teachersData.message ||
                            "Failed to load teachers."
                    );

                    return;
                }

                const loadedTemplate =
                    templateData.template as TaskTemplate;

                if (!loadedTemplate) {
                    setError(
                        "Task template not found."
                    );

                    return;
                }

                setTemplateName(
                    loadedTemplate.name
                );

                setCategories(
                    loadedTemplate.categories.map(
                        (category) => ({
                            id: category.id,
                            name: category.name,
                            sortOrder:
                                category.sortOrder,

                            tasks:
                                category.tasks.map(
                                    (task) => ({
                                        id: task.id,
                                        title: task.title,
                                        description:
                                            task.description ||
                                            "",
                                        deadline:
                                            task.deadline ||
                                            "",
                                        difficulty:
                                            task.difficulty,
                                        teacherId:
                                            task.teacher?.id ||
                                            task.teacherId ||
                                            "",
                                        teacher:
                                            task.teacher,
                                    })
                                ),
                        })
                    )
                );

                setTeachers(
                    Array.isArray(
                        teachersData
                    )
                        ? teachersData
                        : teachersData.teachers ||
                              []
                );
            } catch (error) {
                console.error(
                    "LOAD EDIT TASK TEMPLATE ERROR:",
                    error
                );

                setError(
                    "Something went wrong while loading the template."
                );
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [templateId]);

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
            setCategories(
                (current) => [
                    ...current,
                    {
                        id: crypto.randomUUID(),
                        name: cleanName,
                        tasks: [],
                    },
                ]
            );
        }

        closeCategoryModal();
    }

    // ==========================================================
    // OPEN DELETE CATEGORY CONFIRMATION
    // ==========================================================

    function requestDeleteCategory(
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

        setDeleteTarget({
            type: "category",
            categoryId:
                category.id,
            name: category.name,
            taskCount:
                category.tasks.length,
        });
    }

    // ==========================================================
    // OPEN DELETE TASK CONFIRMATION
    // ==========================================================

    function requestDeleteTask(
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
                    item.id === taskId
            );

        if (!task) {
            return;
        }

        setDeleteTarget({
            type: "task",
            categoryId,
            taskId,
            name: task.title,
        });
    }

    // ==========================================================
    // CONFIRM DELETE
    // ==========================================================

    function confirmDelete() {
        if (!deleteTarget) {
            return;
        }

        if (
            deleteTarget.type ===
            "category"
        ) {
            setCategories(
                (current) =>
                    current.filter(
                        (category) =>
                            category.id !==
                            deleteTarget.categoryId
                    )
            );
        }

        if (
            deleteTarget.type ===
            "task"
        ) {
            setCategories(
                (current) =>
                    current.map(
                        (category) =>
                            category.id ===
                            deleteTarget.categoryId
                                ? {
                                      ...category,

                                      tasks:
                                          category.tasks.filter(
                                              (
                                                  task
                                              ) =>
                                                  task.id !==
                                                  deleteTarget.taskId
                                          ),
                                  }
                                : category
                    )
            );
        }

        setDeleteTarget(null);
    }

    function closeDeleteModal() {
        setDeleteTarget(null);
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

        if (!teacherId) {
            return;
        }

        if (
            difficulty < 1 ||
            difficulty > 5
        ) {
            return;
        }

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
    // TOTAL TASKS
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
        task: TaskItem
    ) {
        const teacher =
            teachers.find(
                (item) =>
                    item.id ===
                    task.teacherId
            );

        return (
            teacher?.name ||
            teacher?.username ||
            task.teacher?.name ||
            task.teacher?.username ||
            "Unknown"
        );
    }

    // ==========================================================
    // SAVE TEMPLATE
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

        const invalidTask =
            categories.some(
                (category) =>
                    category.tasks.some(
                        (task) =>
                            !task.title.trim() ||
                            !task.teacherId ||
                            !task.deadline ||
                            task.difficulty <
                                1 ||
                            task.difficulty >
                                5
                    )
            );

        if (invalidTask) {
            setSaveMessage(
                "Every task must have a title, teacher, deadline, and difficulty from 1 to 5."
            );

            return;
        }

        try {
            setSaving(true);
            setSaveMessage("");

            const response =
                await fetch(
                    `/api/head/templates/tasks/${templateId}`,
                    {
                        method: "PUT",

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
                        "Failed to update task template."
                );

                return;
            }

            router.push(
                `/head/templates/tasks/${templateId}`
            );
        } catch (error) {
            console.error(
                "UPDATE TASK TEMPLATE ERROR:",
                error
            );

            setSaveMessage(
                "Something went wrong while updating the template."
            );
        } finally {
            setSaving(false);
        }
    }

    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div className="min-h-full px-4 py-5 sm:space-y-8 sm:p-8">
                <p className="text-sm opacity-50">
                    Loading task template...
                </p>
            </div>
        );
    }

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <div className="space-y-5 px-4 py-5 sm:space-y-8 sm:p-8">

            {/* =====================================================
                BACK BUTTON
            ====================================================== */}

            <button
                type="button"
                onClick={() =>
                    router.push(
                        `/head/templates/tasks/${templateId}`
                    )
                }
                className="
                    inline-flex
                    h-10
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

                <span>Back to Template</span>
            </button>

            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                    sm:gap-6
                "
            >
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-wider sm:text-3xl">
                        Edit Task Template
                    </h1>

                    <p className="mt-1 text-sm leading-5 opacity-60">
                        Edit categories and
                        scheduled tasks in
                        this template.
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
                        sm:shrink-0
                    "
                >
                    <Save
                        size={17}
                        strokeWidth={2}
                    />

                    <span>
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </span>
                </button>
            </div>

            {/* =====================================================
                ERROR / SAVE MESSAGE
            ====================================================== */}

            {(error ||
                saveMessage) && (
                <div
                    className={`
                        rounded-xl
                        border
                        px-4
                        py-3
                        text-sm
                        leading-5
                        ${
                            error
                                ? "border-red-400/30 bg-red-400/5 text-red-300"
                                : "border-(--border) bg-(--navy-900) opacity-80"
                        }
                    `}
                >
                    {error ||
                        saveMessage}
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
                        items-start
                        justify-between
                        gap-3
                    "
                >
                    <label
                        htmlFor="template-name"
                        className="text-sm font-medium"
                    >
                        Template Name
                    </label>

                    <span className="shrink-0 text-right text-xs opacity-40">
                        {
                            templateName.length
                        }{" "}
                        /{" "}
                        {
                            TEMPLATE_NAME_MAX_LENGTH
                        }
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
                            event.target.value.slice(
                                0,
                                TEMPLATE_NAME_MAX_LENGTH
                            )
                        )
                    }
                    className="
                        mt-3
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
                        sm:gap-4
                    "
                >
                    <div>
                        <h2 className="text-lg font-semibold">
                            Categories
                        </h2>

                        <p className="mt-1 text-xs opacity-50">
                            {
                                categories.length
                            }{" "}
                            {categories.length ===
                            1
                                ? "category"
                                : "categories"}{" "}
                            ·{" "}
                            {totalTasks}{" "}
                            {totalTasks ===
                            1
                                ? "task"
                                : "tasks"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            openAddCategory
                        }
                        className="
                            inline-flex
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

                        Add Category
                    </button>
                </div>

                {/* EMPTY CATEGORIES */}

                {categories.length ===
                    0 && (
                    <div
                        className="
                            mt-6
                            rounded-xl
                            border
                            border-dashed
                            border-(--border)
                            px-4
                            py-10
                            text-center
                            sm:px-6
                            sm:py-12
                        "
                    >
                        <p className="text-sm opacity-50">
                            No categories added
                            yet.
                        </p>

                        <button
                            type="button"
                            onClick={
                                openAddCategory
                            }
                            className="
                                mt-4
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

                                    <div className="flex shrink-0 items-center gap-1">

                                        {/* EDIT CATEGORY */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                openEditCategory(
                                                    category
                                                )
                                            }
                                            className="
                                                flex
                                                h-9
                                                w-9
                                                items-center
                                                justify-center
                                                rounded-lg
                                                opacity-60
                                                transition
                                                hover:bg-(--navy-900)
                                                hover:text-(--gold-500)
                                                hover:opacity-100
                                            "
                                            aria-label={`Edit ${category.name}`}
                                        >
                                            <Pencil
                                                size={
                                                    15
                                                }
                                            />
                                        </button>

                                        {/* DELETE CATEGORY */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                requestDeleteCategory(
                                                    category.id
                                                )
                                            }
                                            className="
                                                flex
                                                h-9
                                                w-9
                                                items-center
                                                justify-center
                                                rounded-lg
                                                opacity-60
                                                transition
                                                hover:bg-(--navy-900)
                                                hover:text-red-400
                                                hover:opacity-100
                                            "
                                            aria-label={`Delete ${category.name}`}
                                        >
                                            <Trash2
                                                size={
                                                    15
                                                }
                                            />
                                        </button>

                                    </div>
                                </div>

                                {/* TASKS */}

                                <div className="p-3.5 sm:p-5">

                                    {category.tasks.length ===
                                        0 && (
                                        <p className="py-4 text-center text-sm opacity-40">
                                            No tasks in
                                            this
                                            category.
                                        </p>
                                    )}

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
                                                            rounded-xl
                                                            border
                                                            border-(--border)
                                                            px-3.5
                                                            py-3.5
                                                            sm:px-4
                                                            sm:py-4
                                                        "
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">

                                                            <div className="min-w-0">

                                                                {/* TITLE + TAGS */}

                                                                <div className="flex flex-wrap items-center gap-2">

                                                                    <p className="min-w-0 break-words font-medium">
                                                                        {
                                                                            task.title
                                                                        }
                                                                    </p>

                                                                    {/* DEADLINE TAG */}

                                                                    <span
                                                                        className="
                                                                            inline-flex
                                                                            max-w-full
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
                                                                        {
                                                                            task.difficulty
                                                                        }
                                                                        x
                                                                    </span>

                                                                </div>

                                                                {/* DESCRIPTION */}

                                                                {task.description && (
                                                                    <p className="mt-1 break-words text-sm leading-5 opacity-50">
                                                                        {
                                                                            task.description
                                                                        }
                                                                    </p>
                                                                )}

                                                                {/* TEACHER */}

                                                                <p className="mt-3 break-words text-xs leading-5 opacity-50">
                                                                    Teacher:{" "}
                                                                    {getTeacherName(
                                                                        task
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
                                                                        h-9
                                                                        w-9
                                                                        items-center
                                                                        justify-center
                                                                        rounded-lg
                                                                        opacity-60
                                                                        transition
                                                                        hover:bg-(--navy-800)
                                                                        hover:text-(--gold-500)
                                                                        hover:opacity-100
                                                                    "
                                                                    aria-label={`Edit ${task.title}`}
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        requestDeleteTask(
                                                                            category.id,
                                                                            task.id
                                                                        )
                                                                    }
                                                                    className="
                                                                        flex
                                                                        h-9
                                                                        w-9
                                                                        items-center
                                                                        justify-center
                                                                        rounded-lg
                                                                        opacity-60
                                                                        transition
                                                                        hover:bg-(--navy-800)
                                                                        hover:text-red-400
                                                                        hover:opacity-100
                                                                    "
                                                                    aria-label={`Delete ${task.title}`}
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>

                                                            </div>

                                                        </div>
                                                    </div>
                                                )
                                            )}

                                        </div>
                                    )}

                                    {/* ADD TASK */}

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
                                            size={
                                                16
                                            }
                                        />

                                        Add Task
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
                            closeCategoryModal();
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-md
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                        "
                    >

                        <div className="flex items-start justify-between gap-3 border-b border-(--border) px-4 py-4 sm:px-6 sm:py-5">

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
                                "
                            >
                                <X
                                    size={
                                        17
                                    }
                                />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">

                            <div className="flex items-start justify-between gap-3">
                                <label
                                    htmlFor="category-name"
                                    className="text-sm font-medium"
                                >
                                    Category Name
                                </label>

                                <span className="shrink-0 text-xs opacity-40">
                                    {
                                        categoryName.length
                                    }{" "}
                                    /{" "}
                                    {
                                        CATEGORY_MAX_LENGTH
                                    }
                                </span>
                            </div>

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

                            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:flex sm:justify-end sm:gap-3">

                                <button
                                    type="button"
                                    onClick={
                                        closeCategoryModal
                                    }
                                    className="
                                        order-2
                                        rounded-xl
                                        border
                                        border-(--border)
                                        px-4
                                        py-2.5
                                        text-sm
                                        opacity-70
                                        transition
                                        hover:opacity-100
                                        sm:order-1
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
                                        order-1
                                        rounded-xl
                                        bg-(--gold-500)
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-(--navy-900)
                                        transition
                                        hover:opacity-90
                                        sm:order-2
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
                            closeTaskModal();
                        }
                    }}
                >
                    <div
                        className="
                            max-h-[94vh]
                            w-full
                            max-w-xl
                            overflow-y-auto
                            rounded-2xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            shadow-2xl
                            sm:max-h-[90vh]
                        "
                    >

                        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-(--border) bg-(--navy-900) px-4 py-4 sm:px-6 sm:py-5">

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
                                "
                            >
                                <X
                                    size={
                                        17
                                    }
                                />
                            </button>
                        </div>

                        <div className="space-y-5 p-4 sm:p-6">

                            {/* TITLE */}

                            <div>
                                <div className="flex items-start justify-between gap-3">

                                    <label
                                        htmlFor="task-title"
                                        className="text-sm font-medium"
                                    >
                                        Task Title
                                    </label>

                                    <span className="shrink-0 text-xs opacity-40">
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
                                        className="
                                            mt-2
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
                                        "
                                    >
                                        <option value="">
                                            Select Teacher
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
                                                    {teacher.name ||
                                                        teacher.username}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <div
                                        className="
                                            pointer-events-none
                                            absolute
                                            right-4
                                            top-3/5
                                            -translate-y-1/2
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

                                {!teachers.length && (
                                    <p className="mt-2 text-xs text-red-300">
                                        No active
                                        teachers
                                        are
                                        available.
                                    </p>
                                )}
                            </div>

                            {/* ACTIONS */}

                            <div className="grid grid-cols-1 gap-2.5 pt-2 sm:flex sm:justify-end sm:gap-3">

                                <button
                                    type="button"
                                    onClick={
                                        closeTaskModal
                                    }
                                    className="
                                        order-2
                                        rounded-xl
                                        border
                                        border-(--border)
                                        px-4
                                        py-2.5
                                        text-sm
                                        opacity-70
                                        transition
                                        hover:opacity-100
                                        sm:order-1
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        saveTask
                                    }
                                    disabled={
                                        !taskTitle.trim() ||
                                        !deadline ||
                                        !teacherId
                                    }
                                    className="
                                        order-1
                                        rounded-xl
                                        bg-(--gold-500)
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-semibold
                                        text-(--navy-900)
                                        transition
                                        hover:opacity-90
                                        disabled:cursor-not-allowed
                                        disabled:opacity-40
                                        sm:order-2
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
                DELETE CONFIRMATION MODAL
            ====================================================== */}

            {deleteModalOpen &&
                deleteTarget && (
                    <div
                        className="
                            fixed
                            inset-0
                            z-110
                            flex
                            items-end
                            justify-center
                            bg-black/60
                            px-3
                            py-3
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
                                closeDeleteModal();
                            }
                        }}
                    >
                        <div
                            className="
                                w-full
                                max-w-md
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                shadow-2xl
                            "
                        >

                            {/* HEADER */}

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
                                    <h2 className="text-lg font-semibold">
                                        Confirm Deletion
                                    </h2>

                                    <p className="mt-1 text-xs leading-5 opacity-50">
                                        This action
                                        cannot be
                                        undone.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
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
                                    "
                                    aria-label="Close"
                                >
                                    <X
                                        size={
                                            17
                                        }
                                    />
                                </button>
                            </div>

                            {/* CONTENT */}

                            <div className="p-4 sm:p-6">

                                {deleteTarget.type ===
                                    "category" && (
                                    <>
                                        <p className="text-sm leading-6 opacity-70">
                                            Are you
                                            sure you
                                            want to
                                            delete{" "}
                                            <span className="break-words font-semibold text-white">
                                                "
                                                {
                                                    deleteTarget.name
                                                }
                                                "
                                            </span>
                                            ?
                                        </p>

                                        {deleteTarget.taskCount >
                                            0 && (
                                            <div
                                                className="
                                                    mt-4
                                                    rounded-xl
                                                    border
                                                    border-red-400/20
                                                    bg-red-400/5
                                                    px-4
                                                    py-3
                                                    text-sm
                                                    leading-6
                                                    text-red-300
                                                "
                                            >
                                                This
                                                category
                                                contains{" "}
                                                <span className="font-semibold">
                                                    {
                                                        deleteTarget.taskCount
                                                    }
                                                </span>{" "}
                                                {deleteTarget.taskCount ===
                                                1
                                                    ? "task"
                                                    : "tasks"}{" "}
                                                and all
                                                of them
                                                will also
                                                be
                                                deleted.
                                            </div>
                                        )}
                                    </>
                                )}

                                {deleteTarget.type ===
                                    "task" && (
                                    <p className="text-sm leading-6 opacity-70">
                                        Are you
                                        sure you
                                        want to
                                        delete{" "}
                                        <span className="break-words font-semibold text-white">
                                            "
                                            {
                                                deleteTarget.name
                                            }
                                            "
                                        </span>
                                        ?
                                    </p>
                                )}

                                {/* ACTIONS */}

                                <div className="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:justify-end sm:gap-3">

                                    <button
                                        type="button"
                                        onClick={
                                            closeDeleteModal
                                        }
                                        className="
                                            order-2
                                            rounded-xl
                                            border
                                            border-(--border)
                                            px-4
                                            py-2.5
                                            text-sm
                                            opacity-70
                                            transition
                                            hover:opacity-100
                                            sm:order-1
                                        "
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            confirmDelete
                                        }
                                        className="
                                            order-1
                                            inline-flex
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
                                            sm:order-2
                                        "
                                    >
                                        <Trash2
                                            size={
                                                15
                                            }
                                        />

                                        Delete
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}