
"use client";

import {
    CalendarDays,
    Check,
    Clock3,
    FileText,
    Loader2,
    Paperclip,
    UserRound,
    X,
    ExternalLink,
    MessageSquare,
    Award,
    Tag,
    Mic,
    Play,
    Pause,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type Media = {
    id?: string;
    url: string;
    publicId?: string;
    resourceType: string;
    fileName: string;
    format: string | null;
    bytes?: number | null;
};

/*
 * ============================================================
 * B2 VOICE NOTE
 * ============================================================
 *
 * Voice notes are stored separately from the existing
 * Cloudinary submission.media records.
 *
 * The API may provide a direct `url`. If it does not, the
 * frontend falls back to the storageKey through the voice-note
 * streaming endpoint.
 */
type VoiceNote = {
    id: string;
    submissionId: string;
    storageKey: string;
    mimeType: string;
    fileName: string;
    duration: number | null;
    bytes: number | null;
    createdAt: string;
    url?: string | null;
};

type Submission = {
    id: string;
    note: string | null;
    submittedAt: string;
    updatedAt: string;
    media: Media[];
    voiceNotes?: VoiceNote[];
};

type Teacher = {
    id: string;
    name: string;
    username: string;
};

type Category = {
    id: string;
    name: string;
};

type Review = {
    id: string;
    teacherId: string;

    /*
     * This is the teacher's points out of 5.
     * It is NOT the final score.
     */
    score: number;

    note: string | null;
    checkedAt: string;
    updatedAt: string;
    teacher?: Teacher | null;
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

    /*
     * Existing field retained for compatibility.
     *
     * Displayed final score is calculated from:
     *
     * difficulty × teacher points
     */
    score: number | null;

    date: string;

    teacher?: Teacher | null;

    category?: Category | null;

    submissions?: Submission[];

    review?: Review | null;
};

type DayGroup = {
    date: string;
    label: string;
    tasks: AssignmentTask[];
};

type AssignmentsResponse = {
    groups: DayGroup[];
};

/* ============================================================
   HELPERS
============================================================ */

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

function formatShortDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
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
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

function getLatestSubmission(
    task: AssignmentTask
) {
    const submissions = Array.isArray(
        task.submissions
    )
        ? task.submissions
        : [];

    if (submissions.length === 0) {
        return null;
    }

    return [...submissions].sort(
        (a, b) =>
            new Date(
                b.submittedAt
            ).getTime() -
            new Date(
                a.submittedAt
            ).getTime()
    )[0];
}

function getMediaExtension(
    fileName: string
) {
    const parts =
        fileName.split(".");

    if (parts.length < 2) {
        return "FILE";
    }

    return (
        parts[
            parts.length - 1
        ] || "FILE"
    ).toUpperCase();
}

function isImage(
    media: Media
) {
    if (
        media.resourceType ===
        "image"
    ) {
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
    ].includes(
        format || ""
    );
}

function isPdf(
    media: Media
) {
    return (
        media.resourceType ===
            "pdf" ||
        media.format?.toLowerCase() ===
            "pdf" ||
        media.fileName
            .toLowerCase()
            .endsWith(".pdf")
    );
}

/*
 * Final score calculation.
 *
 * Difficulty is the multiplier.
 * Teacher points are given out of 5.
 *
 * Example:
 * Difficulty = 4
 * Teacher points = 5
 * Total score = 4 × 5 = 20
 * Maximum score = 4 × 5 = 20
 */
function calculateTotalScore(
    difficulty: number,
    teacherPoints: number
) {
    return difficulty * teacherPoints;
}

function calculateMaximumScore(
    difficulty: number
) {
    return difficulty * 5;
}

/*
 * ============================================================
 * VOICE NOTE HELPERS
 * ============================================================
 */

/*
 * Duration can come from B2 as seconds.
 *
 * Example:
 * 95 -> 1:35
 */
function formatDuration(
    duration: number | null | undefined
) {
    if (
        duration === null ||
        duration === undefined ||
        !Number.isFinite(duration) ||
        duration < 0
    ) {
        return "Voice note";
    }

    const totalSeconds =
        Math.floor(duration);

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    return `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
}

function getVoiceNoteUrl(
    voiceNote: VoiceNote
) {
    /*
     * Prefer a URL returned directly by the API.
     */
    if (voiceNote.url) {
        return voiceNote.url;
    }

    /*
     * Fallback to the application's B2 streaming endpoint.
     *
     * This keeps the actual B2 storage key hidden from the
     * browser when the API does not return a direct URL.
     */
    return `/api/student/tasks/voice-notes/${encodeURIComponent(
        voiceNote.id
    )}`;
}

/* ============================================================
   MEDIA PREVIEW CARD
============================================================ */

function MediaPreview({
    media,
    onPreview,
}: {
    media: Media;
    onPreview: (
        media: Media
    ) => void;
}) {
    return (
        <button
            type="button"
            onClick={() =>
                onPreview(media)
            }
            title={media.fileName}
            className="
                group
                relative
                h-32
                w-32
                shrink-0
                overflow-hidden
                rounded-2xl
                border
                border-(--border)
                bg-(--navy-950)
                text-left
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:border-(--gold-500)/60
                hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]
            "
        >
            {isImage(media) ? (
                <img
                    src={media.url}
                    alt={
                        media.fileName
                    }
                    className="
                        h-full
                        w-full
                        object-cover
                        transition
                        duration-300
                        group-hover:scale-105
                    "
                />
            ) : isPdf(
                  media
              ) ? (
                <div
                    className="
                        flex
                        h-full
                        w-full
                        flex-col
                        items-center
                        justify-center
                        gap-3
                    "
                >
                    <div
                        className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            bg-red-400/10
                            text-red-400
                        "
                    >
                        <FileText
                            size={24}
                        />
                    </div>

                    <span
                        className="
                            rounded-md
                            border
                            border-red-400/20
                            bg-red-400/5
                            px-2
                            py-1
                            text-[10px]
                            font-bold
                            tracking-wider
                            text-red-300
                        "
                    >
                        PDF
                    </span>
                </div>
            ) : (
                <div
                    className="
                        flex
                        h-full
                        w-full
                        flex-col
                        items-center
                        justify-center
                        gap-3
                    "
                >
                    <div
                        className="
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-xl
                            bg-(--navy-800)
                        "
                    >
                        <FileText
                            size={23}
                            className="opacity-50"
                        />
                    </div>

                    <span
                        className="
                            rounded-md
                            border
                            border-(--border)
                            px-2
                            py-1
                            text-[10px]
                            font-semibold
                            opacity-50
                        "
                    >
                        {getMediaExtension(
                            media.fileName
                        )}
                    </span>
                </div>
            )}

            <div
                className="
                    absolute
                    inset-x-0
                    bottom-0
                    flex
                    items-center
                    gap-1.5
                    bg-black/80
                    px-2.5
                    py-2
                    text-[10px]
                    text-white
                    opacity-0
                    transition
                    group-hover:opacity-100
                "
            >
                <ExternalLink
                    size={11}
                    className="shrink-0"
                />

                <span className="truncate">
                    {media.fileName}
                </span>
            </div>
        </button>
    );
}

/* ============================================================
   VOICE NOTE PLAYER
============================================================ */

function VoiceNotePlayer({
    voiceNote,
}: {
    voiceNote: VoiceNote;
}) {
    const [isPlaying, setIsPlaying] =
        useState(false);

    const [currentTime, setCurrentTime] =
        useState(0);

    const [audioDuration, setAudioDuration] =
        useState(voiceNote.duration ?? 0);

    const [audioError, setAudioError] =
        useState(false);

    const [voicePlaybackSpeed, setVoicePlaybackSpeed] =
        useState(1);

    const [audioElement, setAudioElement] =
        useState<HTMLAudioElement | null>(null);

    const audioUrl =
        getVoiceNoteUrl(voiceNote);

    useEffect(() => {
        const audio =
            new Audio(audioUrl);

        audio.preload = "metadata";

        const handleLoadedMetadata = () => {
            if (
                Number.isFinite(
                    audio.duration
                )
            ) {
                setAudioDuration(
                    audio.duration
                );
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(
                audio.currentTime
            );
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);

            setCurrentTime(0);

            audio.currentTime = 0;
        };

        const handleError = () => {
            setAudioError(true);

            setIsPlaying(false);
        };

        audio.addEventListener(
            "loadedmetadata",
            handleLoadedMetadata
        );

        audio.addEventListener(
            "timeupdate",
            handleTimeUpdate
        );

        audio.addEventListener(
            "play",
            handlePlay
        );

        audio.addEventListener(
            "pause",
            handlePause
        );

        audio.addEventListener(
            "ended",
            handleEnded
        );

        audio.addEventListener(
            "error",
            handleError
        );

        setAudioElement(audio);

        return () => {
            audio.pause();

            audio.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            );

            audio.removeEventListener(
                "timeupdate",
                handleTimeUpdate
            );

            audio.removeEventListener(
                "play",
                handlePlay
            );

            audio.removeEventListener(
                "pause",
                handlePause
            );

            audio.removeEventListener(
                "ended",
                handleEnded
            );

            audio.removeEventListener(
                "error",
                handleError
            );

            audio.src = "";
        };
    }, [audioUrl]);

    async function togglePlayback() {
        if (
            !audioElement ||
            audioError
        ) {
            return;
        }

        try {
            if (audioElement.paused) {
                await audioElement.play();
            } else {
                audioElement.pause();
            }
        } catch (error) {
            console.error(
                "VOICE NOTE PLAYBACK ERROR:",
                error
            );

            setAudioError(true);
            setIsPlaying(false);
        }
    }

    function handleSeek(
        event: React.MouseEvent<HTMLDivElement>
    ) {
        if (
            !audioElement ||
            !audioDuration
        ) {
            return;
        }

        const rect =
            event.currentTarget.getBoundingClientRect();

        const position = Math.min(
            Math.max(
                event.clientX -
                    rect.left,
                0
            ),
            rect.width
        );

        const newTime =
            (position / rect.width) *
            audioDuration;

        audioElement.currentTime =
            newTime;

        setCurrentTime(newTime);
    }

    function changePlaybackSpeed() {
        const speeds = [
            1,
            1.5,
            2,
            0.5,
        ];

        const currentIndex =
            speeds.indexOf(
                voicePlaybackSpeed
            );

        const nextSpeed =
            speeds[
                (currentIndex + 1) %
                    speeds.length
            ];

        setVoicePlaybackSpeed(
            nextSpeed
        );

        if (audioElement) {
            audioElement.playbackRate =
                nextSpeed;
        }
    }

    function formatVoiceTime(
        seconds: number
    ) {
        if (
            !Number.isFinite(
                seconds
            ) ||
            seconds < 0
        ) {
            return "0:00";
        }

        const minutes =
            Math.floor(
                seconds / 60
            );

        const remainingSeconds =
            Math.floor(
                seconds % 60
            );

        return `${minutes}:${remainingSeconds
            .toString()
            .padStart(2, "0")}`;
    }

    const displayDuration =
        audioDuration ||
        voiceNote.duration ||
        0;

    const progress =
        displayDuration > 0
            ? Math.min(
                  100,
                  Math.max(
                      0,
                      (currentTime /
                          displayDuration) *
                          100
                  )
              )
            : 0;

    return (
        <div
            className="
                flex
                w-full
                items-center
                gap-2.5
                rounded-2xl
                bg-white/[0.08]
                px-2.5
                py-2
                transition
                hover:bg-white/[0.10]
            "
        >
            {/* PLAY BUTTON */}

            <button
                type="button"
                onClick={
                    togglePlayback
                }
                disabled={
                    audioError
                }
                aria-label={
                    isPlaying
                        ? "Pause voice note"
                        : "Play voice note"
                }
                className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-(--gold-500)
                    text-(--navy-900)
                    transition
                    hover:scale-[1.03]
                    active:scale-95
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                "
            >
                {isPlaying ? (
                    <Pause
                        size={15}
                        fill="currentColor"
                    />
                ) : (
                    <Play
                        size={15}
                        fill="currentColor"
                        className="ml-0.5"
                    />
                )}
            </button>

            {/* PLAYER */}

            <div className="min-w-0 flex-1">
                {/* PROGRESS */}

                <div
                    className="
                        relative
                        h-5
                        w-full
                        cursor-pointer
                    "
                    onClick={
                        handleSeek
                    }
                >
                    {/* TRACK */}

                    <div
                        className="
                            absolute
                            left-0
                            right-0
                            top-1/2
                            h-1
                            -translate-y-1/2
                            overflow-hidden
                            rounded-full
                            bg-white/15
                        "
                    >
                        <div
                            className="
                                h-full
                                rounded-full
                                bg-white/80
                                transition-[width]
                                duration-75
                            "
                            style={{
                                width: `${progress}%`,
                            }}
                        />
                    </div>

                    {/* PLAYHEAD */}

                    <div
                        className="
                            absolute
                            top-1/2
                            h-2.5
                            w-2.5
                            -translate-x-1/2
                            -translate-y-1/2
                            rounded-full
                            bg-white
                        "
                        style={{
                            left: `${progress}%`,
                        }}
                    />
                </div>

                {/* TIME */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        leading-none
                    "
                >
                    <span
                        className="
                            text-[9px]
                            tabular-nums
                            text-white/40
                        "
                    >
                        {formatVoiceTime(
                            currentTime
                        )}
                    </span>

                    <span
                        className="
                            text-[9px]
                            tabular-nums
                            text-white/25
                        "
                    >
                        {formatVoiceTime(
                            displayDuration
                        )}
                    </span>
                </div>
            </div>

            {/* SPEED */}

            <button
                type="button"
                onClick={
                    changePlaybackSpeed
                }
                disabled={
                    audioError
                }
                aria-label="Change playback speed"
                className="
                    shrink-0
                    rounded-md
                    px-1.5
                    py-1
                    text-[10px]
                    font-semibold
                    tabular-nums
                    leading-none
                    text-white/55
                    transition
                    hover:bg-white/10
                    hover:text-white
                    active:scale-95
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                "
            >
                {voicePlaybackSpeed}x
            </button>

            {/* MICROPHONE */}

            <div
                className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    text-(--gold-500)
                    opacity-70
                "
            >
                <Mic size={14} />
            </div>

            {/* HIDDEN AUDIO */}

            {audioError && (
                <span className="sr-only">
                    This voice note could not
                    be played.
                </span>
            )}
        </div>
    );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailBox({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div
            className="
                min-w-0
                rounded-2xl
                border
                border-(--border)
                bg-(--navy-950)/50
                px-4
                py-4
                transition
                hover:border-(--gold-500)/20
            "
        >
            <div
                className="
                    flex
                    items-center
                    gap-2
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    opacity-40
                "
            >
                {icon}

                <span>
                    {label}
                </span>
            </div>

            <p
                className="
                    mt-2.5
                    whitespace-normal
                    break-words
                    text-sm
                    font-medium
                    leading-6
                "
                title={value}
            >
                {value}
            </p>
        </div>
    );
}

/* ============================================================
   SECTION HEADER
============================================================ */

function ModalSectionHeader({
    icon,
    eyebrow,
    title,
    description,
}: {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <div
            className="
                flex
                items-start
                gap-3
            "
        >
            <div
                className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-(--border)
                    bg-(--navy-800)
                    text-(--gold-500)
                "
            >
                {icon}
            </div>

            <div className="min-w-0">
                <p
                    className="
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.18em]
                        text-(--gold-500)
                    "
                >
                    {eyebrow}
                </p>

                <h3
                    className="
                        mt-1
                        text-base
                        font-semibold
                    "
                >
                    {title}
                </h3>

                {description && (
                    <p
                        className="
                            mt-1
                            text-xs
                            leading-5
                            opacity-40
                        "
                    >
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   SCORE DISPLAY
============================================================ */

function ScoreDisplay({
    difficulty,
    teacherPoints,
}: {
    difficulty: number;
    teacherPoints: number;
}) {
    const totalScore =
        calculateTotalScore(
            difficulty,
            teacherPoints
        );

    const maximumScore =
        calculateMaximumScore(
            difficulty
        );

    return (
        <div
            className="
                flex
                shrink-0
                items-center
                gap-3
                rounded-2xl
                border
                border-(--gold-500)/25
                bg-(--gold-500)/5
                px-4
                py-3
            "
        >
            <div
                className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    bg-(--gold-500)/10
                    text-(--gold-500)
                "
            >
                <Award
                    size={18}
                />
            </div>

            <div>
                <p
                    className="
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.16em]
                        opacity-40
                    "
                >
                    Total Score
                </p>

                <p
                    className="
                        mt-0.5
                        text-lg
                        font-bold
                        leading-none
                        text-(--gold-500)
                    "
                >
                    {totalScore}

                    <span className="text-xs font-medium opacity-50">
                        /{maximumScore}
                    </span>
                </p>
            </div>
        </div>
    );
}

/* ============================================================
   REVIEW MODAL
============================================================ */

function ReviewModal({
    task,
    onClose,
}: {
    task: AssignmentTask;
    onClose: () => void;
}) {
    const latestSubmission =
        getLatestSubmission(
            task
        );

    const [
        previewMedia,
        setPreviewMedia,
    ] = useState<Media | null>(
        null
    );

    const [
        expandedStudentNote,
        setExpandedStudentNote,
    ] = useState(false);

    const [
        expandedTeacherNote,
        setExpandedTeacherNote,
    ] = useState(false);

    const review =
        task.review ?? null;

    const teacherName =
        task.teacher?.name ||
        task.teacher?.username ||
        "Teacher";

    const categoryName =
        task.category?.name ||
        "Uncategorized";

    const submissionMedia =
        latestSubmission?.media ||
        [];

    const voiceNotes =
        latestSubmission?.voiceNotes ||
        [];

    const teacherPoints =
        review?.score ?? 0;

    const totalScore = review
        ? calculateTotalScore(
              task.difficulty,
              teacherPoints
          )
        : 0;

    const maximumScore =
        calculateMaximumScore(
            task.difficulty
        );

    return (
        <>
            {/* =====================================================
                MAIN MODAL
            ====================================================== */}

            <div
                className="
                    fixed
                    inset-0
                    z-100
                    flex
                    items-start
                    justify-center
                    overflow-y-auto
                    bg-black/80
                    px-2
                    py-2
                    backdrop-blur-sm
                    min-[380px]:px-3
                    min-[380px]:py-4
                    sm:px-5
                    sm:py-8
                    lg:py-10
                "
                onMouseDown={(
                    event
                ) => {
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
                        w-full
                        max-w-5xl
                        overflow-hidden
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        shadow-[0_30px_100px_rgba(0,0,0,0.55)]
                        min-[380px]:rounded-3xl
                    "
                >
                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <header
                        className="
                            relative
                            overflow-hidden
                            border-b
                            border-(--border)
                            bg-(--navy-950)
                        "
                    >
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-20
                                -top-28
                                h-72
                                w-72
                                rounded-full
                                bg-(--gold-500)/8
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                pointer-events-none
                                absolute
                                -bottom-32
                                left-1/3
                                h-64
                                w-64
                                rounded-full
                                bg-(--gold-500)/5
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                relative
                                px-4
                                py-4
                                min-[380px]:px-5
                                min-[380px]:py-5
                                sm:px-7
                                sm:py-6
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-3
                                    min-[380px]:gap-5
                                "
                            >
                                <div className="min-w-0 flex-1">
                                    <div
                                        className="
                                            flex
                                            flex-wrap
                                            items-center
                                            gap-1.5
                                            min-[380px]:gap-2
                                        "
                                    >
                                        <span
                                            className="
                                                inline-flex
                                                max-w-full
                                                items-center
                                                gap-1
                                                rounded-lg
                                                border
                                                border-(--gold-500)/25
                                                bg-(--gold-500)/5
                                                px-2
                                                py-1.5
                                                text-[9px]
                                                font-bold
                                                uppercase
                                                tracking-[0.12em]
                                                text-(--gold-500)
                                                min-[380px]:gap-1.5
                                                min-[380px]:px-2.5
                                                min-[380px]:text-[10px]
                                                min-[380px]:tracking-[0.14em]
                                            "
                                        >
                                            <Check
                                                size={11}
                                            />

                                            Reviewed
                                        </span>

                                        <span
                                            className="
                                                inline-flex
                                                items-center
                                                gap-1
                                                rounded-lg
                                                border
                                                border-(--gold-500)/25
                                                bg-(--gold-500)/5
                                                px-2
                                                py-1.5
                                                text-[9px]
                                                font-bold
                                                tracking-[0.12em]
                                                text-(--gold-500)
                                                min-[380px]:gap-1.5
                                                min-[380px]:text-[10px]
                                                min-[380px]:tracking-[0.14em]
                                            "
                                        >
                                            {
                                                task.difficulty
                                            }x
                                        </span>

                                        {categoryName && (
                                            <span
                                                className="
                                                    inline-flex
                                                    min-w-0
                                                    max-w-full
                                                    items-center
                                                    gap-1
                                                    rounded-lg
                                                    border
                                                    border-(--border)
                                                    bg-(--navy-800)
                                                    px-2
                                                    py-1.5
                                                    text-[9px]
                                                    font-medium
                                                    opacity-60
                                                    min-[380px]:gap-1.5
                                                    min-[380px]:px-2.5
                                                    min-[380px]:text-[10px]
                                                "
                                            >
                                                <Tag
                                                    size={10}
                                                />

                                                <span className="truncate">
                                                    {
                                                        categoryName
                                                    }
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    <h2
                                        className="
                                            mt-3
                                            max-w-3xl
                                            break-words
                                            text-lg
                                            font-semibold
                                            leading-snug
                                            tracking-tight
                                            min-[380px]:mt-4
                                            min-[380px]:text-xl
                                            sm:text-2xl
                                            md:text-3xl
                                        "
                                    >
                                        {
                                            task.title
                                        }
                                    </h2>

                                    <div
                                        className="
                                            mt-2.5
                                            flex
                                            flex-col
                                            items-start
                                            gap-1.5
                                            text-[11px]
                                            opacity-45
                                            min-[380px]:mt-3
                                            min-[380px]:flex-row
                                            min-[380px]:flex-wrap
                                            min-[380px]:items-center
                                            min-[380px]:gap-x-4
                                            min-[380px]:gap-y-2
                                            sm:text-xs
                                        "
                                    >
                                        <span
                                            className="
                                                inline-flex
                                                min-w-0
                                                max-w-full
                                                items-center
                                                gap-1.5
                                            "
                                        >
                                            <UserRound
                                                size={12}
                                                className="shrink-0"
                                            />

                                            <span className="truncate">
                                                {
                                                    teacherName
                                                }
                                            </span>
                                        </span>

                                        {task.deadline && (
                                            <span
                                                className="
                                                    inline-flex
                                                    min-w-0
                                                    max-w-full
                                                    items-start
                                                    gap-1.5
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
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        onClose
                                    }
                                    aria-label="Close review"
                                    className="
                                        shrink-0
                                        rounded-xl
                                        border
                                        border-(--border)
                                        bg-(--navy-900)
                                        p-2
                                        opacity-60
                                        transition
                                        hover:border-(--gold-500)/50
                                        hover:bg-(--navy-800)
                                        hover:text-(--gold-500)
                                        hover:opacity-100
                                        min-[380px]:p-2.5
                                    "
                                >
                                    <X
                                        size={18}
                                    />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* =================================================
                        CONTENT
                    ================================================= */}

                    <div
                        className="
                            scholar-scrollbar
                            max-h-[calc(100vh-145px)]
                            overflow-y-auto
                            px-3
                            py-4
                            min-[380px]:px-4
                            min-[380px]:py-5
                            sm:max-h-[76vh]
                            sm:px-7
                            sm:py-7
                        "
                    >
                        {/* =================================================
                            DESCRIPTION
                        ================================================= */}

                        <section
                            className="
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-950)/35
                                p-3.5
                                min-[380px]:rounded-2xl
                                min-[380px]:p-5
                                sm:p-6
                            "
                        >
                            <ModalSectionHeader
                                icon={
                                    <FileText
                                        size={17}
                                    />
                                }
                                eyebrow="Assignment"
                                title="Description"
                            />

                            <div
                                className="
                                    mt-4
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    px-3.5
                                    py-3.5
                                    min-[380px]:mt-5
                                    min-[380px]:px-4
                                    min-[380px]:py-4
                                "
                            >
                                <p
                                    className="
                                        whitespace-pre-wrap
                                        break-words
                                        text-sm
                                        leading-6
                                        opacity-65
                                        min-[380px]:leading-7
                                    "
                                >
                                    {task.description ||
                                        "No description provided."}
                                </p>
                            </div>
                        </section>

                        {/* =================================================
                            ASSIGNMENT DETAILS
                        ================================================= */}

                        <section
                            className="
                                mt-4
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-950)/35
                                p-3.5
                                min-[380px]:mt-5
                                min-[380px]:rounded-2xl
                                min-[380px]:p-5
                                sm:p-6
                            "
                        >
                            <ModalSectionHeader
                                icon={
                                    <CalendarDays
                                        size={17}
                                    />
                                }
                                eyebrow="Overview"
                                title="Assignment Details"
                            />

                            <div
                                className="
                                    mt-4
                                    grid
                                    grid-cols-1
                                    gap-2.5
                                    min-[380px]:mt-5
                                    min-[380px]:gap-3
                                    sm:grid-cols-2
                                    lg:grid-cols-3
                                "
                            >
                                <DetailBox
                                    icon={
                                        <UserRound
                                            size={14}
                                        />
                                    }
                                    label="Teacher"
                                    value={
                                        teacherName
                                    }
                                />

                                <DetailBox
                                    icon={
                                        <Clock3
                                            size={14}
                                        />
                                    }
                                    label="Submitted"
                                    value={
                                        latestSubmission
                                            ? formatDateTime(
                                                  latestSubmission.submittedAt
                                              )
                                            : "Not submitted"
                                    }
                                />

                                <DetailBox
                                    icon={
                                        <Check
                                            size={14}
                                        />
                                    }
                                    label="Checked"
                                    value={
                                        review
                                            ? formatDateTime(
                                                  review.checkedAt
                                              )
                                            : "Not checked"
                                    }
                                />
                            </div>
                        </section>

                        {/* =================================================
                            STUDENT SUBMISSION MEDIA
                        ================================================= */}

                        <section
                            className="
                                mt-4
                                overflow-hidden
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-950)/35
                                min-[380px]:mt-5
                                min-[380px]:rounded-2xl
                            "
                        >
                            <div
                                className="
                                    border-b
                                    border-(--border)
                                    px-3.5
                                    py-4
                                    min-[380px]:px-5
                                    min-[380px]:py-5
                                    sm:px-6
                                "
                            >
                                <ModalSectionHeader
                                    icon={
                                        <Paperclip
                                            size={17}
                                        />
                                    }
                                    eyebrow="Submission"
                                    title="Your Work"
                                    description={
                                        latestSubmission
                                            ? `Submitted ${formatDateTime(
                                                  latestSubmission.submittedAt
                                              )}`
                                            : "No submission found."
                                    }
                                />
                            </div>

                            <div
                                className="
                                    px-3.5
                                    py-4
                                    min-[380px]:px-5
                                    min-[380px]:py-5
                                    sm:px-6
                                "
                            >
                                {submissionMedia.length >
                                0 ? (
                                    <>
                                        <div
                                            className="
                                                mb-3
                                                flex
                                                flex-col
                                                items-start
                                                gap-1.5
                                                min-[380px]:mb-4
                                                min-[380px]:flex-row
                                                min-[380px]:items-center
                                                min-[380px]:justify-between
                                                min-[380px]:gap-3
                                            "
                                        >
                                            <p
                                                className="
                                                    text-xs
                                                    font-medium
                                                    opacity-45
                                                "
                                            >
                                                {
                                                    submissionMedia.length
                                                }{" "}
                                                {submissionMedia.length ===
                                                1
                                                    ? "file"
                                                    : "files"}{" "}
                                                attached
                                            </p>

                                            <p
                                                className="
                                                    text-[9px]
                                                    uppercase
                                                    tracking-[0.12em]
                                                    opacity-25
                                                    min-[380px]:text-[10px]
                                                    min-[380px]:tracking-[0.15em]
                                                "
                                            >
                                                Click to preview
                                            </p>
                                        </div>

                                        <div
                                            className="
                                                grid
                                                grid-cols-2
                                                gap-2.5
                                                min-[480px]:flex
                                                min-[480px]:flex-wrap
                                                min-[480px]:gap-3
                                            "
                                        >
                                            {submissionMedia.map(
                                                (
                                                    media
                                                ) => (
                                                    <div
                                                        key={
                                                            media.id ||
                                                            media.url
                                                        }
                                                        className="
                                                            min-w-0
                                                        "
                                                    >
                                                        <MediaPreview
                                                            media={
                                                                media
                                                            }
                                                            onPreview={
                                                                setPreviewMedia
                                                            }
                                                        />
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-dashed
                                            border-(--border)
                                            px-3
                                            py-8
                                            text-center
                                            min-[380px]:px-5
                                            min-[380px]:py-10
                                        "
                                    >
                                        <div
                                            className="
                                                mx-auto
                                                flex
                                                h-10
                                                w-10
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-(--navy-800)
                                                min-[380px]:h-11
                                                min-[380px]:w-11
                                            "
                                        >
                                            <Paperclip
                                                size={18}
                                                className="opacity-35"
                                            />
                                        </div>

                                        <p
                                            className="
                                                mt-3
                                                text-sm
                                                opacity-45
                                            "
                                        >
                                            No media attached
                                        </p>

                                        <p
                                            className="
                                                mt-1
                                                text-xs
                                                leading-5
                                                opacity-25
                                            "
                                        >
                                            This submission
                                            contains no uploaded
                                            files.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* =================================================
                            VOICE NOTES
                        ================================================= */}

                        {voiceNotes.length > 0 && (
                            <section
                                className="
                                    mt-4
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-950)/35
                                    min-[380px]:mt-5
                                    min-[380px]:rounded-2xl
                                "
                            >
                                <div
                                    className="
                                        border-b
                                        border-(--border)
                                        px-3.5
                                        py-4
                                        min-[380px]:px-5
                                        min-[380px]:py-5
                                        sm:px-6
                                    "
                                >
                                    <ModalSectionHeader
                                        icon={
                                            <Mic
                                                size={17}
                                            />
                                        }
                                        eyebrow="Submission"
                                        title="Voice Notes"
                                        description={`${voiceNotes.length} ${
                                            voiceNotes.length ===
                                            1
                                                ? "voice note"
                                                : "voice notes"
                                        } attached to this submission.`}
                                    />
                                </div>

                                <div
                                    className="
                                        space-y-2.5
                                        px-3.5
                                        py-4
                                        min-[380px]:space-y-3
                                        min-[380px]:px-5
                                        min-[380px]:py-5
                                        sm:px-6
                                    "
                                >
                                    {voiceNotes.map(
                                        (
                                            voiceNote
                                        ) => (
                                            <VoiceNotePlayer
                                                key={
                                                    voiceNote.id
                                                }
                                                voiceNote={
                                                    voiceNote
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                        {/* =================================================
                            STUDENT NOTE
                        ================================================= */}

                        <section
                            className="
                                mt-4
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-950)/35
                                p-3.5
                                min-[380px]:mt-5
                                min-[380px]:rounded-2xl
                                min-[380px]:p-5
                                sm:p-6
                            "
                        >
                            <ModalSectionHeader
                                icon={
                                    <MessageSquare
                                        size={17}
                                    />
                                }
                                eyebrow="Submission"
                                title="Your Note"
                                description="Message included with your submission."
                            />

                            <div
                                className="
                                    mt-4
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    px-3.5
                                    py-3.5
                                    min-[380px]:mt-5
                                    min-[380px]:px-5
                                    min-[380px]:py-4
                                "
                            >
                                <div className="relative">
                                    <p
                                        className={`
                                            whitespace-pre-wrap
                                            break-words
                                            text-sm
                                            leading-6
                                            opacity-65
                                            min-[380px]:leading-7
                                            ${
                                                expandedStudentNote
                                                    ? ""
                                                    : "line-clamp-5"
                                            }
                                        `}
                                    >
                                        {latestSubmission?.note ||
                                            "No submission note provided."}
                                    </p>

                                    {latestSubmission?.note &&
                                        latestSubmission.note
                                            .split(
                                                "\n"
                                            )
                                            .length >
                                            5 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedStudentNote(
                                                        (
                                                            value
                                                        ) =>
                                                            !value
                                                    )
                                                }
                                                className="
                                                    mt-3
                                                    min-h-9
                                                    text-xs
                                                    font-semibold
                                                    text-(--gold-500)
                                                    transition
                                                    hover:opacity-75
                                                "
                                            >
                                                {expandedStudentNote
                                                    ? "Show less"
                                                    : "Read full note"}
                                            </button>
                                        )}
                                </div>
                            </div>
                        </section>

                        {/* =================================================
                            TEACHER REVIEW
                        ================================================= */}

                        <section
                            className="
                                mt-4
                                overflow-hidden
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-950)/35
                                min-[380px]:mt-5
                                min-[380px]:rounded-2xl
                            "
                        >
                            <div
                                className="
                                    border-b
                                    border-(--border)
                                    px-3.5
                                    py-4
                                    min-[380px]:px-5
                                    min-[380px]:py-5
                                    sm:px-6
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
                                    <div className="min-w-0 flex-1">
                                        <ModalSectionHeader
                                            icon={
                                                <Award
                                                    size={17}
                                                />
                                            }
                                            eyebrow="Feedback"
                                            title="Teacher Review"
                                            description={
                                                review
                                                    ? `Reviewed ${formatDateTime(
                                                          review.checkedAt
                                                      )}`
                                                    : "Your teacher has not reviewed this assignment yet."
                                            }
                                        />
                                    </div>

                                    {review && (
                                        <div className="w-full shrink-0 sm:w-auto">
                                            <ScoreDisplay
                                                difficulty={
                                                    task.difficulty
                                                }
                                                teacherPoints={
                                                    review.score
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                className="
                                    px-3.5
                                    py-4
                                    min-[380px]:px-5
                                    min-[380px]:py-5
                                    sm:px-6
                                "
                            >
                                {review ? (
                                    <div className="space-y-3 min-[380px]:space-y-4">
                                        {/* SCORE BREAKDOWN */}

                                        <div
                                            className="
                                                grid
                                                grid-cols-1
                                                gap-2.5
                                                min-[380px]:gap-3
                                                sm:grid-cols-3
                                            "
                                        >
                                            <div
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-(--border)
                                                    bg-(--navy-900)
                                                    px-3.5
                                                    py-3.5
                                                    min-[380px]:px-4
                                                    min-[380px]:py-4
                                                "
                                            >
                                                <p
                                                    className="
                                                        text-[9px]
                                                        font-semibold
                                                        uppercase
                                                        tracking-[0.13em]
                                                        opacity-35
                                                        min-[380px]:text-[10px]
                                                        min-[380px]:tracking-[0.15em]
                                                    "
                                                >
                                                    Difficulty
                                                </p>

                                                <p
                                                    className="
                                                        mt-1.5
                                                        text-lg
                                                        font-bold
                                                        text-(--gold-500)
                                                        min-[380px]:mt-2
                                                    "
                                                >
                                                    {
                                                        task.difficulty
                                                    }x
                                                </p>
                                            </div>

                                            <div
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-(--border)
                                                    bg-(--navy-900)
                                                    px-3.5
                                                    py-3.5
                                                    min-[380px]:px-4
                                                    min-[380px]:py-4
                                                "
                                            >
                                                <p
                                                    className="
                                                        text-[9px]
                                                        font-semibold
                                                        uppercase
                                                        tracking-[0.13em]
                                                        opacity-35
                                                        min-[380px]:text-[10px]
                                                        min-[380px]:tracking-[0.15em]
                                                    "
                                                >
                                                    Teacher Points
                                                </p>

                                                <p
                                                    className="
                                                        mt-1.5
                                                        text-lg
                                                        font-bold
                                                        text-(--gold-500)
                                                        min-[380px]:mt-2
                                                    "
                                                >
                                                    {
                                                        teacherPoints
                                                    }

                                                    <span className="text-xs font-medium opacity-50">
                                                        /5
                                                    </span>
                                                </p>
                                            </div>

                                            <div
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-(--gold-500)/20
                                                    bg-(--gold-500)/5
                                                    px-3.5
                                                    py-3.5
                                                    min-[380px]:px-4
                                                    min-[380px]:py-4
                                                "
                                            >
                                                <p
                                                    className="
                                                        text-[9px]
                                                        font-semibold
                                                        uppercase
                                                        tracking-[0.13em]
                                                        text-(--gold-500)
                                                        opacity-70
                                                        min-[380px]:text-[10px]
                                                        min-[380px]:tracking-[0.15em]
                                                    "
                                                >
                                                    Total Score
                                                </p>

                                                <p
                                                    className="
                                                        mt-1.5
                                                        text-lg
                                                        font-bold
                                                        text-(--gold-500)
                                                        min-[380px]:mt-2
                                                    "
                                                >
                                                    {
                                                        totalScore
                                                    }
                                                </p>

                                                <p
                                                    className="
                                                        mt-1
                                                        text-[9px]
                                                        leading-4
                                                        opacity-35
                                                        min-[380px]:text-[10px]
                                                    "
                                                >
                                                    Difficulty ×
                                                    Teacher Points
                                                </p>
                                            </div>
                                        </div>

                                        {/* REVIEWER */}

                                        <div
                                            className="
                                                flex
                                                min-w-0
                                                items-center
                                                gap-2.5
                                                rounded-xl
                                                border
                                                border-(--border)
                                                bg-(--navy-900)
                                                px-3.5
                                                py-3
                                                min-[380px]:gap-3
                                                min-[380px]:px-4
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    h-9
                                                    w-9
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    border
                                                    border-(--gold-500)/20
                                                    bg-(--gold-500)/5
                                                    text-(--gold-500)
                                                "
                                            >
                                                <UserRound
                                                    size={16}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className="
                                                        text-[9px]
                                                        font-semibold
                                                        uppercase
                                                        tracking-[0.13em]
                                                        opacity-35
                                                        min-[380px]:text-[10px]
                                                        min-[380px]:tracking-[0.15em]
                                                    "
                                                >
                                                    Reviewed by
                                                </p>

                                                <p
                                                    className="
                                                        mt-0.5
                                                        truncate
                                                        text-sm
                                                        font-medium
                                                    "
                                                >
                                                    {review
                                                        .teacher
                                                        ?.name ||
                                                        teacherName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* TEACHER NOTE */}

                                        <div
                                            className="
                                                rounded-xl
                                                border
                                                border-(--border)
                                                bg-(--navy-900)
                                                px-3.5
                                                py-4
                                                min-[380px]:px-5
                                                min-[380px]:py-5
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                    text-(--gold-500)
                                                "
                                            >
                                                <MessageSquare
                                                    size={14}
                                                />

                                                <p
                                                    className="
                                                        text-[9px]
                                                        font-bold
                                                        uppercase
                                                        tracking-[0.14em]
                                                        min-[380px]:text-[10px]
                                                        min-[380px]:tracking-[0.16em]
                                                    "
                                                >
                                                    Teacher Message
                                                </p>
                                            </div>

                                            <div className="relative mt-3 min-[380px]:mt-4">
                                                <p
                                                    className={`
                                                        whitespace-pre-wrap
                                                        break-words
                                                        text-sm
                                                        leading-6
                                                        opacity-70
                                                        min-[380px]:leading-7
                                                        ${
                                                            expandedTeacherNote
                                                                ? ""
                                                                : "line-clamp-5"
                                                        }
                                                    `}
                                                >
                                                    {review.note ||
                                                        "No teacher note provided."}
                                                </p>

                                                {review.note &&
                                                    review.note
                                                        .split(
                                                            "\n"
                                                        )
                                                        .length >
                                                        5 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedTeacherNote(
                                                                    (
                                                                        value
                                                                    ) =>
                                                                        !value
                                                                )
                                                            }
                                                            className="
                                                                mt-3
                                                                min-h-9
                                                                text-xs
                                                                font-semibold
                                                                text-(--gold-500)
                                                                transition
                                                                hover:opacity-75
                                                            "
                                                        >
                                                            {expandedTeacherNote
                                                                ? "Show less"
                                                                : "Read full message"}
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-dashed
                                            border-(--border)
                                            px-3.5
                                            py-8
                                            text-center
                                            min-[380px]:px-5
                                            min-[380px]:py-10
                                        "
                                    >
                                        <div
                                            className="
                                                mx-auto
                                                flex
                                                h-11
                                                w-11
                                                items-center
                                                justify-center
                                                rounded-2xl
                                                bg-(--navy-800)
                                                min-[380px]:h-12
                                                min-[380px]:w-12
                                            "
                                        >
                                            <Clock3
                                                size={20}
                                                className="opacity-30"
                                            />
                                        </div>

                                        <p
                                            className="
                                                mt-3
                                                text-sm
                                                font-medium
                                                opacity-50
                                                min-[380px]:mt-4
                                            "
                                        >
                                            Waiting for teacher
                                            review
                                        </p>

                                        <p
                                            className="
                                                mx-auto
                                                mt-1
                                                max-w-sm
                                                text-xs
                                                leading-5
                                                opacity-30
                                            "
                                        >
                                            Your submission has
                                            been received, but
                                            feedback has not been
                                            added yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <footer
                        className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            border-t
                            border-(--border)
                            bg-(--navy-950)/50
                            px-3.5
                            py-3
                            min-[380px]:px-5
                            min-[380px]:py-4
                            sm:px-7
                        "
                    >
                        <p
                            className="
                                hidden
                                text-xs
                                opacity-30
                                sm:block
                            "
                        >
                            Assignment review
                        </p>

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            className="
                                ml-auto
                                min-h-10
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                px-4
                                py-2.5
                                text-sm
                                font-medium
                                transition
                                hover:border-(--gold-500)/50
                                hover:text-(--gold-500)
                                min-[380px]:px-5
                            "
                        >
                            Close
                        </button>
                    </footer>
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
                        overflow-auto
                        bg-black/90
                        p-2
                        backdrop-blur-sm
                        min-[380px]:p-4
                    "
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
                        aria-label="Close media preview"
                        className="
                            absolute
                            right-3
                            top-3
                            z-10
                            rounded-xl
                            border
                            border-white/10
                            bg-black/60
                            p-2.5
                            text-white
                            transition
                            hover:bg-white/10
                            min-[380px]:right-5
                            min-[380px]:top-5
                            min-[380px]:p-3
                        "
                    >
                        <X size={20} />
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
                                max-h-[88vh]
                                max-w-[96vw]
                                rounded-xl
                                object-contain
                                shadow-2xl
                                min-[380px]:max-w-[92vw]
                                min-[380px]:rounded-2xl
                            "
                        />
                    ) : isPdf(
                          previewMedia
                      ) ? (
                        <div
                            className="
                                h-[82vh]
                                w-[96vw]
                                overflow-hidden
                                rounded-xl
                                border
                                border-white/10
                                bg-white
                                shadow-2xl
                                min-[380px]:h-[85vh]
                                min-[380px]:w-[94vw]
                                min-[480px]:w-[90vw]
                                sm:max-w-5xl
                                min-[380px]:rounded-2xl
                            "
                        >
                            <iframe
                                src={`/api/student/tasks/pdf-preview?url=${encodeURIComponent(
                                    previewMedia.url
                                )}`}
                                title={
                                    previewMedia.fileName
                                }
                                className="
                                    h-full
                                    w-full
                                    border-0
                                "
                            />
                        </div>
                    ) : (
                        <div
                            className="
                                w-full
                                max-w-md
                                rounded-xl
                                border
                                border-white/10
                                bg-(--navy-900)
                                p-5
                                text-center
                                shadow-2xl
                                min-[380px]:rounded-2xl
                                min-[380px]:p-8
                            "
                        >
                            <div
                                className="
                                    mx-auto
                                    flex
                                    h-14
                                    w-14
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    bg-(--navy-800)
                                    min-[380px]:h-16
                                    min-[380px]:w-16
                                "
                            >
                                <FileText
                                    size={28}
                                    className="opacity-40"
                                />
                            </div>

                            <p
                                className="
                                    mt-4
                                    break-words
                                    text-sm
                                    font-medium
                                    text-white
                                    min-[380px]:mt-5
                                    min-[380px]:text-base
                                "
                            >
                                {
                                    previewMedia.fileName
                                }
                            </p>

                            <p
                                className="
                                    mt-2
                                    text-xs
                                    text-white/40
                                "
                            >
                                {
                                    getMediaExtension(
                                        previewMedia.fileName
                                    )
                                }{" "}
                                file
                            </p>

                            <a
                                href={
                                    previewMedia.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    mt-5
                                    inline-flex
                                    min-h-11
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-(--gold-500)
                                    px-4
                                    py-3
                                    text-sm
                                    font-semibold
                                    text-(--navy-900)
                                    transition
                                    hover:opacity-90
                                    min-[380px]:mt-6
                                    min-[380px]:px-5
                                "
                            >
                                <ExternalLink
                                    size={15}
                                />

                                Open File
                            </a>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

/* ================================================================
   ASSIGNMENTS PAGE
================================================================ */

export default function StudentAssignmentsPage() {
    const [
        data,
        setData,
    ] =
        useState<AssignmentsResponse>({
            groups: [],
        });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        selectedTask,
        setSelectedTask,
    ] =
        useState<AssignmentTask | null>(
            null
        );

    /*
     * Tasks that have been opened at least once.
     *
     * First opening:
     *     Review
     *
     * Subsequent opening:
     *     View
     */
    const [
        viewedTasks,
        setViewedTasks,
    ] =
        useState<Set<string>>(
            new Set()
        );

    useEffect(() => {
        try {
            const stored =
                window.localStorage.getItem(
                    "student-assignment-viewed"
                );

            if (!stored) {
                return;
            }

            const parsed =
                JSON.parse(stored);

            if (
                Array.isArray(
                    parsed
                )
            ) {
                setViewedTasks(
                    new Set(
                        parsed.filter(
                            (
                                item
                            ): item is string =>
                                typeof item ===
                                "string"
                        )
                    )
                );
            }
        } catch (error) {
            console.error(
                "Failed to read viewed assignment state:",
                error
            );
        }
    }, []);

    async function loadAssignments() {
        try {
            setLoading(true);
            setError("");

            const response =
                await fetch(
                    "/api/student/assignments",
                    {
                        method: "GET",
                        cache: "no-store",
                        credentials:
                            "include",
                    }
                );

            const result =
                await response.json();

            if (
                !response.ok
            ) {
                throw new Error(
                    result?.message ||
                        "Failed to load assignments."
                );
            }

            setData({
                groups: Array.isArray(
                    result?.groups
                )
                    ? result.groups
                    : [],
            });
        } catch (
            error
        ) {
            console.error(
                "LOAD STUDENT ASSIGNMENTS ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load assignments."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAssignments();
    }, []);

    /*
     * Only currently reviewed assignments
     * are displayed.
     *
     * The grouping date comes from the
     * CURRENT review.
     */
    const groups =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    AssignmentTask[]
                >();

            for (const group of data.groups) {
                if (
                    !Array.isArray(
                        group.tasks
                    )
                ) {
                    continue;
                }

                for (const task of group.tasks) {
                    if (
                        !task.review
                    ) {
                        continue;
                    }

                    const reviewDate =
                        new Date(
                            task
                                .review
                                .checkedAt
                        );

                    if (
                        Number.isNaN(
                            reviewDate.getTime()
                        )
                    ) {
                        continue;
                    }

                    /*
                     * Use Pakistan local date rather than
                     * UTC date so assignments do not move
                     * to the wrong calendar day.
                     */
                    const dateKey =
                        new Intl.DateTimeFormat(
                            "en-CA",
                            {
                                timeZone:
                                    "Asia/Karachi",
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                            }
                        ).format(
                            reviewDate
                        );

                    const existing =
                        map.get(
                            dateKey
                        ) || [];

                    existing.push(
                        task
                    );

                    map.set(
                        dateKey,
                        existing
                    );
                }
            }

            return Array.from(
                map.entries()
            )
                .sort(
                    (
                        [a],
                        [b]
                    ) =>
                        new Date(
                            b
                        ).getTime() -
                        new Date(
                            a
                        ).getTime()
                )
                .map(
                    ([
                        date,
                        tasks,
                    ]) => ({
                        date,
                        label: formatDate(
                            tasks[0]
                                .review!
                                .checkedAt
                        ),
                        tasks:
                            tasks.sort(
                                (
                                    a,
                                    b
                                ) =>
                                    new Date(
                                        b
                                            .review!
                                            .checkedAt
                                    ).getTime() -
                                    new Date(
                                        a
                                            .review!
                                            .checkedAt
                                    ).getTime()
                            ),
                    })
                );
        }, [data.groups]);

    function markAsViewed(
        taskId: string
    ) {
        setViewedTasks(
            (current) => {
                if (
                    current.has(
                        taskId
                    )
                ) {
                    return current;
                }

                const next =
                    new Set(
                        current
                    );

                next.add(
                    taskId
                );

                try {
                    window.localStorage.setItem(
                        "student-assignment-viewed",
                        JSON.stringify(
                            Array.from(
                                next
                            )
                        )
                    );
                } catch (
                    error
                ) {
                    console.error(
                        "Failed to save viewed assignment state:",
                        error
                    );
                }

                return next;
            }
        );
    }

    function openTask(
        task: AssignmentTask
    ) {
        markAsViewed(
            task.id
        );

        setSelectedTask(
            task
        );
    }

    return (
        <main
            className="
                min-w-0
                space-y-6
                overflow-x-hidden
                p-3
                xs:p-4
                sm:space-y-8
                sm:p-6
                md:p-8
            "
        >
            {/* =====================================================
                PAGE HEADER
            ====================================================== */}

            <div className="min-w-0">
                <p
                    className="
                        mb-1.5
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.22em]
                        text-(--gold-400)
                        sm:mb-2
                        sm:text-xs
                        sm:tracking-[0.3em]
                    "
                >
                    Student Portal
                </p>

                <h1
                    className="
                        mt-1
                        break-words
                        font-heading
                        text-3xl
                        font-bold
                        leading-tight
                        tracking-wide
                        text-white
                        sm:mt-2
                        sm:text-4xl
                        md:text-5xl
                    "
                >
                    Assignments
                </h1>

                <p
                    className="
                        mt-2
                        max-w-2xl
                        text-xs
                        leading-5
                        opacity-55
                        sm:text-sm
                        sm:leading-6
                    "
                >
                    Review your checked assignments
                    and teacher feedback.
                </p>
            </div>

            {/* =====================================================
                ERROR
            ====================================================== */}

            {error && (
                <div
                    className="
                        flex
                        flex-col
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-red-400/30
                        bg-red-400/5
                        px-3.5
                        py-3
                        text-xs
                        text-red-300
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        sm:gap-4
                        sm:px-4
                        sm:text-sm
                    "
                >
                    <span className="min-w-0 break-words">
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError(
                                ""
                            )
                        }
                        className="
                            shrink-0
                            self-end
                            rounded-lg
                            p-1
                            transition
                            hover:bg-red-400/10
                            sm:self-auto
                        "
                    >
                        <X
                            size={16}
                        />
                    </button>
                </div>
            )}

            {/* =====================================================
                LOADING
            ====================================================== */}

            {loading ? (
                <div
                    className="
                        flex
                        min-h-32
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        p-8
                        sm:min-h-40
                        sm:p-14
                    "
                >
                    <Loader2
                        size={23}
                        className="
                            animate-spin
                            opacity-50
                            sm:size-[25px]
                        "
                    />
                </div>
            ) : groups.length ===
              0 ? (
                <div
                    className="
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-5
                        py-12
                        text-center
                        sm:p-14
                    "
                >
                    <div
                        className="
                            mx-auto
                            flex
                            h-11
                            w-11
                            items-center
                            justify-center
                            rounded-2xl
                            bg-(--navy-800)
                            sm:h-12
                            sm:w-12
                        "
                    >
                        <Check
                            size={22}
                            className="opacity-30"
                        />
                    </div>

                    <p
                        className="
                            mt-4
                            text-xs
                            opacity-50
                            sm:text-sm
                        "
                    >
                        No reviewed assignments
                        yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-7 sm:space-y-10">
                    {groups.map(
                        (
                            group
                        ) => (
                            <section
                                key={
                                    group.date
                                }
                                className="space-y-3 sm:space-y-4"
                            >
                                {/* DATE HEADER */}

                                <div
                                    className="
                                        flex
                                        min-w-0
                                        items-center
                                        gap-2.5
                                        sm:gap-3
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            border
                                            border-(--gold-500)/20
                                            bg-(--gold-500)/5
                                            text-(--gold-500)
                                            sm:h-10
                                            sm:w-10
                                        "
                                    >
                                        <CalendarDays
                                            size={
                                                16
                                            }
                                        />
                                    </div>

                                    <div className="min-w-0">
                                        <h2
                                            className="
                                                truncate
                                                text-sm
                                                font-semibold
                                                sm:text-base
                                            "
                                        >
                                            {
                                                group.label
                                            }
                                        </h2>

                                        <p
                                            className="
                                                mt-0.5
                                                text-[10px]
                                                opacity-35
                                                sm:mt-1
                                                sm:text-xs
                                            "
                                        >
                                            {
                                                group.tasks
                                                    .length
                                            }{" "}
                                            {group
                                                .tasks
                                                .length ===
                                            1
                                                ? "assignment"
                                                : "assignments"}{" "}
                                            checked
                                        </p>
                                    </div>
                                </div>

                                {/* TASKS */}

                                <div className="space-y-2.5 sm:space-y-3">
                                    {group.tasks.map(
                                        (
                                            task
                                        ) => {
                                            const viewed =
                                                viewedTasks.has(
                                                    task.id
                                                );

                                            const teacherPoints =
                                                task
                                                    .review
                                                    ?.score ??
                                                0;

                                            const totalScore =
                                                task.review
                                                    ? calculateTotalScore(
                                                          task.difficulty,
                                                          teacherPoints
                                                      )
                                                    : 0;

                                            const maximumScore =
                                                calculateMaximumScore(
                                                    task.difficulty
                                                );

                                            return (
                                                <article
                                                    key={
                                                        task.id
                                                    }
                                                    className="
                                                        group
                                                        min-w-0
                                                        overflow-hidden
                                                        rounded-2xl
                                                        border
                                                        border-(--border)
                                                        bg-(--navy-900)
                                                        transition-all
                                                        duration-200
                                                        hover:border-(--gold-500)/40
                                                        hover:shadow-[0_10px_35px_rgba(0,0,0,0.15)]
                                                    "
                                                >
                                                    <div
                                                        className="
                                                            flex
                                                            min-w-0
                                                            flex-col
                                                            gap-4
                                                            px-4
                                                            py-4
                                                            sm:gap-5
                                                            sm:px-5
                                                            sm:py-5
                                                            xl:flex-row
                                                            xl:items-center
                                                            xl:justify-between
                                                        "
                                                    >
                                                        {/* TASK INFO */}

                                                        <div className="min-w-0 flex-1">
                                                            <div
                                                                className="
                                                                    flex
                                                                    min-w-0
                                                                    flex-wrap
                                                                    items-center
                                                                    gap-1.5
                                                                    sm:gap-2
                                                                "
                                                            >
                                                                <h3
                                                                    className="
                                                                        min-w-0
                                                                        max-w-full
                                                                        flex-1
                                                                        truncate
                                                                        text-sm
                                                                        font-semibold
                                                                        sm:flex-none
                                                                        sm:text-base
                                                                    "
                                                                    title={
                                                                        task.title
                                                                    }
                                                                >
                                                                    {
                                                                        task.title
                                                                    }
                                                                </h3>

                                                                {task
                                                                    .category
                                                                    ?.name && (
                                                                    <span
                                                                        className="
                                                                            inline-flex
                                                                            max-w-full
                                                                            min-w-0
                                                                            items-center
                                                                            gap-1
                                                                            rounded-lg
                                                                            border
                                                                            border-(--border)
                                                                            bg-(--navy-800)
                                                                            px-2
                                                                            py-1
                                                                            text-[9px]
                                                                            font-medium
                                                                            opacity-60
                                                                            sm:gap-1.5
                                                                            sm:px-2.5
                                                                            sm:text-[10px]
                                                                        "
                                                                    >
                                                                        <Tag
                                                                            size={
                                                                                9
                                                                            }
                                                                        />

                                                                        <span className="max-w-28 truncate sm:max-w-none">
                                                                            {
                                                                                task
                                                                                    .category
                                                                                    .name
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                )}

                                                                <span
                                                                    className="
                                                                        inline-flex
                                                                        shrink-0
                                                                        items-center
                                                                        gap-1
                                                                        rounded-lg
                                                                        border
                                                                        border-(--gold-500)/25
                                                                        bg-(--gold-500)/5
                                                                        px-2
                                                                        py-1
                                                                        text-[10px]
                                                                        font-semibold
                                                                        text-(--gold-500)
                                                                        sm:gap-1.5
                                                                        sm:text-xs
                                                                    "
                                                                >
                                                                    {
                                                                        task.difficulty
                                                                    }x
                                                                </span>

                                                                <span
                                                                    className="
                                                                        shrink-0
                                                                        rounded-lg
                                                                        border
                                                                        border-(--gold-500)/25
                                                                        bg-(--gold-500)/5
                                                                        px-2
                                                                        py-1
                                                                        text-[10px]
                                                                        font-semibold
                                                                        text-(--gold-500)
                                                                        sm:px-2.5
                                                                        sm:text-xs
                                                                    "
                                                                >
                                                                    {totalScore}
                                                                    /
                                                                    {
                                                                        maximumScore
                                                                    }
                                                                </span>
                                                            </div>

                                                            <div
                                                                className="
                                                                    mt-2.5
                                                                    flex
                                                                    flex-wrap
                                                                    items-center
                                                                    gap-x-3
                                                                    gap-y-1.5
                                                                    text-[10px]
                                                                    opacity-45
                                                                    sm:mt-3
                                                                    sm:gap-x-4
                                                                    sm:gap-y-2
                                                                    sm:text-xs
                                                                "
                                                            >
                                                                <span
                                                                    className="
                                                                        inline-flex
                                                                        max-w-full
                                                                        items-center
                                                                        gap-1
                                                                        sm:gap-1.5
                                                                    "
                                                                >
                                                                    <UserRound
                                                                        size={
                                                                            12
                                                                        }
                                                                    />

                                                                    <span className="max-w-40 truncate sm:max-w-none">
                                                                        {task
                                                                            .teacher
                                                                            ?.name ||
                                                                            "Teacher"}
                                                                    </span>
                                                                </span>

                                                                <span
                                                                    className="
                                                                        inline-flex
                                                                        items-center
                                                                        gap-1
                                                                        whitespace-nowrap
                                                                        sm:gap-1.5
                                                                    "
                                                                >
                                                                    <Check
                                                                        size={
                                                                            12
                                                                        }
                                                                    />

                                                                    Checked at{" "}
                                                                    {task.review
                                                                        ? formatTime(
                                                                              task
                                                                                  .review
                                                                                  .checkedAt
                                                                          )
                                                                        : ""}
                                                                </span>

                                                                {task.deadline && (
                                                                    <span
                                                                        className="
                                                                            inline-flex
                                                                            max-w-full
                                                                            items-center
                                                                            gap-1
                                                                            sm:gap-1.5
                                                                        "
                                                                    >
                                                                        <Clock3
                                                                            size={
                                                                                12
                                                                            }
                                                                        />

                                                                        <span className="break-words">
                                                                            Deadline:{" "}
                                                                            {formatDeadline(
                                                                                task.deadline
                                                                            )}
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* REVIEW / VIEW */}

                                                        <div
                                                            className="
                                                                w-full
                                                                shrink-0
                                                                sm:w-auto
                                                            "
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openTask(
                                                                        task
                                                                    )
                                                                }
                                                                className={` 
                                                                    inline-flex
                                                                    w-full
                                                                    items-center
                                                                    justify-center
                                                                    gap-2
                                                                    rounded-xl
                                                                    px-4
                                                                    py-3
                                                                    text-sm
                                                                    font-semibold
                                                                    transition
                                                                    sm:w-auto
                                                                    sm:px-5
                                                                    ${
                                                                        viewed
                                                                            ? ` 
                                                                                border
                                                                                border-(--border)
                                                                                bg-(--navy-950)
                                                                                hover:border-(--gold-500)
                                                                                hover:text-(--gold-500)
                                                                            `
                                                                            : `
                                                                                bg-(--gold-500)
                                                                                text-(--navy-900)
                                                                                hover:opacity-90
                                                                            `
                                                                    }
                                                                `}
                                                            >
                                                                {viewed ? (
                                                                    <>
                                                                        <FileText
                                                                            size={
                                                                                16
                                                                            }
                                                                        />

                                                                        View
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check
                                                                            size={
                                                                                16
                                                                            }
                                                                        />

                                                                        Review
                                                                    </>
                                                                )}
                                                            </button>
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

            {/* =====================================================
                REVIEW MODAL
            ====================================================== */}

            {selectedTask && (
                <ReviewModal
                    task={
                        selectedTask
                    }
                    onClose={() =>
                        setSelectedTask(
                            null
                        )
                    }
                />
            )}
        </main>
    );
}

