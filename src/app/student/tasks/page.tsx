"use client";

import {
    Check,
    Clock3,
    Eye,
    FileText,
    Loader2,
    Moon,
    Paperclip,
    Send,
    Upload,
    UserRound,
    CalendarDays,
    X,
} from "lucide-react";

import {
    ChangeEvent,
    useEffect,
    useRef,
    useState,
} from "react";

type Day =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

type Teacher = {
    id: string;
    name: string;
    username: string;
};

type UploadedMedia = {
    url: string;
    fileName: string;
    resourceType: string;
    format: string | null;
    publicId?: string;
    bytes?: number | null;
    file?: File;
};

type ExistingMedia = UploadedMedia & {
    id?: string;
};

type Submission = {
    id: string;
    note: string | null;
    submittedAt: string;
    updatedAt: string;
    media: ExistingMedia[];
};

type Review = {
    id: string;
    teacherId: string;
    score: number;
    note: string | null;
    checkedAt: string;
    teacher: Teacher;
};

type TaskItem = {
    id: string;
    title: string;
    description: string | null;
    deadline: string | null;
    difficulty: number;
    teacher: Teacher;
    category: {
        id: string;
        name: string;
    };
    isCompleted: boolean;
    isDelayed: boolean;
    isChecked: boolean;
    completedAt: string | null;
    submissions: Submission[];
    review: Review | null;
};

type TaskCategory = {
    id: string;
    name: string;
    sortOrder: number;
    tasks: TaskItem[];
};

const DAYS: {
    value: Day;
    label: string;
}[] = [
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
];

function getToday(): Day {
    const day = new Date().getDay();

    const days: Day[] = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
    ];

    return days[day];
}

function getOrderedDays(): {
    value: Day;
    label: string;
}[] {
    const today = getToday();

    const todayIndex = DAYS.findIndex(
        (day) => day.value === today
    );

    if (todayIndex === -1) {
        return DAYS;
    }

    return [
        ...DAYS.slice(todayIndex),
        ...DAYS.slice(0, todayIndex),
    ];
}

function getDateForDay(day: Day) {
    const today = new Date();
    const todayIndex = today.getDay();

    const jsDayMap: Day[] = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
    ];

    const targetIndex = jsDayMap.indexOf(day);

    let difference =
        targetIndex - todayIndex;

    if (difference < 0) {
        difference += 7;
    }

    const date = new Date(today);

    date.setDate(
        today.getDate() + difference
    );

    return date;
}

function formatDayDate(day: Day) {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(getDateForDay(day));
}

function formatDeadline(
    deadline: string | null
) {
    if (!deadline) {
        return "No deadline";
    }

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) {
        return deadline;
    }

    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function isMissed(deadline: string | null) {
    if (!deadline) {
        return false;
    }

    return (
        new Date().getTime() >
        new Date(deadline).getTime()
    );
}

function getDifficultyLabel(
    difficulty: number
) {
    if (difficulty === 1) {
        return "Easy";
    }

    if (difficulty === 2) {
        return "Medium";
    }

    if (difficulty === 3) {
        return "Hard";
    }

    return `${difficulty}x`;
}

function getSubmission(task: TaskItem) {
    if (!task.submissions?.length) {
        return null;
    }

    return task.submissions[
        task.submissions.length - 1
    ];
}

function getSubmissionStatus(task: TaskItem) {
    const submission = getSubmission(task);

    if (!submission) {
        return null;
    }

    if (!task.deadline) {
        return "ontime";
    }

    return new Date(
        submission.submittedAt
    ).getTime() >
        new Date(task.deadline).getTime()
        ? "delayed"
        : "ontime";
}

function calculateTotalScore(
    difficulty: number,
    review: Review | null
) {
    if (!review) {
        return null;
    }

    const result =
        difficulty * review.score;

    return Number.isInteger(result)
        ? result
        : Number(result.toFixed(2));
}

function getFileExtension(fileName: string) {
    const parts = fileName.split(".");

    return parts.length > 1
        ? parts[parts.length - 1].toUpperCase()
        : "FILE";
}

function getFileFormat(media: UploadedMedia) {
    const format =
        media.format?.toLowerCase();

    if (format) {
        return format;
    }

    const fileName =
        media.fileName.toLowerCase();

    if (fileName.includes(".")) {
        return (
            fileName
                .split(".")
                .pop()
                ?.toLowerCase() || ""
        );
    }

    return "";
}

function isImage(media: UploadedMedia) {
    if (media.resourceType === "image") {
        return true;
    }

    const format = getFileFormat(media);

    return [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "svg",
        "avif",
    ].includes(format);
}

function isPdf(media: UploadedMedia) {
    const format =
        media.format?.toLowerCase() || "";

    const fileName =
        media.fileName?.toLowerCase() || "";

    return (
        format === "pdf" ||
        fileName.endsWith(".pdf") ||
        media.resourceType === "pdf"
    );
}

function getMediaType(media: UploadedMedia) {
    if (isImage(media)) {
        return "image";
    }

    if (isPdf(media)) {
        return "pdf";
    }

    return "file";
}

export default function StudentTasksPage() {
    const [
        selectedDay,
        setSelectedDay,
    ] = useState<Day>(getToday());

    const [
        categories,
        setCategories,
    ] = useState<TaskCategory[]>([]);

    const [
        isOffDay,
        setIsOffDay,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        submitTask,
        setSubmitTask,
    ] = useState<TaskItem | null>(null);

    const [
        viewTask,
        setViewTask,
    ] = useState<TaskItem | null>(null);

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        note,
        setNote,
    ] = useState("");

    const [
        uploadedMedia,
        setUploadedMedia,
    ] = useState<UploadedMedia[]>([]);

    const [
        previewMedia,
        setPreviewMedia,
    ] = useState<UploadedMedia | null>(null);

    const [
        resubmitMode,
        setResubmitMode,
    ] = useState(false);

    const [
        originalNote,
        setOriginalNote,
    ] = useState("");

    const [
        originalMedia,
        setOriginalMedia,
    ] = useState<UploadedMedia[]>([]);

    const fileInputRef =
        useRef<HTMLInputElement>(null);

    const orderedDays = getOrderedDays();

    const today = getToday();

    const isCurrentDay =
        selectedDay === today;

    async function loadTasks(day: Day) {
        try {
            setLoading(true);
            setError("");

            const selectedDate =
                getDateForDay(day);

            const dateString =
                new Intl.DateTimeFormat(
                    "en-CA",
                    {
                        timeZone:
                            "Asia/Karachi",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                    }
                ).format(selectedDate);

            const response = await fetch(
                `/api/student/tasks?day=${encodeURIComponent(
                    day
                )}&date=${encodeURIComponent(
                    dateString
                )}`,
                {
                    method: "GET",
                    cache: "no-store",
                    credentials:
                        "include",
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to load tasks."
                );
            }

            setIsOffDay(
                data.isWorking === false ||
                    data.dayType === "OFF"
            );

            setCategories(
                Array.isArray(
                    data.categories
                )
                    ? data.categories
                    : []
            );
        } catch (error) {
            console.error(
                "LOAD STUDENT TASKS ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load tasks."
            );

            setCategories([]);
            setIsOffDay(false);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTasks(selectedDay);
    }, [selectedDay]);

    function openSubmitModal(
        task: TaskItem
    ) {
        if (!isCurrentDay) {
            return;
        }

        setSubmitTask(task);
        setViewTask(null);
        setResubmitMode(false);
        setNote("");
        setUploadedMedia([]);
        setOriginalNote("");
        setOriginalMedia([]);
        setError("");
    }

    function openViewModal(
        task: TaskItem
    ) {
        setViewTask(task);
        setSubmitTask(null);
        setError("");
    }

    function closeSubmitModal() {
        if (submitting) {
            return;
        }

        uploadedMedia.forEach((media) => {
            if (
                media.file &&
                media.url.startsWith("blob:")
            ) {
                URL.revokeObjectURL(
                    media.url
                );
            }
        });

        setSubmitTask(null);
        setNote("");
        setUploadedMedia([]);
        setResubmitMode(false);
        setOriginalNote("");
        setOriginalMedia([]);
    }

    function closeViewModal() {
        setViewTask(null);
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const files = event.target.files;

        if (!files || files.length === 0) {
            return;
        }

        const selected: UploadedMedia[] =
            [];

        for (
            let index = 0;
            index < files.length;
            index++
        ) {
            const file = files[index];

            selected.push({
                url: URL.createObjectURL(
                    file
                ),
                fileName: file.name,
                resourceType:
                    file.type.startsWith(
                        "image/"
                    )
                        ? "image"
                        : "raw",
                format:
                    file.name.includes(".")
                        ? file.name
                              .split(".")
                              .pop()
                              ?.toLowerCase() ||
                          null
                        : null,
                file,
            });
        }

        setUploadedMedia(
            (previous) => [
                ...previous,
                ...selected,
            ]
        );

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    }

    function removeUploadedMedia(
        index: number
    ) {
        setUploadedMedia(
            (previous) => {
                const media =
                    previous[index];

                if (
                    media?.file &&
                    media.url.startsWith(
                        "blob:"
                    )
                ) {
                    URL.revokeObjectURL(
                        media.url
                    );
                }

                return previous.filter(
                    (_, itemIndex) =>
                        itemIndex !==
                        index
                );
            }
        );
    }

    async function handleSubmit() {
        if (
            !submitTask ||
            !isCurrentDay
        ) {
            return;
        }

        if (
            resubmitMode &&
            !hasChanges()
        ) {
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const mediaToSubmit: Array<{
                url: string;
                publicId?: string;
                resourceType?: string;
                fileName?: string;
                format?: string | null;
                bytes?: number | null;
            }> = [];

            for (
                const media of uploadedMedia
            ) {
                if (!media.file) {
                    const existingMedia =
                        media as ExistingMedia & {
                            publicId?: string;
                            bytes?: number | null;
                        };

                    mediaToSubmit.push({
                        url: media.url,
                        publicId:
                            existingMedia.publicId,
                        resourceType:
                            media.resourceType,
                        fileName:
                            media.fileName,
                        format:
                            media.format,
                        bytes:
                            existingMedia.bytes ??
                            null,
                    });

                    continue;
                }

                const uploadFormData =
                    new FormData();

                uploadFormData.append(
                    "file",
                    media.file,
                    media.file.name
                );

                const uploadResponse =
                    await fetch(
                        "/api/student/tasks/upload",
                        {
                            method: "POST",
                            credentials:
                                "include",
                            body:
                                uploadFormData,
                        }
                    );

                const uploadContentType =
                    uploadResponse.headers.get(
                        "content-type"
                    ) || "";

                let uploadData: {
                    success?: boolean;
                    message?: string;
                    media?: {
                        url: string;
                        publicId: string;
                        resourceType: string;
                        format:
                            | string
                            | null;
                        bytes: number;
                        fileName: string;
                    };
                } = {};

                if (
                    uploadContentType.includes(
                        "application/json"
                    )
                ) {
                    uploadData =
                        await uploadResponse.json();
                } else {
                    const text =
                        await uploadResponse.text();

                    throw new Error(
                        text ||
                            `Failed to upload ${media.file.name}.`
                    );
                }

                if (
                    !uploadResponse.ok ||
                    !uploadData.media
                ) {
                    throw new Error(
                        uploadData.message ||
                            `Failed to upload ${media.file.name}.`
                    );
                }

                mediaToSubmit.push({
                    url:
                        uploadData.media
                            .url,
                    publicId:
                        uploadData.media
                            .publicId,
                    resourceType:
                        uploadData.media
                            .resourceType,
                    fileName:
                        uploadData.media
                            .fileName,
                    format:
                        uploadData.media
                            .format,
                    bytes:
                        uploadData.media
                            .bytes,
                });
            }

            const formData =
                new FormData();

            formData.append(
                "note",
                note
            );

            formData.append(
                "media",
                JSON.stringify(
                    mediaToSubmit
                )
            );

            const response =
                await fetch(
                    `/api/student/tasks/${submitTask.id}/submit`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        body: formData,
                    }
                );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let data: {
                message?: string;
                success?: boolean;
                mediaCount?: number;
            } = {};

            if (
                contentType.includes(
                    "application/json"
                )
            ) {
                data =
                    await response.json();
            } else {
                const text =
                    await response.text();

                throw new Error(
                    text ||
                        "Server returned an invalid response."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to submit task."
                );
            }

            uploadedMedia.forEach(
                (media) => {
                    if (
                        media.file &&
                        media.url.startsWith(
                            "blob:"
                        )
                    ) {
                        URL.revokeObjectURL(
                            media.url
                        );
                    }
                }
            );

            const teacherName =
                submitTask.teacher?.name ||
                submitTask.teacher?.username ||
                "teacher";

            setSubmitTask(null);
            setNote("");
            setUploadedMedia([]);
            setResubmitMode(false);
            setOriginalNote("");
            setOriginalMedia([]);

            setSuccessMessage(
                `Task submitted to ${teacherName}.`
            );

            await loadTasks(
                selectedDay
            );
        } catch (error) {
            console.error(
                "SUBMIT TASK ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to submit task."
            );
        } finally {
            setSubmitting(false);
        }
    }

    function startResubmit() {
        if (
            !viewTask ||
            !isCurrentDay
        ) {
            return;
        }

        const submission =
            getSubmission(viewTask);

        if (!submission) {
            return;
        }

        const existingMedia: UploadedMedia[] =
            submission.media.map(
                (media) => ({
                    url: media.url,
                    fileName:
                        media.fileName,
                    resourceType:
                        media.resourceType,
                    format:
                        media.format ??
                        null,
                    publicId:
                        (
                            media as ExistingMedia & {
                                publicId?: string;
                            }
                        ).publicId,
                    bytes:
                        (
                            media as ExistingMedia & {
                                bytes?:
                                    | number
                                    | null;
                            }
                        ).bytes ??
                        null,
                    id: media.id,
                })
            );

        setOriginalNote(
            submission.note || ""
        );

        setOriginalMedia(
            existingMedia
        );

        setNote(
            submission.note || ""
        );

        setUploadedMedia(
            existingMedia
        );

        setResubmitMode(true);

        setViewTask(null);
        setSubmitTask(viewTask);
    }

    function hasChanges() {
        if (!resubmitMode) {
            return true;
        }

        if (
            note.trim() !==
            originalNote.trim()
        ) {
            return true;
        }

        if (
            uploadedMedia.length !==
            originalMedia.length
        ) {
            return true;
        }

        return uploadedMedia.some(
            (media, index) => {
                const original =
                    originalMedia[index];

                if (!original) {
                    return true;
                }

                return (
                    media.url !==
                        original.url ||
                    media.fileName !==
                        original.fileName
                );
            }
        );
    }

    function renderMedia(
        media: UploadedMedia,
        index: number,
        removable = false
    ) {
        const mediaType =
            getMediaType(media);

        return (
            <div
                key={`${media.url}-${index}`}
                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-(--border) bg-(--navy-900)"
                title={media.fileName}
            >
                <button
                    type="button"
                    onClick={() =>
                        setPreviewMedia(
                            media
                        )
                    }
                    className="h-full w-full"
                >
                    {mediaType ===
                    "image" ? (
                        <img
                            src={
                                media.url
                            }
                            alt={
                                media.fileName
                            }
                            className="h-full w-full object-cover"
                        />
                    ) : mediaType ===
                      "pdf" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
                            <FileText
                                size={30}
                                className="text-red-400"
                            />

                            <span className="rounded bg-red-400/10 px-2 py-1 text-[10px] font-semibold text-red-300">
                                PDF
                            </span>
                        </div>
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
                            <FileText
                                size={28}
                                className="opacity-60"
                            />

                            <span className="rounded border border-(--border) px-2 py-1 text-[10px] opacity-60">
                                {getFileExtension(
                                    media.fileName
                                )}
                            </span>
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/70 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                        {
                            media.fileName
                        }
                    </div>
                </button>

                {removable && (
                    <button
                        type="button"
                        onClick={() =>
                            removeUploadedMedia(
                                index
                            )
                        }
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1.5 text-white opacity-100 transition hover:bg-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <main className="min-w-0 space-y-6 overflow-x-hidden p-4 sm:space-y-8 sm:p-6 lg:p-8">
            {/* PAGE HEADER */}

            <div className="min-w-0">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-(--gold-400) sm:text-xs sm:tracking-[0.3em]">
                    Student Portal
                </p>

                <h1 className="mt-2 break-words font-heading text-3xl font-bold tracking-wide text-white sm:text-4xl md:text-5xl">
                    Tasks
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70">
                    Complete your assigned
                    tasks and submit your
                    work to your teachers.
                </p>
            </div>

            {/* SUCCESS */}

            {successMessage && (
                <div className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-green-400/30 bg-green-400/5 px-3 py-3 text-sm text-green-300 sm:px-4">
                    <span className="min-w-0 break-words">
                        {successMessage}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccessMessage(
                                ""
                            )
                        }
                        className="shrink-0 p-1 opacity-60 hover:opacity-100"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ERROR */}

            {error && (
                <div className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-red-400/30 bg-red-400/5 px-3 py-3 text-sm text-red-300 sm:px-4">
                    <span className="min-w-0 break-words">
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        className="shrink-0 p-1 opacity-60 hover:opacity-100"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* DAYS */}

            <div className="-mx-4 overflow-hidden px-4 sm:-mx-0 sm:px-0">
                <div className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {orderedDays.map(
                        (day) => {
                            const active =
                                selectedDay ===
                                day.value;

                            return (
                                <button
                                    key={
                                        day.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        setSelectedDay(
                                            day.value
                                        )
                                    }
                                    className={`min-w-[108px] shrink-0 snap-start rounded-xl border px-4 py-3 text-left transition active:scale-[0.98] sm:min-w-0 sm:px-5 ${
                                        active
                                            ? "border-(--gold-500) bg-(--gold-500) text-black"
                                            : "border-(--border) hover:border-(--gold-500)"
                                    }`}
                                >
                                    <div className="text-sm font-medium">
                                        {
                                            day.label
                                        }
                                    </div>
                                </button>
                            );
                        }
                    )}
                </div>
            </div>

            {/* SELECTED DAY DATE */}

            <div className="flex min-w-0 items-start gap-2 text-xs leading-5 opacity-50 sm:text-sm">
                <CalendarDays
                    size={16}
                    strokeWidth={1.8}
                    className="mt-0.5 shrink-0"
                />

                <span className="break-words">
                    {formatDayDate(
                        selectedDay
                    )}
                </span>
            </div>

            {/* DAY CONTENT */}

            {loading ? (
                <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-(--border) bg-(--navy-900) p-8 sm:p-12">
                    <Loader2
                        size={22}
                        className="animate-spin opacity-50"
                    />
                </div>
            ) : isOffDay ? (
                /* OFF DAY */

                <section>
                    <div
                        className="
                            relative
                            overflow-hidden
                            rounded-2xl
                            border
                            border-(--gold-500)/20
                            bg-(--navy-900)
                            px-5
                            py-14
                            text-center
                            sm:px-6
                            sm:py-20
                        "
                    >
                        <div
                            className="
                                pointer-events-none
                                absolute
                                left-1/2
                                top-0
                                h-48
                                w-48
                                -translate-x-1/2
                                -translate-y-1/2
                                rounded-full
                                bg-(--gold-500)/10
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                relative
                                mx-auto
                                flex
                                h-14
                                w-14
                                items-center
                                justify-center
                                rounded-2xl
                                border
                                border-(--gold-500)/30
                                bg-(--gold-500)/10
                                text-(--gold-500)
                                sm:h-16
                                sm:w-16
                            "
                        >
                            <Moon
                                size={26}
                                strokeWidth={1.6}
                            />
                        </div>

                        <p
                            className="
                                relative
                                mt-5
                                text-[10px]
                                font-semibold
                                uppercase
                                tracking-[0.2em]
                                text-(--gold-500)
                                sm:mt-6
                                sm:text-xs
                            "
                        >
                            {
                                selectedDay
                            }
                        </p>

                        <h3
                            className="
                                relative
                                mt-2
                                text-xl
                                font-semibold
                                sm:text-2xl
                            "
                        >
                            It&apos;s an Off Day
                        </h3>

                        <p
                            className="
                                relative
                                mx-auto
                                mt-3
                                max-w-md
                                text-sm
                                leading-6
                                opacity-50
                            "
                        >
                            There are no academic
                            activities scheduled for
                            you today. Take some time
                            to rest and recharge.
                        </p>

                        <div
                            className="
                                relative
                                mx-auto
                                mt-6
                                h-px
                                w-16
                                bg-(--gold-500)/30
                            "
                        />
                    </div>
                </section>
            ) : categories.length === 0 ? (
                /* WORKING DAY — NO TASKS */

                <div className="rounded-2xl border border-(--border) bg-(--navy-900) px-5 py-10 text-center text-sm leading-6 opacity-50 sm:p-12">
                    No tasks assigned
                    for{" "}
                    {
                        DAYS.find(
                            (day) =>
                                day.value ===
                                selectedDay
                        )?.label
                    }
                    .
                </div>
            ) : (
                /* TASK CATEGORIES */

                <div className="space-y-4 sm:space-y-5">
                    {categories.map(
                        (category) => (
                            <section
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
                                        min-w-0
                                        items-center
                                        justify-between
                                        gap-4
                                        border-b
                                        border-(--border)
                                        bg-(--navy-800)
                                        px-4
                                        py-4
                                        sm:px-5
                                    "
                                >
                                    <div className="min-w-0">
                                        <h3 className="truncate font-medium">
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

                                {/* TASK LIST */}

                                <div className="p-3 sm:p-5">
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
                                                ) => {
                                                    const submission =
                                                        getSubmission(
                                                            task
                                                        );

                                                    const submitted =
                                                        !!submission;

                                                    const status =
                                                        getSubmissionStatus(
                                                            task
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                task.id
                                                            }
                                                            className="
                                                                min-w-0
                                                                rounded-xl
                                                                border
                                                                border-(--border)
                                                                bg-(--navy-900)
                                                                px-3
                                                                py-4
                                                                transition
                                                                hover:border-(--gold-500)/40
                                                                sm:px-4
                                                            "
                                                        >
                                                            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                {/* TASK INFORMATION */}

                                                                <div className="min-w-0 flex-1">
                                                                    {/* TITLE + TAGS */}

                                                                    <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                                                                        <p className="min-w-0 max-w-full break-words font-medium">
                                                                            {
                                                                                task.title
                                                                            }
                                                                        </p>

                                                                        {/* DEADLINE */}

                                                                        <span
                                                                            className="
                                                                                inline-flex
                                                                                max-w-full
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
                                                                                text-(--gold-500)
                                                                                sm:text-[11px]
                                                                            "
                                                                        >
                                                                            <Clock3
                                                                                size={
                                                                                    11
                                                                                }
                                                                                className="shrink-0"
                                                                            />

                                                                            <span className="truncate">
                                                                                {formatDeadline(
                                                                                    task.deadline
                                                                                )}
                                                                            </span>
                                                                        </span>

                                                                        {/* DIFFICULTY */}

                                                                        <span
                                                                            className="
                                                                                rounded-md
                                                                                border
                                                                                border-(--border)
                                                                                bg-(--navy-800)
                                                                                px-2
                                                                                py-1
                                                                                text-[10px]
                                                                                font-medium
                                                                                opacity-70
                                                                                sm:text-[11px]
                                                                            "
                                                                        >
                                                                            {
                                                                                task.difficulty
                                                                            }x
                                                                        </span>

                                                                        {/* SUBMITTED */}

                                                                        {submitted && (
                                                                            <span
                                                                                className="
                                                                                    inline-flex
                                                                                    items-center
                                                                                    gap-1
                                                                                    rounded-md
                                                                                    border
                                                                                    border-green-400/30
                                                                                    bg-green-400/5
                                                                                    px-2
                                                                                    py-1
                                                                                    text-[10px]
                                                                                    font-medium
                                                                                    text-green-300
                                                                                    sm:text-[11px]
                                                                                "
                                                                            >
                                                                                <Check
                                                                                    size={
                                                                                        11
                                                                                    }
                                                                                />
                                                                                Submitted
                                                                            </span>
                                                                        )}

                                                                        {/* STATUS */}

                                                                        {submitted &&
                                                                            status && (
                                                                                <span
                                                                                    className={`rounded-md border px-2 py-1 text-[10px] font-medium sm:text-[11px] ${
                                                                                        status ===
                                                                                        "ontime"
                                                                                            ? "border-green-400/30 bg-green-400/5 text-green-300"
                                                                                            : "border-red-400/30 bg-red-400/5 text-red-300"
                                                                                    }`}
                                                                                >
                                                                                    {status ===
                                                                                    "ontime"
                                                                                        ? "Ontime"
                                                                                        : "Delayed"}
                                                                                </span>
                                                                            )}

                                                                        {/* CHECKED */}

                                                                        {submitted &&
                                                                            task.isChecked && (
                                                                                <span
                                                                                    className="
                                                                                        rounded-md
                                                                                        border
                                                                                        border-(--gold-500)/30
                                                                                        bg-(--gold-500)/10
                                                                                        px-2
                                                                                        py-1
                                                                                        text-[10px]
                                                                                        font-medium
                                                                                        text-(--gold-500)
                                                                                        sm:text-[11px]
                                                                                    "
                                                                                >
                                                                                    Checked
                                                                                </span>
                                                                            )}
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

                                                                    <p className="mt-3 inline-flex max-w-full items-start gap-1.5 text-xs leading-5 opacity-50">
                                                                        <UserRound
                                                                            size={
                                                                                13
                                                                            }
                                                                            className="mt-0.5 shrink-0"
                                                                        />

                                                                        <span className="min-w-0 break-words">
                                                                            Teacher:{" "}
                                                                            {task
                                                                                .teacher
                                                                                ?.name ||
                                                                                task
                                                                                    .teacher
                                                                                    ?.username ||
                                                                                "Unknown"}
                                                                        </span>
                                                                    </p>
                                                                </div>

                                                                {/* ACTION */}

                                                                <div className="w-full shrink-0 lg:w-auto lg:pt-0.5">
                                                                    {submitted ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openViewModal(
                                                                                    task
                                                                                )
                                                                            }
                                                                            className="
                                                                                inline-flex
                                                                                w-full
                                                                                items-center
                                                                                justify-center
                                                                                gap-2
                                                                                rounded-xl
                                                                                border
                                                                                border-(--border)
                                                                                px-5
                                                                                py-3
                                                                                text-sm
                                                                                font-medium
                                                                                transition
                                                                                hover:border-(--gold-500)
                                                                                hover:text-(--gold-500)
                                                                                active:scale-[0.99]
                                                                                lg:w-auto
                                                                            "
                                                                        >
                                                                            <Eye
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />

                                                                            View
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openSubmitModal(
                                                                                    task
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !isCurrentDay
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
                                                                                active:scale-[0.99]
                                                                                disabled:cursor-not-allowed
                                                                                disabled:opacity-35
                                                                                disabled:hover:opacity-35
                                                                                lg:w-auto
                                                                            "
                                                                        >
                                                                            <Send
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />

                                                                            Submit
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )
                    )}
                </div>
            )}

            {/* =====================================================
                SUBMIT / RESUBMIT MODAL
            ===================================================== */}

            {submitTask && (
                <div
                    className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-black/75 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeSubmitModal();
                        }
                    }}
                >
                    <div className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--border) bg-(--navy-900) shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
                        {/* HEADER */}

                        <div className="relative shrink-0 border-b border-(--border) bg-(--navy-800)/50 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="absolute left-0 top-0 h-full w-1 bg-(--gold-500)" />

                            <div className="flex min-w-0 items-start justify-between gap-3 pl-2 sm:gap-5">
                                <div className="min-w-0">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--gold-500)" />

                                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-(--gold-500) sm:text-[10px] sm:tracking-[0.2em]">
                                            {resubmitMode
                                                ? "Resubmit Task"
                                                : "Task Submission"}
                                        </span>
                                    </div>

                                    <h2 className="max-w-2xl break-words text-lg font-semibold leading-tight text-white sm:text-2xl">
                                        {
                                            submitTask.title
                                        }
                                    </h2>

                                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
                                        <span className="inline-flex items-center rounded-lg border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1.5 text-[10px] font-semibold text-(--gold-500) sm:px-2.5 sm:text-[11px]">
                                            {
                                                submitTask.difficulty
                                            }x
                                        </span>

                                        <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                                            <Clock3
                                                size={12}
                                                className="shrink-0"
                                            />

                                            <span className="truncate">
                                                {formatDeadline(
                                                    submitTask.deadline
                                                )}
                                            </span>
                                        </span>

                                        <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                                            <UserRound
                                                size={12}
                                                className="shrink-0"
                                            />

                                            <span className="max-w-[150px] truncate sm:max-w-none">
                                                {submitTask.teacher
                                                    ?.name ||
                                                    submitTask.teacher
                                                        ?.username ||
                                                    "Unknown"}
                                            </span>
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
                                                isMissed(
                                                    submitTask.deadline
                                                )
                                                    ? "border-red-400/30 bg-red-400/10 text-red-300"
                                                    : "border-green-400/30 bg-green-400/10 text-green-300"
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                    isMissed(
                                                        submitTask.deadline
                                                    )
                                                        ? "bg-red-400"
                                                        : "bg-green-400"
                                                }`}
                                            />

                                            {isMissed(
                                                submitTask.deadline
                                            )
                                                ? "Missed"
                                                : "Ontime"}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeSubmitModal}
                                    disabled={submitting}
                                    className="shrink-0 rounded-xl border border-transparent p-2 text-white/40 transition hover:border-(--border) hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}

                        <div className="scholar-scrollbar min-h-0 max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain px-4 py-5 sm:max-h-[72vh] sm:px-6 sm:py-6">
                            {/* DESCRIPTION */}

                            <section>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                        <FileText size={15} />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold">
                                            Task Description
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Instructions from your teacher
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-(--border) bg-(--navy-800)/40 px-4 py-4 sm:px-5">
                                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/65">
                                        {submitTask.description ||
                                            "No description provided."}
                                    </p>
                                </div>
                            </section>

                            {/* YOUR WORK */}

                            <section className="mt-7 sm:mt-8">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                            <Paperclip size={15} />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold">
                                                Your Work
                                            </h3>

                                            <p className="mt-0.5 text-[11px] opacity-40">
                                                Attach your files and supporting work
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--gold-500)/30 bg-(--gold-500)/5 px-4 py-3 text-xs font-medium text-(--gold-500) transition hover:border-(--gold-500) hover:bg-(--gold-500)/10 sm:w-auto sm:py-2.5"
                                    >
                                        <Upload size={15} />
                                        Upload Files
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,video/*,audio/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {uploadedMedia.length > 0 ? (
                                    <div className="mt-4 rounded-xl border border-(--border) bg-(--navy-800)/30 p-3 sm:p-4">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <p className="text-[10px] font-medium uppercase tracking-wider opacity-40 sm:text-[11px]">
                                                Attached Files
                                            </p>

                                            <span className="shrink-0 rounded-md border border-(--border) px-2 py-1 text-[10px] opacity-50">
                                                {
                                                    uploadedMedia.length
                                                }{" "}
                                                {uploadedMedia.length ===
                                                1
                                                    ? "file"
                                                    : "files"}
                                            </span>
                                        </div>

                                        <div className="flex max-w-full flex-wrap gap-2.5 sm:gap-3">
                                            {uploadedMedia.map(
                                                (
                                                    media,
                                                    index
                                                ) =>
                                                    renderMedia(
                                                        media,
                                                        index,
                                                        true
                                                    )
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-(--border) bg-(--navy-800)/20 px-4 py-7 text-center sm:px-5 sm:py-8">
                                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-(--border) bg-(--navy-800) opacity-60">
                                            <Paperclip size={19} />
                                        </div>

                                        <p className="mt-3 text-xs font-medium opacity-60">
                                            No files attached
                                        </p>

                                        <p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 opacity-30">
                                            Images, PDFs, documents and other supported files
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* YOUR NOTE */}

                            <section className="mt-7 sm:mt-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                        <Send size={14} />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Your Note
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Add a message for your teacher
                                        </p>
                                    </div>
                                </div>

                                <div className="relative mt-4">
                                    <textarea
                                        id="task-note"
                                        value={note}
                                        onChange={(event) =>
                                            setNote(
                                                event.target.value
                                            )
                                        }
                                        rows={6}
                                        placeholder="Write something for your teacher..."
                                        className="min-h-[150px] w-full resize-y rounded-xl border border-(--border) bg-(--navy-800)/30 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-(--gold-500)/60 focus:bg-(--navy-800)/50 sm:min-h-0"
                                    />

                                    <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-(--navy-900) px-2 py-1 text-[10px] opacity-30">
                                        Optional
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* FOOTER */}

                        <div className="shrink-0 border-t border-(--border) bg-(--navy-800)/30 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="hidden text-[11px] opacity-30 sm:block">
                                    {resubmitMode
                                        ? "Only changed information will be resubmitted."
                                        : "Make sure your work is ready before submitting."}
                                </p>

                                <div className="flex w-full gap-2 sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={closeSubmitModal}
                                        disabled={submitting}
                                        className="flex-1 rounded-xl border border-(--border) px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={
                                            submitting ||
                                            !isCurrentDay ||
                                            (resubmitMode &&
                                                !hasChanges())
                                        }
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--gold-500) px-4 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
                                    >
                                        {submitting && (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        )}

                                        {resubmitMode
                                            ? "Resubmit Task"
                                            : "Submit Task"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                VIEW MODAL
            ===================================================== */}

            {viewTask && (
                <div
                    className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-black/75 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeViewModal();
                        }
                    }}
                >
                    <div className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--border) bg-(--navy-900) shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
                        {/* HEADER */}

                        <div className="relative shrink-0 border-b border-(--border) bg-(--navy-800)/50 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="absolute left-0 top-0 h-full w-1 bg-(--gold-500)" />

                            <div className="flex min-w-0 items-start justify-between gap-3 pl-2 sm:gap-5">
                                <div className="min-w-0">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />

                                        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-green-300 sm:text-[10px] sm:tracking-[0.2em]">
                                            Submitted Task
                                        </span>
                                    </div>

                                    <h2 className="max-w-2xl break-words text-lg font-semibold leading-tight text-white sm:text-2xl">
                                        {
                                            viewTask.title
                                        }
                                    </h2>

                                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
                                        <span className="inline-flex items-center rounded-lg border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1.5 text-[10px] font-semibold text-(--gold-500) sm:px-2.5 sm:text-[11px]">
                                            {
                                                viewTask.difficulty
                                            }x
                                        </span>

                                        <span className="inline-flex max-w-full items-center gap-1 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                                            <Clock3
                                                size={12}
                                                className="shrink-0"
                                            />

                                            <span className="truncate">
                                                {formatDeadline(
                                                    viewTask.deadline
                                                )}
                                            </span>
                                        </span>

                                        <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                                            <UserRound
                                                size={12}
                                                className="shrink-0"
                                            />

                                            <span className="max-w-[150px] truncate sm:max-w-none">
                                                {viewTask.teacher
                                                    ?.name ||
                                                    viewTask.teacher
                                                        ?.username ||
                                                    "Unknown"}
                                            </span>
                                        </span>

                                        <span className="inline-flex items-center gap-1 rounded-lg border border-green-400/30 bg-green-400/10 px-2 py-1.5 text-[10px] font-medium text-green-300 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                                            <Check
                                                size={12}
                                            />
                                            Submitted
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-medium sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
                                                getSubmissionStatus(
                                                    viewTask
                                                ) ===
                                                "ontime"
                                                    ? "border-green-400/30 bg-green-400/10 text-green-300"
                                                    : "border-red-400/30 bg-red-400/10 text-red-300"
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                    getSubmissionStatus(
                                                        viewTask
                                                    ) ===
                                                    "ontime"
                                                        ? "bg-green-400"
                                                        : "bg-red-400"
                                                }`}
                                            />

                                            {getSubmissionStatus(
                                                viewTask
                                            ) === "ontime"
                                                ? "Ontime"
                                                : "Delayed"}
                                        </span>

                                        {viewTask.isChecked && (
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1.5 text-[10px] font-medium text-(--gold-500) sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                                                <Check
                                                    size={12}
                                                />
                                                Checked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeViewModal}
                                    className="shrink-0 rounded-xl border border-transparent p-2 text-white/40 transition hover:border-(--border) hover:bg-white/5 hover:text-white"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}

                        <div className="scholar-scrollbar min-h-0 max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain px-4 py-5 sm:max-h-[72vh] sm:px-6 sm:py-6">
                            {/* DESCRIPTION */}

                            <section>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                        <FileText size={15} />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Task Description
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Instructions from your teacher
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 rounded-xl border border-(--border) bg-(--navy-800)/40 px-4 py-4 sm:px-5">
                                    <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/65">
                                        {viewTask.description ||
                                            "No description provided."}
                                    </p>
                                </div>
                            </section>

                            {/* STUDENT WORK */}

                            <section className="mt-7 rounded-2xl border border-(--border) bg-(--navy-800)/20 p-3 sm:mt-8 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-green-400/20 bg-green-400/10 text-green-300">
                                            <Paperclip size={16} />
                                        </div>

                                        <div>
                                            <h3 className="font-semibold">
                                                Your Submission
                                            </h3>

                                            <p className="mt-0.5 text-[11px] opacity-40">
                                                Work submitted to your teacher
                                            </p>
                                        </div>
                                    </div>

                                    {getSubmission(
                                        viewTask
                                    ) && (
                                        <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-green-400/20 bg-green-400/5 px-2.5 py-1.5 text-[10px] text-green-300">
                                            <Check size={12} />
                                            Submitted
                                        </span>
                                    )}
                                </div>

                                {getSubmission(
                                    viewTask
                                ) && (
                                    <>
                                        {/* Submission date */}

                                        <div className="mt-4 rounded-lg border border-(--border) bg-(--navy-900)/50 px-3 py-2.5">
                                            <p className="text-[10px] uppercase tracking-wider opacity-30">
                                                Submitted On
                                            </p>

                                            <p className="mt-1 break-words text-xs leading-5 opacity-60">
                                                {formatDateTime(
                                                    getSubmission(
                                                        viewTask
                                                    )!
                                                        .submittedAt
                                                )}
                                            </p>
                                        </div>

                                        {/* Media */}

                                        <div className="mt-5">
                                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                Attached Work
                                            </p>

                                            {getSubmission(
                                                viewTask
                                            )!
                                                .media
                                                .length >
                                            0 ? (
                                                <div className="flex max-w-full flex-wrap gap-2.5 sm:gap-3">
                                                    {getSubmission(
                                                        viewTask
                                                    )!
                                                        .media
                                                        .map(
                                                            (
                                                                media,
                                                                index
                                                            ) =>
                                                                renderMedia(
                                                                    media,
                                                                    index
                                                                )
                                                        )}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-(--border) px-4 py-6 text-center">
                                                    <Paperclip
                                                        size={20}
                                                        className="mx-auto opacity-30"
                                                    />

                                                    <p className="mt-2 text-xs opacity-40">
                                                        No media attached
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Student Note */}

                                        <div className="mt-5">
                                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                Your Note
                                            </p>

                                            {getSubmission(
                                                viewTask
                                            )!
                                                .note ? (
                                                <div className="relative rounded-xl border border-(--gold-500)/15 bg-(--gold-500)/5 px-4 py-4">
                                                    <div className="absolute left-0 top-4 h-8 w-0.5 rounded-full bg-(--gold-500)" />

                                                    <p className="whitespace-pre-wrap break-words pl-3 text-sm leading-6 text-white/65">
                                                        {
                                                            getSubmission(
                                                                viewTask
                                                            )!
                                                                .note
                                                        }
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-(--border) px-4 py-5 text-center text-xs opacity-35">
                                                    No note was added with this
                                                    submission.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </section>

                            {/* TEACHER REVIEW */}

                            <section className="mt-5 rounded-2xl border border-(--border) bg-(--navy-800)/20 p-3 sm:mt-6 sm:p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                            <Check size={16} />
                                        </div>

                                        <div>
                                            <h3 className="font-semibold">
                                                Teacher Review
                                            </h3>

                                            <p className="mt-0.5 text-[11px] opacity-40">
                                                Feedback and evaluation
                                            </p>
                                        </div>
                                    </div>

                                    {viewTask.review && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase tracking-wider opacity-30">
                                                Score
                                            </span>

                                            <span className="rounded-xl border border-(--gold-500)/30 bg-(--gold-500)/10 px-3 py-2 text-sm font-semibold text-(--gold-500)">
                                                {
                                                    viewTask
                                                        .review
                                                        .score
                                                }
                                                <span className="opacity-40">
                                                    /5
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {viewTask.review ? (
                                    <>
                                        {/* Score */}

                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl border border-(--border) bg-(--navy-900)/50 p-4">
                                                <p className="text-[10px] uppercase tracking-wider opacity-30">
                                                    Teacher Rating
                                                </p>

                                                <div className="mt-2 flex items-end gap-1">
                                                    <span className="text-2xl font-semibold text-(--gold-500)">
                                                        {
                                                            viewTask
                                                                .review
                                                                .score
                                                        }
                                                    </span>

                                                    <span className="mb-1 text-sm opacity-30">
                                                        / 5
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-(--gold-500)/20 bg-(--gold-500)/5 p-4">
                                                <p className="text-[10px] uppercase tracking-wider opacity-40">
                                                    Total Score
                                                </p>

                                                <p className="mt-2 text-2xl font-semibold text-(--gold-500)">
                                                    {calculateTotalScore(
                                                        viewTask.difficulty,
                                                        viewTask.review
                                                    )}
                                                </p>

                                                <p className="mt-1 text-[10px] opacity-30">
                                                    Difficulty × teacher score
                                                </p>
                                            </div>
                                        </div>

                                        {/* Teacher note */}

                                        <div className="mt-5">
                                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                Teacher Message
                                            </p>

                                            {viewTask.review.note ? (
                                                <div className="relative rounded-xl border border-(--border) bg-(--navy-900)/50 px-4 py-4">
                                                    <div className="absolute left-0 top-4 h-8 w-0.5 rounded-full bg-(--gold-500)" />

                                                    <p className="whitespace-pre-wrap break-words pl-3 text-sm leading-6 text-white/65">
                                                        {
                                                            viewTask
                                                                .review
                                                                .note
                                                        }
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-(--border) px-4 py-5 text-center text-xs opacity-35">
                                                    No teacher message was
                                                    provided.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-5 rounded-xl border border-dashed border-(--border) bg-(--navy-900)/30 px-4 py-7 text-center sm:px-5 sm:py-8">
                                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-(--border) bg-(--navy-800)">
                                            <Clock3
                                                size={19}
                                                className="opacity-40"
                                            />
                                        </div>

                                        <p className="mt-3 text-sm font-medium opacity-60">
                                            Awaiting Teacher Review
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 opacity-30">
                                            Your submission has been received.
                                            The teacher has not checked this task
                                            yet.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* FOOTER */}

                        <div className="shrink-0 border-t border-(--border) bg-(--navy-800)/30 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="hidden text-[11px] opacity-30 sm:block">
                                    {viewTask.isChecked
                                        ? "Your task has been reviewed by your teacher."
                                        : "You can resubmit your work while the task is active."}
                                </div>

                                <div className="flex w-full gap-2 sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={closeViewModal}
                                        className="flex-1 rounded-xl border border-(--border) px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/5 sm:flex-none sm:px-5"
                                    >
                                        Close
                                    </button>

                                    <button
                                        type="button"
                                        onClick={startResubmit}
                                        disabled={!isCurrentDay}
                                        className="flex-1 rounded-xl bg-(--gold-500) px-4 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:opacity-35 sm:flex-none sm:px-5"
                                    >
                                        Resubmit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                MEDIA PREVIEW
            ====================================================== */}

            {previewMedia && (
                <div
                    className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 p-2 sm:p-4"
                    onMouseDown={(
                        event
                    ) => {
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
                        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-3 text-white transition hover:bg-black/90 sm:right-5 sm:top-5"
                    >
                        <X size={22} />
                    </button>

                    <div className="flex max-h-[95dvh] max-w-[100%] flex-col items-center justify-center">
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
                                className="max-h-[82dvh] max-w-[96vw] rounded-xl object-contain sm:max-h-[85vh] sm:max-w-[90vw]"
                            />
                        ) : isPdf(
                            previewMedia
                        ) ? (
                            <div className="h-[82dvh] w-[96vw] max-w-5xl overflow-hidden rounded-xl bg-white sm:h-[85vh] sm:w-[90vw]">
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
                            <div className="flex h-[50vh] w-[94vw] max-w-3xl flex-col items-center justify-center rounded-2xl border border-white/10 bg-(--navy-900) px-5 text-center sm:w-[60vw]">
                                <FileText
                                    size={56}
                                    className="mb-4 opacity-50 sm:size-16"
                                />

                                <p className="max-w-full break-words text-base font-medium sm:text-lg">
                                    {
                                        previewMedia.fileName
                                    }
                                </p>

                                <p className="mt-2 text-sm opacity-40">
                                    {getFileExtension(
                                        previewMedia.fileName
                                    )}{" "}
                                    file
                                </p>

                                <a
                                    href={
                                        previewMedia.url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 rounded-xl bg-(--gold-500) px-5 py-3 text-sm font-semibold text-(--navy-900)"
                                >
                                    Open File
                                </a>
                            </div>
                        )}

                        <p className="mt-3 max-w-[92vw] truncate text-xs text-white/70 sm:max-w-[90vw] sm:text-sm">
                            {
                                previewMedia.fileName
                            }
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}