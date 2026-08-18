"use client";

import {
    Check,
    ChevronDown,
    Clock3,
    Eye,
    FileText,
    Loader2,
    Paperclip,
    RotateCcw,
    UserRound,
    X,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type Filter =
    | "all"
    | "checked"
    | "unchecked"
    | "recheck";

type Media = {
    id?: string;
    url: string;
    publicId?: string;
    resourceType: string;
    fileName: string;
    format: string | null;
    bytes?: number | null;
};

type Submission = {
    id: string;
    note: string | null;
    submittedAt: string;
    updatedAt: string;
    media: Media[];
};

type Review = {
    id: string;
    teacherId: string;
    score: number;
    note: string | null;
    checkedAt: string;
    updatedAt: string;
    teacher: {
        id: string;
        name: string;
        username: string;
    };
};

type AssignmentTask = {
    id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    difficulty: number;
    isChecked: boolean;
    isCompleted: boolean;
    isDelayed: boolean;
    completedAt: string | null;
    createdAt?: string;
    updatedAt?: string;
    checkedAt: string | null;
    score: number | null;
    date: string;

    student: {
        id: string;
        name: string;
        username: string;
        profileImg: string | null;
    };

    teacher: {
        id: string;
        name: string;
        username: string;
    };

    category: {
        id: string;
        name: string;
    };

    submissions: Submission[];
    review: Review | null;
};

type DayGroup = {
    date: string;
    label: string;
    tasks: AssignmentTask[];
};

type DashboardData = {
    stats: {
        totalTasks: number;
        checked: number;
        unchecked: number;
        todayRemaining: number;
    };
    groups: DayGroup[];
    hasMore: boolean;
};

const REVIEW_OPTIONS = [
    0,
    0.5,
    1,
    1.5,
    2,
    2.5,
    3,
    3.5,
    4,
    4.5,
    5,
];

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function getPakistanDateKey(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Karachi",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

function formatDeadline(value: string | null) {
    if (!value) {
        return "No deadline";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Karachi",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

function getLatestSubmission(task: AssignmentTask) {
    if (!task.submissions?.length) {
        return null;
    }

    return [...task.submissions].sort(
        (a, b) =>
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime()
    )[task.submissions.length - 1];
}

/*
 * ------------------------------------------------------------
 * TASK STATUS
 * ------------------------------------------------------------
 *
 * There are exactly THREE statuses:
 *
 * 1. unchecked
 *    - Task has never been checked.
 *
 * 2. recheck
 *    - Task was already checked.
 *    - Student submitted again after the previous review.
 *
 * 3. checked
 *    - Task was checked/rechecked.
 *    - No newer submission exists.
 *
 * We intentionally do NOT use submission count as the status.
 * The timestamp comparison is the source of truth.
 */

function hasPendingRecheck(task: AssignmentTask) {
    if (!task.isChecked) {
        return false;
    }

    const latestSubmission = getLatestSubmission(task);

    if (!latestSubmission) {
        return false;
    }

    if (!task.review?.checkedAt) {
        return false;
    }

    const submissionTime = new Date(
        latestSubmission.submittedAt
    ).getTime();

    const reviewTime = new Date(
        task.review.checkedAt
    ).getTime();

    if (
        Number.isNaN(submissionTime) ||
        Number.isNaN(reviewTime)
    ) {
        return false;
    }

    return submissionTime > reviewTime;
}

function isUncheckedTask(task: AssignmentTask) {
    return !task.isChecked;
}

function isRecheckTask(task: AssignmentTask) {
    return hasPendingRecheck(task);
}

function isCheckedTask(task: AssignmentTask) {
    return (
        task.isChecked &&
        !hasPendingRecheck(task)
    );
}

function getTaskStatus(
    task: AssignmentTask
): "unchecked" | "recheck" | "checked" {
    if (isRecheckTask(task)) {
        return "recheck";
    }

    if (isCheckedTask(task)) {
        return "checked";
    }

    return "unchecked";
}

function calculateScore(
    difficulty: number,
    reviewScore: number
) {
    return Math.round(
        difficulty * reviewScore
    );
}

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

function getMediaExtension(fileName: string) {
    const parts = fileName.split(".");

    if (parts.length < 2) {
        return "FILE";
    }

    return (
        parts[parts.length - 1] || "FILE"
    ).toUpperCase();
}

function isImage(media: Media) {
    if (media.resourceType === "image") {
        return true;
    }

    const format =
        media.format?.toLowerCase();

    return [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "svg",
        "avif",
    ].includes(format || "");
}

function isPdf(media: Media) {
    return (
        media.resourceType === "pdf" ||
        media.format?.toLowerCase() === "pdf" ||
        media.fileName
            .toLowerCase()
            .endsWith(".pdf")
    );
}

function getDateDifference(
    submittedAt: string,
    deadline: string | null
) {
    if (!deadline) {
        return null;
    }

    const difference =
        new Date(submittedAt).getTime() -
        new Date(deadline).getTime();

    if (difference <= 0) {
        return "Ontime";
    }

    const minutes = Math.round(
        difference / 60000
    );

    if (minutes < 60) {
        return `${minutes}min late`;
    }

    const hours = Math.floor(
        minutes / 60
    );

    const remainingMinutes =
        minutes % 60;

    if (!remainingMinutes) {
        return `${hours}h late`;
    }

    return `${hours}h ${remainingMinutes}min late`;
}

function MediaPreview({
    media,
    onPreview,
}: {
    media: Media;
    onPreview: (media: Media) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onPreview(media)}
            className="
                group
                relative
                h-24
                w-24
                shrink-0
                overflow-hidden
                rounded-xl
                border
                border-(--border)
                bg-(--navy-900)
                sm:h-28
                sm:w-28
            "
            title={media.fileName}
        >
            {isImage(media) ? (
                <img
                    src={media.url}
                    alt={media.fileName}
                    className="h-full w-full object-cover"
                />
            ) : isPdf(media) ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                    <FileText
                        size={30}
                        className="text-red-400"
                    />

                    <span className="rounded bg-red-400/10 px-2 py-1 text-[10px] font-semibold text-red-300">
                        PDF
                    </span>
                </div>
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                    <FileText
                        size={28}
                        className="opacity-50"
                    />

                    <span className="rounded border border-(--border) px-2 py-1 text-[10px] opacity-50">
                        {getMediaExtension(
                            media.fileName
                        )}
                    </span>
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                {media.fileName}
            </div>
        </button>
    );
}

function ReviewModal({
    task,
    onClose,
    onSaved,
    mode,
}: {
    task: AssignmentTask;
    onClose: () => void;
    onSaved: () => Promise<void>;
    mode: "check" | "view";
}) {
    const latestSubmission =
        getLatestSubmission(task);

    const pendingRecheck =
        isRecheckTask(task);

    const initialScore =
        pendingRecheck
            ? task.review?.score ?? 0
            : mode === "view"
                ? task.review?.score ?? 0
                : 0;

    const initialNote =
        pendingRecheck
            ? task.review?.note || ""
            : mode === "view"
                ? task.review?.note || ""
                : "";

    const [reviewScore, setReviewScore] =
        useState<number>(initialScore);

    const [teacherNote, setTeacherNote] =
        useState(initialNote);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [previewMedia, setPreviewMedia] =
        useState<Media | null>(null);

    const [expandedNote, setExpandedNote] =
        useState(false);

    const [isEditing, setIsEditing] =
        useState(mode === "check");

    useEffect(() => {
        const pending =
            isRecheckTask(task);

        setReviewScore(
            pending
                ? task.review?.score ?? 0
                : mode === "view"
                    ? task.review?.score ?? 0
                    : 0
        );

        setTeacherNote(
            pending
                ? task.review?.note || ""
                : mode === "view"
                    ? task.review?.note || ""
                    : ""
        );

        setIsEditing(
            mode === "check"
        );

        setError("");
    }, [
        task.id,
        task.review,
        task.submissions,
        mode,
    ]);

    const calculatedScore =
        calculateScore(
            task.difficulty,
            reviewScore
        );

    const submittedAt =
        latestSubmission?.submittedAt ||
        task.completedAt ||
        task.updatedAt ||
        new Date().toISOString();

    const timing =
        getDateDifference(
            submittedAt,
            task.deadline
        );

    async function handleReview() {
        try {
            setSaving(true);
            setError("");

            const response =
                await fetch(
                    `/api/teacher/assignments/${task.id}/review`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        credentials:
                            "include",
                        body: JSON.stringify({
                            score: reviewScore,
                            note:
                                teacherNote.trim() ||
                                null,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    "Failed to save review."
                );
            }

            await onSaved();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to save review."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            {/* =====================================================
                MODAL OVERLAY
            ====================================================== */}

            <div
                className="
                    fixed
                    inset-0
                    z-100
                    flex
                    items-end
                    justify-center
                    overflow-y-auto
                    bg-black/75
                    px-0
                    py-0
                    backdrop-blur-[2px]
                    sm:items-center
                    sm:px-4
                    sm:py-6
                    md:py-8
                "
                onMouseDown={(event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }}
            >
                <div
                    className="
                        mt-0
                        flex
                        max-h-[100dvh]
                        w-full
                        flex-col
                        overflow-hidden
                        rounded-t-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        shadow-2xl
                        sm:mt-8
                        sm:max-h-[94vh]
                        sm:max-w-5xl
                        sm:rounded-2xl
                    "
                >
                    {/* =================================================
                        STUDENT HEADER
                    ================================================== */}

                    <div
                        className="
                            shrink-0
                            border-b
                            border-black/10
                            bg-(--gold-500)
                            px-4
                            py-4
                            text-(--navy-900)
                            sm:px-6
                            sm:py-5
                        "
                    >
                        <div className="flex items-center justify-between gap-3 sm:gap-6">
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                {task.student
                                    .profileImg ? (
                                    <img
                                        src={
                                            task
                                                .student
                                                .profileImg
                                        }
                                        alt={
                                            task
                                                .student
                                                .name
                                        }
                                        className="
                                            h-11
                                            w-11
                                            shrink-0
                                            rounded-full
                                            border
                                            border-black/10
                                            object-cover
                                            sm:h-14
                                            sm:w-14
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
                                            bg-black/10
                                            text-sm
                                            font-semibold
                                            sm:h-14
                                            sm:w-14
                                        "
                                    >
                                        {getInitials(
                                            task
                                                .student
                                                .name
                                        )}
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] opacity-55 sm:text-[10px] sm:tracking-[0.2em]">
                                        Student Submission
                                    </p>

                                    <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">
                                        {
                                            task
                                                .student
                                                .name
                                        }
                                    </h2>

                                    <p className="mt-0.5 truncate text-[11px] opacity-60 sm:text-xs">
                                        @
                                        {
                                            task
                                                .student
                                                .username
                                        }
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    flex
                                    h-10
                                    w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    transition
                                    hover:bg-black/10
                                "
                                aria-label="Close review"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* =================================================
                        CONTENT
                    ================================================== */}

                    <div
                        className="
                            scholar-scrollbar
                            min-h-0
                            flex-1
                            overflow-y-auto
                            px-4
                            py-4
                            sm:px-6
                            sm:py-6
                        "
                    >
                        {/* =================================================
                            TASK INFORMATION
                        ================================================== */}

                        <section
                            className="
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-800)/40
                                p-4
                                sm:p-5
                            "
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--gold-500)">
                                        Task
                                    </p>

                                    <h3 className="mt-2 break-words text-lg font-semibold leading-6 sm:text-xl sm:leading-7">
                                        {
                                            task.title
                                        }
                                    </h3>

                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                        <span
                                            className="
                                                inline-flex
                                                items-center
                                                gap-1.5
                                                rounded-md
                                                border
                                                border-(--gold-500)/30
                                                bg-(--gold-500)/10
                                                px-2
                                                py-1.5
                                                text-[11px]
                                                font-medium
                                                text-(--gold-500)
                                            "
                                        >
                                            {
                                                task.difficulty
                                            }x
                                        </span>

                                        <span
                                            className="
                                                inline-flex
                                                max-w-full
                                                items-start
                                                gap-1
                                                rounded-lg
                                                border
                                                border-(--border)
                                                bg-(--navy-900)
                                                px-3
                                                py-1.5
                                                text-[11px]
                                                leading-5
                                                opacity-70
                                                sm:text-xs
                                            "
                                        >
                                            <Clock3
                                                size={12}
                                                className="mt-0.5 shrink-0"
                                            />

                                            <span className="break-words">
                                                Deadline:{" "}
                                                {formatDeadline(
                                                    task.deadline
                                                )}
                                            </span>
                                        </span>

                                        {timing && (
                                            <span
                                                className={`
                                                    inline-flex
                                                    items-center
                                                    rounded-lg
                                                    border
                                                    px-3
                                                    py-1.5
                                                    text-[11px]
                                                    sm:text-xs
                                                    ${timing ===
                                                        "Ontime"
                                                        ? "border-green-400/20 bg-green-400/5 text-green-300"
                                                        : "border-red-400/20 bg-red-400/5 text-red-300"
                                                    }
                                                `}
                                            >
                                                {timing}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full shrink-0 rounded-xl border border-(--border) bg-(--navy-900) px-4 py-3 sm:w-auto">
                                    <div className="flex items-center justify-between gap-4 sm:block">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider opacity-40">
                                                Submission
                                            </p>

                                            <p className="mt-1 text-sm font-medium">
                                                {pendingRecheck
                                                    ? "Resubmitted"
                                                    : "Submitted"}
                                            </p>
                                        </div>

                                        <p className="mt-0 text-right text-[11px] opacity-45 sm:mt-1 sm:text-left sm:text-xs">
                                            {formatTime(
                                                submittedAt
                                            )}{" "}
                                            ·{" "}
                                            {formatDate(
                                                submittedAt
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {pendingRecheck &&
                                task.review && (
                                    <div
                                        className="
                                            mt-4
                                            rounded-xl
                                            border
                                            border-(--gold-500)/20
                                            bg-(--gold-500)/5
                                            px-4
                                            py-3
                                        "
                                    >
                                        <p className="text-xs text-(--gold-500)">
                                            Previous review
                                        </p>

                                        <p className="mt-1 text-[11px] leading-5 opacity-55 sm:text-xs">
                                            Checked on{" "}
                                            {formatDateTime(
                                                task
                                                    .review
                                                    .checkedAt
                                            )}
                                        </p>
                                    </div>
                                )}
                        </section>

                        {/* =================================================
                            DESCRIPTION
                        ================================================== */}

                        <section className="mt-5 sm:mt-6">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="h-5 w-1 shrink-0 rounded-full bg-(--gold-500)" />

                                <h4 className="text-sm font-semibold">
                                    Task Description
                                </h4>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-800)/30
                                    px-4
                                    py-4
                                    sm:px-5
                                "
                            >
                                <p className="whitespace-pre-wrap break-words text-sm leading-6 opacity-65 sm:leading-7">
                                    {task.description ||
                                        "No description provided."}
                                </p>
                            </div>
                        </section>

                        {/* =================================================
                            STUDENT SUBMISSION
                        ================================================== */}

                        <section className="mt-5 sm:mt-6">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="h-5 w-1 shrink-0 rounded-full bg-(--gold-500)" />

                                    <div className="min-w-0">
                                        <h4 className="text-sm font-semibold">
                                            Student Submission
                                        </h4>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Files submitted
                                            by the student
                                        </p>
                                    </div>
                                </div>

                                {latestSubmission &&
                                    latestSubmission
                                        .media
                                        .length >
                                    0 && (
                                        <span className="shrink-0 rounded-lg border border-(--border) px-2.5 py-1 text-[10px] opacity-50 sm:text-[11px]">
                                            {
                                                latestSubmission
                                                    .media
                                                    .length
                                            }{" "}
                                            {latestSubmission
                                                .media
                                                .length ===
                                                1
                                                ? "file"
                                                : "files"}
                                        </span>
                                    )}
                            </div>

                            {latestSubmission &&
                                latestSubmission.media
                                    .length > 0 ? (
                                <div
                                    className="
                                        rounded-2xl
                                        border
                                        border-(--border)
                                        bg-(--navy-800)/30
                                        p-3
                                        sm:p-4
                                    "
                                >
                                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                                        {latestSubmission.media.map(
                                            (
                                                media
                                            ) => (
                                                <MediaPreview
                                                    key={
                                                        media.id ||
                                                        media.url
                                                    }
                                                    media={
                                                        media
                                                    }
                                                    onPreview={
                                                        setPreviewMedia
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="
                                        rounded-2xl
                                        border
                                        border-dashed
                                        border-(--border)
                                        bg-(--navy-800)/20
                                        px-5
                                        py-9
                                        text-center
                                        sm:px-6
                                        sm:py-10
                                    "
                                >
                                    <Paperclip
                                        size={24}
                                        className="mx-auto mb-3 opacity-25"
                                    />

                                    <p className="text-sm opacity-45">
                                        No media attached
                                    </p>

                                    <p className="mt-1 text-xs leading-5 opacity-25">
                                        The student did not
                                        upload any files.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* =================================================
                            STUDENT NOTE
                        ================================================== */}

                        <section className="mt-5 sm:mt-6">
                            <div className="mb-3 flex items-center gap-3">
                                <div className="h-5 w-1 shrink-0 rounded-full bg-(--gold-500)" />

                                <div>
                                    <h4 className="text-sm font-semibold">
                                        Student Note
                                    </h4>

                                    <p className="mt-0.5 text-[11px] opacity-40">
                                        Message from the
                                        student
                                    </p>
                                </div>
                            </div>

                            <div
                                className="
                                    relative
                                    rounded-2xl
                                    border
                                    border-(--border)
                                    bg-(--navy-800)/50
                                    px-4
                                    py-4
                                    sm:px-5
                                "
                            >
                                <div className="absolute left-0 top-5 h-8 w-0.5 rounded-r-full bg-(--gold-500)/60" />

                                <p
                                    className={`
                                        break-words
                                        whitespace-pre-wrap
                                        pl-2
                                        text-sm
                                        leading-6
                                        opacity-70
                                        sm:leading-7
                                        ${expandedNote
                                            ? ""
                                            : "line-clamp-5"
                                        }
                                    `}
                                >
                                    {latestSubmission
                                        ?.note ||
                                        "No student note provided."}
                                </p>

                                {latestSubmission?.note &&
                                    latestSubmission.note
                                        .split("\n")
                                        .length > 5 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedNote(
                                                    (value) =>
                                                        !value
                                                )
                                            }
                                            className="
                                                mt-3
                                                pl-2
                                                text-xs
                                                font-medium
                                                text-(--gold-500)
                                                transition
                                                hover:opacity-80
                                            "
                                        >
                                            {expandedNote
                                                ? "Show less"
                                                : "Read full note"}
                                        </button>
                                    )}
                            </div>
                        </section>

                        {/* =================================================
                            REVIEW
                        ================================================== */}

                        <section
                            className="
                                mt-6
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-800)/30
                                p-4
                                sm:mt-8
                                sm:p-5
                            "
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-1 shrink-0 rounded-full bg-(--gold-500)" />

                                        <h4 className="text-sm font-semibold">
                                            Teacher Review
                                        </h4>
                                    </div>

                                    <p className="mt-1 pl-4 text-[11px] leading-5 opacity-40">
                                        Select a review score
                                        and provide feedback
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <span className="rounded-lg border border-(--gold-500)/30 bg-(--gold-500)/5 px-3 py-2 text-sm font-medium text-(--gold-500)">
                                        {
                                            reviewScore
                                        }
                                        /5
                                    </span>

                                    <span className="rounded-lg border border-(--border) bg-(--navy-900) px-3 py-2 text-sm">
                                        {
                                            task.difficulty
                                        }x
                                    </span>
                                </div>
                            </div>

                            {/* SCORE SELECTOR */}

                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium opacity-50">
                                    Review Score
                                </p>

                                <div className="grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-6 md:grid-cols-11">
                                    {REVIEW_OPTIONS.map(
                                        (
                                            option
                                        ) => (
                                            <button
                                                key={
                                                    option
                                                }
                                                type="button"
                                                disabled={
                                                    !isEditing ||
                                                    saving
                                                }
                                                onClick={() =>
                                                    setReviewScore(
                                                        option
                                                    )
                                                }
                                                className={`
                                                    min-h-10
                                                    rounded-lg
                                                    border
                                                    px-2
                                                    py-2.5
                                                    text-xs
                                                    font-medium
                                                    transition
                                                    ${reviewScore ===
                                                        option
                                                        ? "border-(--gold-500) bg-(--gold-500) text-(--navy-900) shadow-sm"
                                                        : "border-(--border) bg-(--navy-900) hover:border-(--gold-500)/60 hover:bg-(--gold-500)/5"
                                                    }
                                                    disabled:cursor-not-allowed
                                                    disabled:opacity-50
                                                `}
                                            >
                                                {option}
                                            </button>
                                        )
                                    )}
                                </div>

                                <div
                                    className="
                                        mt-3
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                        rounded-lg
                                        border
                                        border-(--border)
                                        bg-(--navy-900)
                                        px-3
                                        py-2.5
                                    "
                                >
                                    <span className="text-[11px] opacity-40">
                                        Calculated score
                                    </span>

                                    <span className="text-xs font-medium text-(--gold-500)">
                                        {
                                            task.difficulty
                                        }{" "}
                                        ×{" "}
                                        {
                                            reviewScore
                                        }{" "}
                                        ={" "}
                                        {
                                            calculatedScore
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* TEACHER NOTE */}

                            <div className="mt-6">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <label
                                            htmlFor={`teacher-note-${task.id}`}
                                            className="text-sm font-semibold"
                                        >
                                            Teacher Note
                                        </label>

                                        <p className="mt-0.5 text-[11px] leading-5 opacity-40">
                                            Feedback that will
                                            be shown to the
                                            student
                                        </p>
                                    </div>

                                    {!isEditing && (
                                        <span className="shrink-0 rounded-md border border-(--border) px-2 py-1 text-[9px] uppercase tracking-wider opacity-40 sm:text-[10px]">
                                            Read only
                                        </span>
                                    )}
                                </div>

                                <div
                                    className="
                                        relative
                                        overflow-hidden
                                        rounded-2xl
                                        border
                                        border-(--border)
                                        bg-(--navy-900)
                                    "
                                >
                                    <div className="absolute left-0 top-0 h-full w-0.5 bg-(--gold-500)/60" />

                                    <textarea
                                        id={`teacher-note-${task.id}`}
                                        value={
                                            teacherNote
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setTeacherNote(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        disabled={
                                            !isEditing ||
                                            saving
                                        }
                                        rows={5}
                                        placeholder="Write feedback for the student..."
                                        className="
                                            min-h-32
                                            w-full
                                            resize-y
                                            bg-transparent
                                            px-4
                                            py-4
                                            text-sm
                                            leading-6
                                            outline-none
                                            placeholder:opacity-25
                                            focus:border-(--gold-500)
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                            sm:px-5
                                            sm:leading-7
                                        "
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <div
                        className="
                            shrink-0
                            border-t
                            border-(--border)
                            bg-(--navy-900)
                            px-4
                            py-3
                            sm:px-6
                            sm:py-5
                        "
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                            {error && (
                                <div className="order-first w-full rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm leading-5 text-red-300 sm:mr-auto sm:w-auto">
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="
                                    w-full
                                    rounded-xl
                                    border
                                    border-(--border)
                                    px-5
                                    py-3
                                    text-sm
                                    transition
                                    hover:border-(--gold-500)
                                    hover:text-(--gold-500)
                                    sm:w-auto
                                "
                            >
                                Close
                            </button>

                            {mode === "view" &&
                                !isEditing ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsEditing(
                                            true
                                        )
                                    }
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
                                        sm:w-auto
                                    "
                                >
                                    <RotateCcw
                                        size={16}
                                    />

                                    Recheck
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={
                                        handleReview
                                    }
                                    disabled={
                                        saving
                                    }
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
                                    "
                                >
                                    {saving ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Check
                                            size={16}
                                        />
                                    )}

                                    {pendingRecheck
                                        ? "Recheck"
                                        : "Check"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================================
                MEDIA PREVIEW
            ====================================================== */}

            {previewMedia && (
                <div
                    className="
                        fixed
                        inset-0
                        z-200
                        flex
                        items-center
                        justify-center
                        bg-black/90
                        p-3
                        sm:p-4
                    "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setPreviewMedia(
                                null
                            );
                        }
                    }}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setPreviewMedia(
                                null
                            )
                        }
                        className="
                            absolute
                            right-3
                            top-3
                            z-10
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-full
                            bg-black/60
                            text-white
                            transition
                            hover:bg-black/80
                            sm:right-5
                            sm:top-5
                        "
                        aria-label="Close media preview"
                    >
                        <X size={22} />
                    </button>

                    {isImage(
                        previewMedia
                    ) ? (
                        <img
                            src={
                                previewMedia.url
                            }
                            alt={
                                previewMedia.fileName
                            }
                            className="
                                max-h-[88dvh]
                                max-w-[96vw]
                                rounded-xl
                                object-contain
                                sm:max-h-[88vh]
                                sm:max-w-[92vw]
                            "
                        />
                    ) : isPdf(
                        previewMedia
                    ) ? (
                        <div
                            className="
                                h-[88dvh]
                                w-[96vw]
                                overflow-hidden
                                rounded-xl
                                bg-white
                                shadow-2xl
                                sm:h-[85vh]
                                sm:w-[90vw]
                                sm:max-w-5xl
                            "
                        >
                            <iframe
                                src={`/api/student/tasks/pdf-preview?url=${encodeURIComponent(
                                    previewMedia.url
                                )}`}
                                title={
                                    previewMedia.fileName
                                }
                                className="h-full w-full border-0"
                            />
                        </div>
                    ) : (
                        <div
                            className="
                                w-full
                                max-w-md
                                rounded-2xl
                                border
                                border-white/10
                                bg-(--navy-900)
                                p-6
                                text-center
                                sm:p-10
                            "
                        >
                            <FileText
                                size={56}
                                className="mx-auto mb-4 opacity-40"
                            />

                            <p className="break-words text-base font-medium text-white sm:text-lg">
                                {
                                    previewMedia.fileName
                                }
                            </p>

                            <a
                                href={
                                    previewMedia.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    mt-6
                                    inline-flex
                                    w-full
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-(--gold-500)
                                    px-5
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-(--navy-900)
                                    transition
                                    hover:opacity-90
                                    sm:w-auto
                                "
                            >
                                Open File
                            </a>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default function TeacherAssignmentsPage() {
    const [filter, setFilter] =
        useState<Filter>("all");

    const [data, setData] =
        useState<DashboardData>({
            stats: {
                totalTasks: 0,
                checked: 0,
                unchecked: 0,
                todayRemaining: 0,
            },
            groups: [],
            hasMore: false,
        });

    const [loading, setLoading] =
        useState(true);

    const [loadingMore, setLoadingMore] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedTask, setSelectedTask] =
        useState<AssignmentTask | null>(
            null
        );

    const [modalMode, setModalMode] =
        useState<"check" | "view">("check");

    const [limit, setLimit] =
        useState(50);

    const [success, setSuccess] =
        useState("");

    /*
     * IMPORTANT:
     *
     * Always request ALL assignments from the API.
     *
     * The API may only know about "checked" and
     * "unchecked". Recheck is a derived state and must
     * therefore be calculated here.
     */
    async function loadAssignments(
        requestedLimit = limit,
        append = false
    ) {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response =
                await fetch(
                    `/api/teacher/assignments?filter=all&limit=${requestedLimit}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        credentials:
                            "include",
                    }
                );

            const result =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                    "Failed to load assignments."
                );
            }

            setData(result);
        } catch (error) {
            console.error(
                "LOAD TEACHER ASSIGNMENTS ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load assignments."
            );
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    useEffect(() => {
        loadAssignments(50);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /*
     * Flatten all groups first.
     *
     * This lets the page calculate checked,
     * unchecked and recheck independently from
     * whatever filter logic exists in the API.
     */
    const allTasks = useMemo(() => {
        return data.groups.flatMap(
            (group) => group.tasks
        );
    }, [data.groups]);

    /*
     * --------------------------------------------------------
     * DERIVED COUNTS
     * --------------------------------------------------------
     */

    const checkedTasks = useMemo(() => {
        return allTasks.filter(
            isCheckedTask
        );
    }, [allTasks]);

    const uncheckedTasks = useMemo(() => {
        return allTasks.filter(
            isUncheckedTask
        );
    }, [allTasks]);

    const recheckTasks = useMemo(() => {
        return allTasks.filter(
            isRecheckTask
        );
    }, [allTasks]);

    /*
     * --------------------------------------------------------
     * FILTERED TASKS
     * --------------------------------------------------------
     */

    const filteredTasks = useMemo(() => {
        switch (filter) {
            case "checked":
                return checkedTasks;

            case "unchecked":
                return uncheckedTasks;

            case "recheck":
                return recheckTasks;

            case "all":
            default:
                return allTasks;
        }
    }, [
        filter,
        allTasks,
        checkedTasks,
        uncheckedTasks,
        recheckTasks,
    ]);

    const filteredGroups = useMemo(() => {
        const groups = new Map<
            string,
            DayGroup
        >();

        for (const task of filteredTasks) {
            const latestSubmission =
                getLatestSubmission(task);

            const submissionDate =
                latestSubmission?.submittedAt ||
                task.date;

            const dateKey =
                getPakistanDateKey(
                    submissionDate
                );

            const existing =
                groups.get(dateKey);

            if (existing) {
                existing.tasks.push(task);
            } else {
                groups.set(dateKey, {
                    date: dateKey,

                    label:
                        formatDate(
                            submissionDate
                        ),

                    tasks: [task],
                });
            }
        }

        /*
         * --------------------------------------------------------
         * SORT GROUPS
         * --------------------------------------------------------
         *
         * Newest submission date first.
         */

        return Array.from(
            groups.values()
        ).sort(
            (a, b) =>
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
        );
    }, [filteredTasks]);

    const totalCount =
        allTasks.length;

    const checkedCount =
        checkedTasks.length;

    const uncheckedCount =
        uncheckedTasks.length;

    const recheckCount =
        recheckTasks.length;

    function openCheck(
        task: AssignmentTask
    ) {
        setModalMode("check");
        setSelectedTask(task);
    }

    function openView(
        task: AssignmentTask
    ) {
        setModalMode("view");
        setSelectedTask(task);
    }

    /*
     * The modal action is determined exclusively
     * from the derived task status.
     */
    function openTask(
        task: AssignmentTask
    ) {
        const status =
            getTaskStatus(task);

        if (
            status === "unchecked" ||
            status === "recheck"
        ) {
            openCheck(task);
        } else {
            openView(task);
        }
    }

    async function refreshAfterReview() {
        setSelectedTask(null);

        setSuccess(
            "Task review saved successfully."
        );

        /*
         * Reload ALL assignments so the task immediately
         * moves between unchecked/recheck/checked.
         */
        await loadAssignments(
            limit
        );

        window.setTimeout(() => {
            setSuccess("");
        }, 3500);
    }

    function handleMore() {
        const nextLimit =
            limit + 50;

        setLimit(nextLimit);

        loadAssignments(
            nextLimit,
            true
        );
    }

    return (
        <main className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
            {/* PAGE HEADER */}

            <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-(--gold-400) sm:text-xs sm:tracking-[0.3em]">
                    Teacher Portal
                </p>

                <h1 className="mt-2 font-heading text-3xl font-bold tracking-wide text-white sm:text-4xl md:text-5xl">
                    Assignments
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70 sm:mt-3">
                    Review and check submitted
                    student tasks.
                </p>
            </div>

            {/* SUCCESS */}

            {success && (
                <div className="rounded-xl border border-green-400/30 bg-green-400/5 px-4 py-3 text-sm leading-5 text-green-300">
                    {success}
                </div>
            )}

            {/* ERROR */}

            {error && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-3 text-sm leading-5 text-red-300">
                    <span className="min-w-0 break-words">
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-red-400/10"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* STAT BOXES */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                <StatBox
                    label="Total Tasks"
                    value={totalCount}
                />

                <StatBox
                    label="Checked"
                    value={checkedCount}
                />

                <StatBox
                    label="Unchecked"
                    value={uncheckedCount}
                />

                <StatBox
                    label="Recheck"
                    value={recheckCount}
                />
            </div>

            {/* FILTER */}

            <div
                className="
                    -mx-4
                    overflow-x-auto
                    px-4
                    pb-1
                    sm:mx-0
                    sm:px-0
                "
            >
                <div className="flex min-w-max gap-2">
                    {(
                        [
                            "all",
                            "checked",
                            "unchecked",
                            "recheck",
                        ] as Filter[]
                    ).map((item) => {
                        const count =
                            item === "all"
                                ? totalCount
                                : item === "checked"
                                    ? checkedCount
                                    : item === "unchecked"
                                        ? uncheckedCount
                                        : recheckCount;

                        return (
                            <button
                                key={item}
                                type="button"
                                onClick={() =>
                                    setFilter(item)
                                }
                                className={`
                                    min-h-10
                                    rounded-full
                                    border
                                    px-4
                                    py-2
                                    text-sm
                                    font-medium
                                    capitalize
                                    transition
                                    sm:px-5
                                    sm:py-2.5
                                    ${filter ===
                                        item
                                        ? "border-(--gold-500) bg-(--gold-500) text-(--navy-900)"
                                        : "border-(--border) hover:border-(--gold-500)"
                                    }
                                `}
                            >
                                {item}

                                <span className="ml-2 opacity-60">
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TASK LIST */}

            {loading ? (
                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-(--border) bg-(--navy-900) p-10 sm:p-14">
                    <Loader2
                        size={24}
                        className="animate-spin opacity-50"
                    />
                </div>
            ) : filteredGroups.length ===
                0 ? (
                <div className="rounded-2xl border border-(--border) bg-(--navy-900) px-5 py-12 text-center text-sm leading-6 opacity-50 sm:p-14">
                    {filter === "recheck"
                        ? "No tasks need recheck."
                        : filter ===
                            "unchecked"
                            ? "No unchecked tasks."
                            : filter ===
                                "checked"
                                ? "No checked tasks."
                                : "No assignments found."}
                </div>
            ) : (
                <div className="space-y-6 sm:space-y-8">
                    {filteredGroups.map(
                        (group) => (
                            <section
                                key={
                                    group.date
                                }
                                className="space-y-3"
                            >
                                <div>
                                    <h2 className="text-sm font-semibold sm:text-base">
                                        {
                                            group.label
                                        }
                                    </h2>

                                    <p className="mt-1 text-[11px] opacity-40 sm:text-xs">
                                        {
                                            group
                                                .tasks
                                                .length
                                        }{" "}
                                        {group
                                            .tasks
                                            .length ===
                                            1
                                            ? "task"
                                            : "tasks"}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {group.tasks.map(
                                        (
                                            task
                                        ) => {
                                            const status =
                                                getTaskStatus(
                                                    task
                                                );

                                            return (
                                                <article
                                                    key={
                                                        task.id
                                                    }
                                                    className="
                                                        rounded-2xl
                                                        border
                                                        border-(--border)
                                                        bg-(--navy-900)
                                                        p-4
                                                        transition
                                                        hover:border-(--gold-500)/50
                                                        sm:px-5
                                                        sm:py-5
                                                    "
                                                >
                                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-5">
                                                        <div className="min-w-0">
                                                            <div className="flex min-w-0 items-start gap-2.5">
                                                                <h3 className="min-w-0 break-words text-sm font-medium leading-6 sm:text-base">
                                                                    {
                                                                        task.title
                                                                    }
                                                                </h3>

                                                                {/* REAL TASK DIFFICULTY ONLY */}

                                                                <span className="mt-0.5 shrink-0 rounded-md border border-(--border) bg-(--navy-800) px-2 py-0.5 text-[10px] font-medium opacity-70 sm:text-[11px]">
                                                                    {
                                                                        task.difficulty
                                                                    }
                                                                    x
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 flex flex-col gap-2 text-xs opacity-50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                                                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                                                    <UserRound
                                                                        size={
                                                                            13
                                                                        }
                                                                        className="shrink-0"
                                                                    />

                                                                    <span className="truncate">
                                                                        {
                                                                            task
                                                                                .student
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </span>

                                                                <span className="break-words">
                                                                    {formatDeadline(
                                                                        task.deadline
                                                                    )}
                                                                </span>

                                                                {/* ONLY SHOW THE REAL CURRENT STATUS */}

                                                                {status ===
                                                                    "checked" && (
                                                                    <span className="text-green-300">
                                                                        Checked
                                                                    </span>
                                                                )}

                                                                {status ===
                                                                    "unchecked" && (
                                                                    <span className="text-yellow-300">
                                                                        Unchecked
                                                                    </span>
                                                                )}

                                                                {status ===
                                                                    "recheck" && (
                                                                    <span className="text-orange-300">
                                                                        Recheck
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="w-full shrink-0 xl:w-auto">
                                                            {/* UNCHECKED */}

                                                            {status ===
                                                                "unchecked" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openCheck(
                                                                            task
                                                                        )
                                                                    }
                                                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-(--gold-500) px-5 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 sm:w-auto"
                                                                >
                                                                    <Check
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    Check
                                                                </button>
                                                            )}

                                                            {/* RECHECK */}

                                                            {status ===
                                                                "recheck" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openCheck(
                                                                            task
                                                                        )
                                                                    }
                                                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-(--gold-500) px-5 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 sm:w-auto"
                                                                >
                                                                    <RotateCcw
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    Recheck
                                                                </button>
                                                            )}

                                                            {/* CHECKED */}

                                                            {status ===
                                                                "checked" && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openView(
                                                                            task
                                                                        )
                                                                    }
                                                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-(--border) px-5 py-3 text-sm font-medium transition hover:border-(--gold-500) hover:text-(--gold-500) sm:w-auto"
                                                                >
                                                                    <Eye
                                                                        size={
                                                                            16
                                                                        }
                                                                    />

                                                                    View
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>
                            </section>
                        )
                    )}
                </div>
            )}

            {/* MORE */}

            {!loading &&
                data.hasMore && (
                    <div className="flex justify-center pt-1 sm:pt-2">
                        <button
                            type="button"
                            onClick={
                                handleMore
                            }
                            disabled={
                                loadingMore
                            }
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-(--border) px-6 py-3 text-sm font-medium transition hover:border-(--gold-500) hover:text-(--gold-500) disabled:opacity-50 sm:w-auto"
                        >
                            {loadingMore ? (
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <ChevronDown
                                    size={16}
                                />
                            )}

                            More
                        </button>
                    </div>
                )}

            {!loading &&
                allTasks.length > 0 &&
                !data.hasMore && (
                    <p className="text-center text-xs opacity-30">
                        All assignments
                        loaded.
                    </p>
                )}

            {/* REVIEW MODAL */}

            {selectedTask && (
                <ReviewModal
                    task={selectedTask}
                    mode={modalMode}
                    onClose={() =>
                        setSelectedTask(
                            null
                        )
                    }
                    onSaved={
                        refreshAfterReview
                    }
                />
            )}
        </main>
    );
}

function StatBox({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border border-(--border) bg-(--navy-900) p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] opacity-40 sm:text-xs sm:tracking-[0.16em]">
                {label}
            </p>

            <p className="mt-2 text-2xl font-semibold sm:mt-3 sm:text-3xl">
                {value}
            </p>
        </div>
    );
}