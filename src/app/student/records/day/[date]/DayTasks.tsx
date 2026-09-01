"use client";

import {
    Check,
    Clock3,
    Eye,
    FileText,
    Loader2,
    Mic,
    Pause,
    Paperclip,
    Play,
    Send,
    Square,
    Upload,
    UserRound,
    Volume2,
    X,
} from "lucide-react";

import {
    ChangeEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

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

    voiceNoteId?: string;
    mimeType?: string | null;
    duration?: number | null;
    id?: string;
};

type ExistingMedia = UploadedMedia & {
    id?: string;
};

type VoiceNote = {
    id: string;
    submissionId: string;
    storageKey: string;
    mimeType: string;
    fileName: string;
    duration: number | null;
    bytes: number | null;
    createdAt: string;
    url: string;
};

type Submission = {
    id: string;
    note: string | null;
    submittedAt: string;
    updatedAt: string;
    media: ExistingMedia[];

    voiceNotes?: VoiceNote[];
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

type Props = {
    date: string;
    dayName: string;
};

type VoicePlaybackState = {
    currentTime: number;
    duration: number;
};

function formatDeadline(deadline: string | null) {
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

    return Math.round(
        difficulty * review.score
    );
}

function getFileExtension(fileName: string) {
    const parts = fileName.split(".");

    return parts.length > 1
        ? parts[parts.length - 1].toUpperCase()
        : "FILE";
}

function getFileFormat(media: UploadedMedia) {
    const format = media.format?.toLowerCase();

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

    return [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "svg",
        "avif",
    ].includes(getFileFormat(media));
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

function isAudio(media: UploadedMedia) {
    if (
        media.resourceType === "audio" ||
        media.mimeType?.startsWith("audio/")
    ) {
        return true;
    }

    return [
        "mp3",
        "wav",
        "ogg",
        "oga",
        "webm",
        "m4a",
        "aac",
        "flac",
        "opus",
    ].includes(getFileFormat(media));
}

function getMediaType(
    media: UploadedMedia
): "image" | "pdf" | "audio" | "file" {
    if (isImage(media)) {
        return "image";
    }

    if (isPdf(media)) {
        return "pdf";
    }

    if (isAudio(media)) {
        return "audio";
    }

    return "file";
}

function formatRecordingTime(seconds: number) {
    const safeSeconds = Math.max(
        0,
        Math.floor(seconds)
    );

    const minutes = Math.floor(
        safeSeconds / 60
    );

    const remainingSeconds =
        safeSeconds % 60;

    return `${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds
            .toString()
            .padStart(2, "0")}`;
}

function formatVoiceTime(seconds: number) {
    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return "00:00";
    }

    return formatRecordingTime(seconds);
}

function formatVoiceDuration(
    seconds: number | null | undefined
) {
    if (
        seconds === null ||
        seconds === undefined ||
        Number.isNaN(Number(seconds))
    ) {
        return null;
    }

    return formatVoiceTime(Number(seconds));
}

function getSupportedAudioMimeType() {
    if (
        typeof window === "undefined" ||
        typeof MediaRecorder === "undefined"
    ) {
        return "";
    }

    const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/ogg",
    ];

    return (
        types.find((type) =>
            MediaRecorder.isTypeSupported(type)
        ) || ""
    );
}

export default function DayTasks({
    date,
    dayName,
}: Props) {
    const [
        categories,
        setCategories,
    ] = useState<TaskCategory[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [
        successMessage,
        setSuccessMessage,
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
        submitting,
        setSubmitting,
    ] = useState(false);

    const [note, setNote] =
        useState("");

    const [
        uploadedMedia,
        setUploadedMedia,
    ] = useState<UploadedMedia[]>([]);

    /*
     * ==========================================================
     * VOICE NOTE STATE
     * ==========================================================
     */

    const [
        isRecording,
        setIsRecording,
    ] = useState(false);

    const [
        isRecordingPaused,
        setIsRecordingPaused,
    ] = useState(false);

    const [
        recordingTime,
        setRecordingTime,
    ] = useState(0);

    const [
        voiceNotes,
        setVoiceNotes,
    ] = useState<UploadedMedia[]>([]);

    const [
        originalVoiceNotes,
        setOriginalVoiceNotes,
    ] = useState<UploadedMedia[]>([]);

    /*
     * Each rendered voice note gets its own HTMLAudioElement.
     *
     * This is important for B2 voice notes in the View modal.
     * We no longer depend on one global Audio object.
     */
    const voiceAudioRefs =
        useRef<
            Map<
                string,
                HTMLAudioElement
            >
        >(new Map());

    const voicePlayRequestRef =
        useRef(0);

    const [
        voicePlaybackState,
        setVoicePlaybackState,
    ] = useState<
        Record<string, VoicePlaybackState>
    >({});

    const [
        playingVoiceKey,
        setPlayingVoiceKey,
    ] = useState<string | null>(null);

    const [
        voicePlaybackSpeed,
        setVoicePlaybackSpeed,
    ] = useState(1);

    const [
        previewMedia,
        setPreviewMedia,
    ] = useState<UploadedMedia | null>(
        null
    );

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

    /*
     * ==========================================================
     * VOICE RECORDING REFS
     * ==========================================================
     */

    const mediaRecorderRef =
        useRef<MediaRecorder | null>(null);

    const recordingStreamRef =
        useRef<MediaStream | null>(null);

    const recordingTimerRef =
        useRef<ReturnType<
            typeof setInterval
        > | null>(null);

    const audioChunksRef =
        useRef<Blob[]>([]);

    /*
     * Local object URLs created for recorded
     * voice notes.
     */
    const voiceBlobUrlsRef =
        useRef<Set<string>>(new Set());

    /*
     * ==========================================================
     * LOAD TASKS
     * ==========================================================
     */

    async function loadTasks() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `/api/student/records/day/${encodeURIComponent(
                    date
                )}/tasks`,
                {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
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

            setCategories(
                Array.isArray(data.categories)
                    ? data.categories
                    : []
            );
        } catch (error) {
            console.error(
                "DAY TASKS ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to load tasks."
            );

            setCategories([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTasks();
    }, [date]);

    /*
     * ==========================================================
     * RECORDING CLEANUP
     * ==========================================================
     */

    const clearRecordingTimer =
        useCallback(() => {
            if (
                recordingTimerRef.current
            ) {
                clearInterval(
                    recordingTimerRef.current
                );

                recordingTimerRef.current =
                    null;
            }
        }, []);

    const stopRecordingStream =
        useCallback(() => {
            if (
                recordingStreamRef.current
            ) {
                recordingStreamRef.current
                    .getTracks()
                    .forEach((track) =>
                        track.stop()
                    );

                recordingStreamRef.current =
                    null;
            }
        }, []);

    const cleanupRecording =
        useCallback(() => {
            clearRecordingTimer();
            stopRecordingStream();

            mediaRecorderRef.current =
                null;

            audioChunksRef.current = [];

            setIsRecording(false);
            setIsRecordingPaused(false);
            setRecordingTime(0);
        }, [
            clearRecordingTimer,
            stopRecordingStream,
        ]);

    /*
     * ==========================================================
     * VOICE PLAYBACK CLEANUP
     * ==========================================================
     */

    const stopVoicePlayback =
        useCallback(() => {
            voiceAudioRefs.current.forEach(
                (audio) => {
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                    } catch {
                        // Ignore cleanup errors.
                    }
                }
            );

            setPlayingVoiceKey(null);

            setVoicePlaybackState(
                (previous) => {
                    const next = {
                        ...previous,
                    };

                    Object.keys(next).forEach(
                        (key) => {
                            next[key] = {
                                ...next[key],
                                currentTime: 0,
                            };
                        }
                    );

                    return next;
                }
            );
        }, []);

    /*
     * ==========================================================
     * COMPONENT UNMOUNT CLEANUP
     * ==========================================================
     */

    useEffect(() => {
        return () => {
            clearRecordingTimer();
            stopRecordingStream();

            voiceAudioRefs.current.forEach(
                (audio) => {
                    try {
                        audio.pause();
                        audio.load();
                    } catch {
                        // Ignore.
                    }
                }
            );

            voiceAudioRefs.current.clear();

            voiceBlobUrlsRef.current.forEach(
                (url) => {
                    try {
                        URL.revokeObjectURL(
                            url
                        );
                    } catch {
                        // Ignore.
                    }
                }
            );

            voiceBlobUrlsRef.current.clear();
        };
    }, [
        clearRecordingTimer,
        stopRecordingStream,
    ]);

    /*
     * ==========================================================
     * VOICE AUDIO REF MANAGEMENT
     * ==========================================================
     */

    function setVoiceAudioRef(
        key: string,
        audio: HTMLAudioElement | null
    ) {
        if (audio) {
            voiceAudioRefs.current.set(
                key,
                audio
            );

            /*
             * Apply the current playback speed
             * immediately to every newly mounted
             * audio element.
             */
            audio.playbackRate =
                voicePlaybackSpeed;
        } else {
            voiceAudioRefs.current.delete(
                key
            );
        }
    }

    /*
     * ==========================================================
     * VOICE AUDIO EVENT HANDLERS
     * ==========================================================
     */

    function handleVoiceLoadedMetadata(
        key: string,
        event: React.SyntheticEvent<HTMLAudioElement>
    ) {
        const audio =
            event.currentTarget;

        const duration = Number.isFinite(
            audio.duration
        )
            ? audio.duration
            : 0;

        setVoicePlaybackState(
            (previous) => ({
                ...previous,
                [key]: {
                    currentTime:
                        Number.isFinite(
                            audio.currentTime
                        )
                            ? audio.currentTime
                            : 0,
                    duration,
                },
            })
        );
    }

    function handleVoiceTimeUpdate(
        key: string,
        event: React.SyntheticEvent<HTMLAudioElement>
    ) {
        const audio =
            event.currentTarget;

        setVoicePlaybackState(
            (previous) => ({
                ...previous,
                [key]: {
                    ...(previous[key] || {
                        duration: 0,
                    }),
                    currentTime:
                        Number.isFinite(
                            audio.currentTime
                        )
                            ? audio.currentTime
                            : 0,
                },
            })
        );
    }

    function handleVoicePlay(
        key: string
    ) {
        /*
         * Only one voice note should play at a time.
         */
        voiceAudioRefs.current.forEach(
            (audio, audioKey) => {
                if (audioKey !== key) {
                    try {
                        audio.pause();
                    } catch {
                        // Ignore.
                    }
                }
            }
        );

        setPlayingVoiceKey(key);
    }

    function handleVoicePause(
        key: string
    ) {
        setPlayingVoiceKey(
            (previous) =>
                previous === key
                    ? null
                    : previous
        );
    }

    function handleVoiceEnded(
        key: string,
        event: React.SyntheticEvent<HTMLAudioElement>
    ) {
        const audio =
            event.currentTarget;

        try {
            audio.currentTime = 0;
        } catch {
            // Ignore.
        }

        setVoicePlaybackState(
            (previous) => ({
                ...previous,
                [key]: {
                    ...(previous[key] || {
                        duration: 0,
                    }),
                    currentTime: 0,
                },
            })
        );

        setPlayingVoiceKey(
            (previous) =>
                previous === key
                    ? null
                    : previous
        );
    }

    function handleVoiceError(
        key: string,
        event: React.SyntheticEvent<HTMLAudioElement>
    ) {
        console.error(
            "VOICE AUDIO ERROR:",
            {
                key,
                url:
                    event.currentTarget
                        .currentSrc,
                error:
                    event.currentTarget.error,
            }
        );

        setPlayingVoiceKey(
            (previous) =>
                previous === key
                    ? null
                    : previous
        );

        setError(
            "Unable to play this voice note. The audio file may be unavailable or in an unsupported format."
        );
    }

    /*
     * ==========================================================
     * VOICE PLAY / PAUSE
     * ==========================================================
     */

async function toggleVoicePlayback(
    key: string
) {
    const audio =
        voiceAudioRefs.current.get(key);

    if (!audio) {
        console.warn(
            "Voice audio element not found:",
            key
        );

        return;
    }

    /*
     * If this voice note is currently playing,
     * pause it.
     */
    if (
        playingVoiceKey === key &&
        !audio.paused
    ) {
        audio.pause();

        return;
    }

    /*
     * Pause every other voice note.
     *
     * Do not reset currentTime here before
     * starting the new play request.
     */
    voiceAudioRefs.current.forEach(
        (otherAudio, otherKey) => {
            if (
                otherKey !== key &&
                !otherAudio.paused
            ) {
                try {
                    otherAudio.pause();
                } catch {
                    // Ignore pause errors.
                }
            }
        }
    );

    /*
     * Reset other voice notes.
     */
    voiceAudioRefs.current.forEach(
        (otherAudio, otherKey) => {
            if (otherKey !== key) {
                try {
                    otherAudio.currentTime = 0;
                } catch {
                    // Ignore reset errors.
                }
            }
        }
    );

    /*
     * Apply selected playback speed.
     */
    audio.playbackRate =
        voicePlaybackSpeed;

    try {
        await audio.play();

        /*
         * Only update state after play()
         * successfully starts.
         */
        setPlayingVoiceKey(key);
    } catch (error) {
        /*
         * AbortError happens when a media
         * operation interrupts play().
         *
         * It should not be treated as a
         * normal playback failure.
         */
        if (
            error instanceof DOMException &&
            error.name === "AbortError"
        ) {
            return;
        }

        console.error(
            "VOICE PLAYBACK ERROR:",
            error
        );

        setPlayingVoiceKey(null);
    }
}

    /*
     * ==========================================================
     * SEEK VOICE NOTE
     * ==========================================================
     */

    function seekVoice(
        key: string,
        event: React.MouseEvent<HTMLDivElement>
    ) {
        const audio =
            voiceAudioRefs.current.get(
                key
            );

        const state =
            voicePlaybackState[key];

        if (
            !audio ||
            !state ||
            !state.duration ||
            !Number.isFinite(
                state.duration
            )
        ) {
            return;
        }

        const rect =
            event.currentTarget.getBoundingClientRect();

        if (!rect.width) {
            return;
        }

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
            state.duration;

        try {
            audio.currentTime =
                newTime;
        } catch {
            return;
        }

        setVoicePlaybackState(
            (previous) => ({
                ...previous,
                [key]: {
                    ...(previous[key] || {
                        duration:
                            state.duration,
                    }),
                    currentTime: newTime,
                    duration:
                        state.duration,
                },
            })
        );
    }

    /*
     * ==========================================================
     * CHANGE VOICE SPEED
     * ==========================================================
     */

    function changeVoicePlaybackSpeed(
        key: string
    ) {
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

        const audio =
            voiceAudioRefs.current.get(
                key
            );

        if (audio) {
            audio.playbackRate =
                nextSpeed;
        }
    }

    /*
     * Keep all mounted audio elements synchronized
     * when the global speed changes.
     */
    useEffect(() => {
        voiceAudioRefs.current.forEach(
            (audio) => {
                audio.playbackRate =
                    voicePlaybackSpeed;
            }
        );
    }, [voicePlaybackSpeed]);

    /*
     * ==========================================================
     * OPEN SUBMIT MODAL
     * ==========================================================
     */

    function openSubmitModal(
        task: TaskItem
    ) {
        cleanupRecording();
        stopVoicePlayback();

        setSubmitTask(task);
        setViewTask(null);

        setResubmitMode(false);

        setNote("");
        setUploadedMedia([]);

        setVoiceNotes([]);
        setOriginalVoiceNotes([]);

        setOriginalNote("");
        setOriginalMedia([]);

        setPreviewMedia(null);
        setError("");

        setVoicePlaybackState({});
        setVoicePlaybackSpeed(1);
    }

    /*
     * ==========================================================
     * OPEN VIEW MODAL
     * ==========================================================
     */

function openViewModal(
    task: TaskItem
) {
    cleanupRecording();
    stopVoicePlayback();

    const submission =
        getSubmission(task);

    console.log(
        "===== VIEW VOICE DEBUG ====="
    );

    console.log(
        "Submission:",
        submission
    );

    console.log(
        "Voice Notes:",
        submission?.voiceNotes
    );

    submission?.voiceNotes?.forEach(
        (voice, index) => {
            console.log(
                `Voice ${index}:`,
                {
                    id: voice.id,
                    storageKey:
                        voice.storageKey,
                    url: voice.url,
                    mimeType:
                        voice.mimeType,
                    duration:
                        voice.duration,
                }
            );
        }
    );

    console.log(
        "============================"
    );

    setViewTask(task);
    setSubmitTask(null);
    setError("");
}

    /*
     * ==========================================================
     * CLOSE SUBMIT MODAL
     * ==========================================================
     */

    function closeSubmitModal() {
        if (submitting) {
            return;
        }

        cleanupRecording();
        stopVoicePlayback();

        uploadedMedia.forEach(
            (media) => {
                if (
                    media.file &&
                    media.url.startsWith("blob:")
                ) {
                    try {
                        URL.revokeObjectURL(
                            media.url
                        );
                    } catch {
                        // Ignore.
                    }
                }
            }
        );

        voiceNotes.forEach(
            (voice) => {
                if (
                    voice.file &&
                    voice.url.startsWith("blob:")
                ) {
                    try {
                        URL.revokeObjectURL(
                            voice.url
                        );
                    } catch {
                        // Ignore.
                    }
                }
            }
        );

        setSubmitTask(null);

        setNote("");
        setUploadedMedia([]);

        setVoiceNotes([]);
        setOriginalVoiceNotes([]);

        setResubmitMode(false);

        setOriginalNote("");
        setOriginalMedia([]);

        setPreviewMedia(null);

        setVoicePlaybackState({});
        setVoicePlaybackSpeed(1);
    }

    /*
     * ==========================================================
     * CLOSE VIEW MODAL
     * ==========================================================
     */

    function closeViewModal() {
        cleanupRecording();
        stopVoicePlayback();

        setViewTask(null);
        setError("");

        setVoicePlaybackState({});
        setVoicePlaybackSpeed(1);
    }

    /*
     * ==========================================================
     * FILE UPLOAD
     * ==========================================================
     */

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const files = event.target.files;

        if (
            !files ||
            files.length === 0
        ) {
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
                format: file.name.includes(
                    "."
                )
                    ? file.name
                        .split(".")
                        .pop()
                        ?.toLowerCase() ||
                    null
                    : null,
                bytes: file.size,
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
            fileInputRef.current.value = "";
        }
    }

    function removeUploadedMedia(
        index: number
    ) {
        setUploadedMedia((previous) => {
            const media = previous[index];

            if (
                media?.file &&
                media.url.startsWith("blob:")
            ) {
                try {
                    URL.revokeObjectURL(
                        media.url
                    );
                } catch {
                    // Ignore.
                }
            }

            return previous.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            );
        });
    }

    /*
     * ==========================================================
     * START VOICE RECORDING
     * ==========================================================
     */

    const startVoiceRecording =
        useCallback(async () => {
            if (
                isRecording ||
                submitting
            ) {
                return;
            }

            try {
                setError("");

                if (
                    typeof window ===
                    "undefined" ||
                    typeof MediaRecorder ===
                    "undefined"
                ) {
                    throw new Error(
                        "Voice recording is not supported by this browser."
                    );
                }

                if (
                    !navigator
                        .mediaDevices
                        ?.getUserMedia
                ) {
                    throw new Error(
                        "Microphone access is not supported by this browser."
                    );
                }

                const stream =
                    await navigator.mediaDevices.getUserMedia(
                        {
                            audio: true,
                        }
                    );

                recordingStreamRef.current =
                    stream;

                const mimeType =
                    getSupportedAudioMimeType();

                let recorder: MediaRecorder;

                try {
                    recorder = mimeType
                        ? new MediaRecorder(
                            stream,
                            {
                                mimeType,
                            }
                        )
                        : new MediaRecorder(
                            stream
                        );
                } catch {
                    stopRecordingStream();

                    throw new Error(
                        "Your browser does not support a compatible audio recording format."
                    );
                }

                audioChunksRef.current =
                    [];

                recorder.ondataavailable = (
                    event: BlobEvent
                ) => {
                    if (
                        event.data &&
                        event.data.size > 0
                    ) {
                        audioChunksRef.current.push(
                            event.data
                        );
                    }
                };

                recorder.onstop = () => {
                    const actualMimeType =
                        recorder.mimeType ||
                        mimeType ||
                        "audio/webm";

                    const audioBlob =
                        new Blob(
                            audioChunksRef.current,
                            {
                                type: actualMimeType,
                            }
                        );

                    clearRecordingTimer();
                    stopRecordingStream();

                    mediaRecorderRef.current =
                        null;

                    setIsRecording(false);
                    setIsRecordingPaused(
                        false
                    );
                    setRecordingTime(0);

                    if (
                        audioBlob.size ===
                        0
                    ) {
                        audioChunksRef.current =
                            [];

                        setError(
                            "The voice recording is empty. Please try again."
                        );

                        return;
                    }

                    let extension =
                        "webm";

                    if (
                        actualMimeType.includes(
                            "mp4"
                        )
                    ) {
                        extension = "m4a";
                    } else if (
                        actualMimeType.includes(
                            "ogg"
                        )
                    ) {
                        extension = "ogg";
                    }

                    const fileName = `voice-note-${Date.now()}.${extension}`;

                    const file =
                        new File(
                            [audioBlob],
                            fileName,
                            {
                                type: actualMimeType,
                            }
                        );

                    const objectUrl =
                        URL.createObjectURL(
                            file
                        );

                    voiceBlobUrlsRef.current.add(
                        objectUrl
                    );

                    const recordedDuration =
                        recordingTime;

                    setVoiceNotes(
                        (previous) => [
                            ...previous,
                            {
                                url: objectUrl,
                                fileName,
                                resourceType:
                                    "audio",
                                format:
                                    extension,
                                bytes:
                                    file.size,
                                file,
                                mimeType:
                                    actualMimeType,
                                duration:
                                    recordedDuration,
                            },
                        ]
                    );

                    audioChunksRef.current =
                        [];
                };

                recorder.onerror = () => {
                    clearRecordingTimer();
                    stopRecordingStream();

                    mediaRecorderRef.current =
                        null;

                    setIsRecording(false);
                    setIsRecordingPaused(
                        false
                    );

                    setError(
                        "An error occurred while recording the voice note."
                    );
                };

                mediaRecorderRef.current =
                    recorder;

                recorder.start();

                setRecordingTime(0);
                setIsRecording(true);
                setIsRecordingPaused(
                    false
                );

                clearRecordingTimer();

                recordingTimerRef.current =
                    setInterval(() => {
                        setRecordingTime(
                            (previous) =>
                                previous + 1
                        );
                    }, 1000);
            } catch (error) {
                console.error(
                    "START VOICE RECORDING ERROR:",
                    error
                );

                stopRecordingStream();

                setIsRecording(false);
                setIsRecordingPaused(
                    false
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to start voice recording."
                );
            }
        }, [
            isRecording,
            submitting,
            clearRecordingTimer,
            stopRecordingStream,
            recordingTime,
        ]);

    /*
     * ==========================================================
     * PAUSE / RESUME VOICE RECORDING
     * ==========================================================
     */

    function toggleVoiceRecordingPause() {
        const recorder =
            mediaRecorderRef.current;

        if (!recorder) {
            return;
        }

        try {
            if (
                recorder.state ===
                "recording"
            ) {
                recorder.pause();

                setIsRecordingPaused(
                    true
                );

                clearRecordingTimer();
            } else if (
                recorder.state ===
                "paused"
            ) {
                recorder.resume();

                setIsRecordingPaused(
                    false
                );

                clearRecordingTimer();

                recordingTimerRef.current =
                    setInterval(() => {
                        setRecordingTime(
                            (previous) =>
                                previous + 1
                        );
                    }, 1000);
            }
        } catch (error) {
            console.error(
                "TOGGLE VOICE RECORDING ERROR:",
                error
            );

            setError(
                "Unable to pause or resume the recording."
            );
        }
    }

    /*
     * ==========================================================
     * STOP VOICE RECORDING
     * ==========================================================
     */

    function stopVoiceRecording() {
        const recorder =
            mediaRecorderRef.current;

        if (!recorder) {
            cleanupRecording();
            return;
        }

        try {
            clearRecordingTimer();

            if (
                recorder.state !==
                "inactive"
            ) {
                recorder.stop();
            } else {
                cleanupRecording();
            }
        } catch (error) {
            console.error(
                "STOP VOICE RECORDING ERROR:",
                error
            );

            cleanupRecording();

            setError(
                "Unable to stop the voice recording."
            );
        }
    }

    /*
     * ==========================================================
     * REMOVE VOICE NOTE
     * ==========================================================
     */

    function removeVoiceNote(
        index: number
    ) {
        const voice =
            voiceNotes[index];

        /*
         * Stop this audio if it happens to be
         * currently playing.
         */
        const key = `submit-${index}`;

        const audio =
            voiceAudioRefs.current.get(
                key
            );

        if (audio) {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch {
                // Ignore.
            }
        }

        if (
            voice?.file &&
            voice.url.startsWith("blob:")
        ) {
            try {
                URL.revokeObjectURL(
                    voice.url
                );

                voiceBlobUrlsRef.current.delete(
                    voice.url
                );
            } catch {
                // Ignore.
            }
        }

        setVoiceNotes((previous) =>
            previous.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );

        setPlayingVoiceKey(
            (previous) =>
                previous === key
                    ? null
                    : previous
        );
    }

    /*
     * ==========================================================
     * RESUBMIT CHANGE DETECTION
     * ==========================================================
     */

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

        const mediaChanged =
            uploadedMedia.some(
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

        if (mediaChanged) {
            return true;
        }

        if (
            voiceNotes.length !==
            originalVoiceNotes.length
        ) {
            return true;
        }

        const voiceNotesChanged =
            voiceNotes.some(
                (voice, index) => {
                    const original =
                        originalVoiceNotes[
                        index
                        ];

                    if (!original) {
                        return true;
                    }

                    if (
                        voice.file ||
                        original.file
                    ) {
                        return (
                            voice.url !==
                            original.url ||
                            voice.fileName !==
                            original.fileName
                        );
                    }

                    return (
                        (voice.voiceNoteId ||
                            voice.id) !==
                        (original.voiceNoteId ||
                            original.id)
                    );
                }
            );

        return voiceNotesChanged;
    }

    /*
     * ==========================================================
     * SUBMIT TASK
     * ==========================================================
     */

    async function handleSubmit() {
        if (!submitTask) {
            return;
        }

        if (isRecording) {
            setError(
                "Please stop the voice recording before submitting."
            );

            return;
        }

        if (
            resubmitMode &&
            !hasChanges()
        ) {
            setError(
                "Make at least one change before resubmitting."
            );

            return;
        }

        setSubmitting(true);
        setError("");

        try {
            /*
             * =====================================================
             * STEP 1
             * Upload normal Cloudinary media
             * =====================================================
             */

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
                    mediaToSubmit.push({
                        url: media.url,
                        publicId:
                            media.publicId,
                        resourceType:
                            media.resourceType,
                        fileName:
                            media.fileName,
                        format:
                            media.format,
                        bytes:
                            media.bytes ??
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

                const contentType =
                    uploadResponse.headers.get(
                        "content-type"
                    ) || "";

                if (
                    !contentType.includes(
                        "application/json"
                    )
                ) {
                    throw new Error(
                        "Failed to upload file."
                    );
                }

                const uploadData =
                    await uploadResponse.json();

                if (
                    !uploadResponse.ok ||
                    !uploadData.media
                ) {
                    throw new Error(
                        uploadData.message ||
                        "Failed to upload file."
                    );
                }

                mediaToSubmit.push({
                    url:
                        uploadData.media.url,
                    publicId:
                        uploadData.media
                            .publicId,
                    resourceType:
                        uploadData.media
                            .resourceType ||
                        media.resourceType,
                    fileName:
                        uploadData.media
                            .fileName ||
                        media.fileName,
                    format:
                        uploadData.media
                            .format ??
                        media.format,
                    bytes:
                        uploadData.media
                            .bytes ??
                        media.bytes ??
                        null,
                });
            }

            /*
             * =====================================================
             * STEP 2
             * Existing B2 voice notes to retain
             * =====================================================
             */

            const retainedVoiceNoteIds =
                voiceNotes
                    .filter(
                        (voice) =>
                            !voice.file
                    )
                    .map(
                        (voice) =>
                            voice.voiceNoteId ||
                            voice.id
                    )
                    .filter(
                        (
                            id
                        ): id is string =>
                            typeof id ===
                            "string" &&
                            id.length > 0
                    );

            /*
             * New voice notes are uploaded separately
             * to B2 after TaskSubmission exists.
             */
            const voiceNotesToUpload =
                voiceNotes.filter(
                    (voice) =>
                        !!voice.file
                );

            /*
             * =====================================================
             * STEP 3
             * Create/update TaskSubmission
             * =====================================================
             */

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

            formData.append(
                "voiceNoteIds",
                JSON.stringify(
                    retainedVoiceNoteIds
                )
            );

            formData.append(
                "voiceNotesChanged",
                resubmitMode
                    ? "true"
                    : "false"
            );

            const response =
                await fetch(
                    `/api/student/tasks/${submitTask.id}/submit`,
                    {
                        method: "POST",
                        credentials:
                            "include",
                        body:
                            formData,
                    }
                );

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            let data: {
                message?: string;
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

            /*
             * =====================================================
             * STEP 4
             * Upload NEW voice notes to B2
             * =====================================================
             */

            if (
                voiceNotesToUpload.length >
                0
            ) {
                const voiceFormData =
                    new FormData();

                for (
                    const voiceNote of
                    voiceNotesToUpload
                ) {
                    if (!voiceNote.file) {
                        continue;
                    }

                    voiceFormData.append(
                        "voiceNotes",
                        voiceNote.file,
                        voiceNote.file.name
                    );
                }

                const voiceResponse =
                    await fetch(
                        `/api/student/tasks/${submitTask.id}/voice-notes`,
                        {
                            method: "POST",
                            credentials:
                                "include",
                            body:
                                voiceFormData,
                        }
                    );

                const voiceContentType =
                    voiceResponse.headers.get(
                        "content-type"
                    ) || "";

                let voiceData: {
                    success?: boolean;
                    message?: string;
                    voiceNotes?: unknown[];
                } = {};

                if (
                    voiceContentType.includes(
                        "application/json"
                    )
                ) {
                    voiceData =
                        await voiceResponse.json();
                } else {
                    const text =
                        await voiceResponse.text();

                    throw new Error(
                        text ||
                        "Failed to upload voice notes."
                    );
                }

                if (!voiceResponse.ok) {
                    throw new Error(
                        voiceData.message ||
                        "Failed to upload voice notes."
                    );
                }
            }

            /*
             * =====================================================
             * STEP 5
             * Cleanup local objects
             * =====================================================
             */

            uploadedMedia.forEach(
                (media) => {
                    if (
                        media.file &&
                        media.url.startsWith(
                            "blob:"
                        )
                    ) {
                        try {
                            URL.revokeObjectURL(
                                media.url
                            );
                        } catch {
                            // Ignore.
                        }
                    }
                }
            );

            voiceNotes.forEach(
                (voice) => {
                    if (
                        voice.file &&
                        voice.url.startsWith(
                            "blob:"
                        )
                    ) {
                        try {
                            URL.revokeObjectURL(
                                voice.url
                            );

                            voiceBlobUrlsRef.current.delete(
                                voice.url
                            );
                        } catch {
                            // Ignore.
                        }
                    }
                }
            );

            cleanupRecording();
            stopVoicePlayback();

            const teacherName =
                submitTask.teacher?.name ||
                submitTask.teacher
                    ?.username ||
                "teacher";

            const wasResubmit =
                resubmitMode;

            setSubmitTask(null);

            setNote("");
            setUploadedMedia([]);

            setVoiceNotes([]);
            setOriginalVoiceNotes([]);

            setResubmitMode(false);

            setOriginalNote("");
            setOriginalMedia([]);

            setPreviewMedia(null);

            setVoicePlaybackState({});
            setVoicePlaybackSpeed(1);

            setSuccessMessage(
                wasResubmit
                    ? `Task resubmitted to ${teacherName}.`
                    : `Task submitted to ${teacherName}.`
            );

            await loadTasks();
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

    /*
     * ==========================================================
     * START RESUBMIT
     * ==========================================================
     */

    function startResubmit() {
        if (!viewTask) {
            return;
        }

        const submission =
            getSubmission(viewTask);

        if (!submission) {
            return;
        }

        cleanupRecording();
        stopVoicePlayback();

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
                        media.publicId,
                    bytes:
                        media.bytes ??
                        null,
                    id: media.id,
                })
            );

        /*
         * Convert existing B2 voice notes into
         * the same local UI structure.
         */
        const existingVoiceNotes: UploadedMedia[] =
            (
                submission.voiceNotes ||
                []
            ).map((voice) => ({
                id: voice.id,
                voiceNoteId:
                    voice.id,
                url: voice.url,
                fileName:
                    voice.fileName,
                resourceType:
                    "audio",
                format:
                    voice.fileName
                        .split(".")
                        .pop()
                        ?.toLowerCase() ||
                    null,
                bytes:
                    voice.bytes,
                mimeType:
                    voice.mimeType,
                duration:
                    voice.duration,
            }));

        setOriginalNote(
            submission.note || ""
        );

        setOriginalMedia(
            existingMedia
        );

        setOriginalVoiceNotes(
            existingVoiceNotes
        );

        setNote(
            submission.note || ""
        );

        setUploadedMedia(
            existingMedia
        );

        setVoiceNotes(
            existingVoiceNotes
        );

        setResubmitMode(true);

        setViewTask(null);
        setSubmitTask(viewTask);

        setError("");

        setVoicePlaybackState({});
        setVoicePlaybackSpeed(1);
    }

    /*
     * ==========================================================
     * RENDER NORMAL MEDIA
     * ==========================================================
     */

    function renderMedia(
        media: UploadedMedia,
        index: number,
        removable = false
    ) {
        const type = getMediaType(media);

        return (
            <div
                key={`${media.url}-${index}`}
                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-(--border) bg-(--navy-900) sm:h-28 sm:w-28"
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
                    {type === "image" ? (
                        <img
                            src={media.url}
                            alt={
                                media.fileName
                            }
                            className="h-full w-full object-cover"
                        />
                    ) : type === "pdf" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
                            <FileText
                                size={30}
                                className="text-red-400"
                            />

                            <span className="max-w-full truncate px-1 text-[10px] text-red-300">
                                PDF
                            </span>
                        </div>
                    ) : type ===
                        "audio" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
                            <Volume2
                                size={28}
                                className="text-(--gold-500)"
                            />

                            <span className="max-w-full truncate px-1 text-[10px] opacity-60">
                                Audio
                            </span>
                        </div>
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-2 text-center">
                            <FileText
                                size={28}
                                className="opacity-50"
                            />

                            <span className="max-w-full truncate px-1 text-[10px] opacity-50">
                                {getFileExtension(
                                    media.fileName
                                )}
                            </span>
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 hidden truncate bg-black/70 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100 sm:block">
                        {media.fileName}
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

    /*
     * ==========================================================
     * RENDER VOICE NOTE
     *
     * IMPORTANT:
     * This is now the same player for:
     *
     * 1. Newly recorded voice notes
     * 2. Resubmission voice notes
     * 3. Previously submitted B2 voice notes in View
     *
     * Every voice note owns its own <audio> element.
     * ==========================================================
     */

    function renderVoiceNote(
        voice: UploadedMedia,
        index: number,
        removable = false,
        scope = "submit"
    ) {
        const key = `${scope}-${index}-${voice.voiceNoteId || voice.id || voice.url}`;

        const playback =
            voicePlaybackState[key] || {
                currentTime: 0,
                duration:
                    Number.isFinite(
                        Number(
                            voice.duration
                        )
                    )
                        ? Number(
                            voice.duration
                        )
                        : 0,
            };

        const currentTime =
            playback.currentTime || 0;

        const duration =
            playback.duration || 0;

        const isPlaying =
            playingVoiceKey === key;

        const progress =
            duration > 0
                ? Math.min(
                    100,
                    Math.max(
                        0,
                        (currentTime /
                            duration) *
                        100
                    )
                )
                : 0;

        return (
            <div
                key={key}
                className="
                    flex
                    w-full
                    min-w-0
                    items-center
                    gap-2.5
                    rounded-2xl
                    bg-white/[0.08]
                    px-2.5
                    py-2
                "
            >
                {/* PLAY BUTTON */}

                <button
                    type="button"
                    onClick={() =>
                        toggleVoicePlayback(
                            key
                        )
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
                    {/* PROGRESS AREA */}

                    <div
                        className="
                            relative
                            h-5
                            w-full
                            cursor-pointer
                        "
                        onClick={(event) =>
                            seekVoice(
                                key,
                                event
                            )
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

                    <div className="flex items-center justify-between leading-none">
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
                                duration
                            )}
                        </span>
                    </div>
                </div>

                {/* SPEED */}

                <button
                    type="button"
                    onClick={() =>
                        changeVoicePlaybackSpeed(
                            key
                        )
                    }
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
                    "
                >
                    {voicePlaybackSpeed}x
                </button>

                {/* DELETE */}

                {removable && (
                    <button
                        type="button"
                        onClick={() =>
                            removeVoiceNote(
                                index
                            )
                        }
                        className="
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            text-white/25
                            transition
                            hover:bg-red-400/10
                            hover:text-red-300
                            active:scale-95
                        "
                    >
                        <X size={13} />
                    </button>
                )}

                {/* ACTUAL AUDIO ELEMENT */}

                <audio
                    ref={(audio) => {
                        setVoiceAudioRef(key, audio);
                    }}
                    src={voice.url}
                    preload="metadata"
                    onLoadedMetadata={(event) =>
                        handleVoiceLoadedMetadata(
                            key,
                            event
                        )
                    }
                    onDurationChange={(event) =>
                        handleVoiceLoadedMetadata(
                            key,
                            event
                        )
                    }
                    onTimeUpdate={(event) =>
                        handleVoiceTimeUpdate(
                            key,
                            event
                        )
                    }
                    onPlay={() =>
                        handleVoicePlay(key)
                    }
                    onPause={() =>
                        handleVoicePause(key)
                    }
                    onEnded={(event) =>
                        handleVoiceEnded(
                            key,
                            event
                        )
                    }
                    onError={(event) =>
                        handleVoiceError(
                            key,
                            event
                        )
                    }
                    className="hidden"
                />
            </div>
        );
    }

    return (
        <section className="min-w-0 space-y-5">
            {/* =================================================
                PAGE HEADER
            ================================================== */}

            <div className="min-w-0">
                <h2 className="text-xl font-semibold">
                    Daily Tasks
                </h2>

                <p className="mt-1 text-sm leading-6 opacity-50">
                    Tasks assigned for{" "}
                    {dayName}.
                </p>
            </div>

            {/* =================================================
                SUCCESS
            ================================================== */}

            {successMessage && (
                <div className="flex items-start gap-3 rounded-xl border border-green-400/30 bg-green-400/5 px-3 py-3 text-sm text-green-300 sm:items-center sm:px-4">
                    <span className="min-w-0 flex-1 break-words leading-5">
                        {successMessage}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setSuccessMessage(
                                ""
                            )
                        }
                        className="shrink-0 rounded-md p-1 transition hover:bg-green-400/10"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* =================================================
                ERROR
            ================================================== */}

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-400/5 px-3 py-3 text-sm text-red-300 sm:items-center sm:px-4">
                    <span className="min-w-0 flex-1 break-words leading-5">
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        className="shrink-0 rounded-md p-1 transition hover:bg-red-400/10"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* =================================================
                DAY CONTENT
            ================================================== */}

            {loading ? (
                <div className="flex min-h-32 items-center justify-center rounded-2xl border border-(--border) bg-(--navy-900) p-8 sm:p-12">
                    <Loader2
                        size={22}
                        className="animate-spin opacity-50"
                    />
                </div>
            ) : categories.length ===
                0 ? (
                <div className="rounded-2xl border border-(--border) bg-(--navy-900) px-5 py-10 text-center text-sm leading-6 opacity-50 sm:p-12">
                    No tasks assigned for{" "}
                    {dayName}.
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-5">
                    {categories.map(
                        (category) => (
                            <section
                                key={
                                    category.id
                                }
                                className="min-w-0 overflow-hidden rounded-2xl border border-(--border)"
                            >
                                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-(--border) bg-(--navy-800) px-4 py-4 sm:px-5">
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

                                <div className="p-3 sm:p-5">
                                    {category
                                        .tasks
                                        .length ===
                                        0 && (
                                            <p className="py-4 text-center text-sm opacity-40">
                                                No tasks in
                                                this
                                                category.
                                            </p>
                                        )}

                                    {category
                                        .tasks
                                        .length >
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
                                                                className="min-w-0 rounded-xl border border-(--border) bg-(--navy-900) px-3 py-4 transition hover:border-(--gold-500)/40 sm:px-4"
                                                            >
                                                                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                                                                            <p className="min-w-0 max-w-full break-words font-medium leading-6">
                                                                                {
                                                                                    task.title
                                                                                }
                                                                            </p>

                                                                            <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1 text-[10px] font-medium text-(--gold-500) sm:text-[11px]">
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

                                                                            <span className="rounded-md border border-(--border) bg-(--navy-800) px-2 py-1 text-[10px] font-medium opacity-70 sm:text-[11px]">
                                                                                {
                                                                                    task.difficulty
                                                                                }
                                                                                x
                                                                            </span>

                                                                            {submitted && (
                                                                                <span className="inline-flex items-center gap-1 rounded-md border border-green-400/30 bg-green-400/5 px-2 py-1 text-[10px] font-medium text-green-300 sm:text-[11px]">
                                                                                    <Check
                                                                                        size={
                                                                                            11
                                                                                        }
                                                                                    />

                                                                                    Submitted
                                                                                </span>
                                                                            )}

                                                                            {submitted &&
                                                                                status && (
                                                                                    <span
                                                                                        className={`rounded-md border px-2 py-1 text-[10px] font-medium sm:text-[11px] ${status ===
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

                                                                            {submitted &&
                                                                                task.isChecked && (
                                                                                    <span className="rounded-md border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1 text-[10px] font-medium text-(--gold-500) sm:text-[11px]">
                                                                                        Checked
                                                                                    </span>
                                                                                )}

                                                                            {submitted &&
                                                                                submission &&
                                                                                (submission.voiceNotes?.length ||
                                                                                    0) >
                                                                                0 && (
                                                                                    <span className="inline-flex items-center gap-1 rounded-md border border-(--gold-500)/20 bg-(--gold-500)/5 px-2 py-1 text-[10px] font-medium text-(--gold-500) sm:text-[11px]">
                                                                                        <Mic
                                                                                            size={
                                                                                                11
                                                                                            }
                                                                                        />

                                                                                        {
                                                                                            submission
                                                                                                .voiceNotes
                                                                                                ?.length
                                                                                        }{" "}
                                                                                        voice
                                                                                    </span>
                                                                                )}
                                                                        </div>

                                                                        {task.description && (
                                                                            <p className="mt-2 break-words text-sm leading-6 opacity-50">
                                                                                {
                                                                                    task.description
                                                                                }
                                                                            </p>
                                                                        )}

                                                                        <p className="mt-3 inline-flex max-w-full items-center gap-1.5 text-xs leading-5 opacity-50">
                                                                            <UserRound
                                                                                size={
                                                                                    13
                                                                                }
                                                                                className="shrink-0"
                                                                            />

                                                                            <span className="min-w-0 truncate">
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

                                                                    <div className="w-full shrink-0 lg:w-auto lg:pt-0.5">
                                                                        {submitted ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openViewModal(
                                                                                        task
                                                                                    )
                                                                                }
                                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--border) px-5 py-3 text-sm font-medium transition hover:border-(--gold-500) hover:text-(--gold-500) lg:w-auto"
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
                                                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--gold-500) px-5 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 lg:w-auto"
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
            ====================================================== */}

            {submitTask && (
                <div
                    className="fixed inset-0 z-100 flex items-end justify-center overflow-y-auto bg-black/75 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeSubmitModal();
                        }
                    }}
                >
                    <div className="flex max-h-[100dvh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-(--border) bg-(--navy-900) shadow-2xl sm:max-h-[94vh] sm:rounded-2xl">
                        {/* HEADER */}

                        <div className="relative shrink-0 border-b border-(--border) bg-(--navy-800)/50 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="absolute left-0 top-0 h-full w-1 bg-(--gold-500)" />

                            <div className="flex min-w-0 items-start justify-between gap-3 pl-2 sm:gap-5">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--gold-500)" />

                                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-(--gold-500) sm:text-[10px] sm:tracking-[0.2em]">
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
                                            }
                                            x
                                        </span>

                                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70 sm:px-2.5 sm:text-[11px]">
                                            <Clock3
                                                size={
                                                    13
                                                }
                                            />

                                            <span className="truncate">
                                                {formatDeadline(
                                                    submitTask.deadline
                                                )}
                                            </span>
                                        </span>

                                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70 sm:px-2.5 sm:text-[11px]">
                                            <UserRound
                                                size={
                                                    13
                                                }
                                            />

                                            <span className="max-w-[180px] truncate">
                                                {submitTask
                                                    .teacher
                                                    ?.name ||
                                                    submitTask
                                                        .teacher
                                                        ?.username ||
                                                    "Unknown"}
                                            </span>
                                        </span>

                                        {resubmitMode && (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/30 bg-blue-400/10 px-2 py-1.5 text-[10px] font-medium text-blue-300 sm:px-2.5 sm:text-[11px]">
                                                Resubmission
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeSubmitModal
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="shrink-0 rounded-xl border border-transparent p-2 text-white/50 transition hover:border-(--border) hover:bg-white/5 hover:text-white disabled:cursor-not-allowed"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}

                        <div className="scholar-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                            {/* DESCRIPTION */}

                            <section>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                        <FileText
                                            size={
                                                15
                                            }
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Task Description
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Instructions
                                            from your
                                            teacher
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
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                            <Paperclip
                                                size={
                                                    15
                                                }
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                Your
                                                Work
                                            </h3>

                                            <p className="mt-0.5 text-[11px] opacity-40">
                                                Attach
                                                your
                                                files and
                                                supporting
                                                work
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={
                                            submitting ||
                                            isRecording
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--gold-500)/30 bg-(--gold-500)/5 px-4 py-3 text-xs font-medium text-(--gold-500) transition hover:border-(--gold-500) hover:bg-(--gold-500)/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                                    >
                                        <Upload
                                            size={
                                                15
                                            }
                                        />

                                        Upload Files
                                    </button>

                                    <input
                                        ref={
                                            fileInputRef
                                        }
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf,video/*,audio/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                        className="hidden"
                                        onChange={
                                            handleFileChange
                                        }
                                    />
                                </div>

                                {uploadedMedia.length >
                                    0 ? (
                                    <div className="mt-4 rounded-xl border border-(--border) bg-(--navy-800)/30 p-3 sm:p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-[10px] font-medium uppercase tracking-wider opacity-40">
                                                Attached
                                                Files
                                            </p>

                                            <span className="rounded-md border border-(--border) px-2 py-1 text-[10px] opacity-50">
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
                                    <div className="mt-4 rounded-xl border border-dashed border-(--border) bg-(--navy-800)/20 px-4 py-7 text-center">
                                        <Paperclip
                                            size={
                                                19
                                            }
                                            className="mx-auto opacity-40"
                                        />

                                        <p className="mt-3 text-xs font-medium opacity-60">
                                            No files
                                            attached
                                        </p>
                                    </div>
                                )}
                            </section>

                            {/* =================================================
                                VOICE NOTES
                            ================================================== */}

                            <section className="mt-7 sm:mt-8">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                            <Mic
                                                size={
                                                    15
                                                }
                                            />
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                Voice Notes
                                            </h3>

                                            <p className="mt-0.5 text-[11px] opacity-40">
                                                Record voice
                                                messages
                                                for your
                                                teacher
                                            </p>
                                        </div>
                                    </div>

                                    {!isRecording ? (
                                        <button
                                            type="button"
                                            onClick={
                                                startVoiceRecording
                                            }
                                            disabled={
                                                submitting
                                            }
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-(--gold-500)/30 bg-(--gold-500)/5 px-4 py-3 text-xs font-medium text-(--gold-500) transition hover:border-(--gold-500) hover:bg-(--gold-500)/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:py-2.5"
                                        >
                                            <Mic
                                                size={
                                                    15
                                                }
                                            />

                                            Add Voice
                                        </button>
                                    ) : (
                                        <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-red-400/30 bg-red-400/5 p-2 sm:w-auto">
                                            <div className="flex items-center gap-2 px-2">
                                                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />

                                                <span className="font-mono text-sm text-red-300">
                                                    {formatRecordingTime(
                                                        recordingTime
                                                    )}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={
                                                    toggleVoiceRecordingPause
                                                }
                                                disabled={
                                                    submitting
                                                }
                                                className="rounded-lg border border-(--border) p-2 transition hover:bg-white/5"
                                            >
                                                {isRecordingPaused ? (
                                                    <Play
                                                        size={
                                                            15
                                                        }
                                                    />
                                                ) : (
                                                    <Pause
                                                        size={
                                                            15
                                                        }
                                                    />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    stopVoiceRecording
                                                }
                                                disabled={
                                                    submitting
                                                }
                                                className="rounded-lg bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20"
                                            >
                                                <Square
                                                    size={
                                                        15
                                                    }
                                                    fill="currentColor"
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isRecording && (
                                    <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-400/10 text-red-300">
                                                <Mic
                                                    size={
                                                        18
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-red-200">
                                                    {isRecordingPaused
                                                        ? "Recording paused"
                                                        : "Recording voice note"}
                                                </p>

                                                <p className="mt-1 text-[11px] opacity-40">
                                                    {isRecordingPaused
                                                        ? "Press resume to continue."
                                                        : "Speak clearly, then press stop when finished."}
                                                </p>
                                            </div>

                                            <span className="font-mono text-sm text-red-300">
                                                {formatRecordingTime(
                                                    recordingTime
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {voiceNotes.length >
                                    0 ? (
                                    <div className="mt-4 space-y-2.5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-[10px] font-medium uppercase tracking-wider opacity-40">
                                                Recorded
                                                Voice
                                                Notes
                                            </p>

                                            <span className="rounded-md border border-(--border) px-2 py-1 text-[10px] opacity-50">
                                                {
                                                    voiceNotes.length
                                                }{" "}
                                                {voiceNotes.length ===
                                                    1
                                                    ? "note"
                                                    : "notes"}
                                            </span>
                                        </div>

                                        {voiceNotes.map(
                                            (
                                                voice,
                                                index
                                            ) =>
                                                renderVoiceNote(
                                                    voice,
                                                    index,
                                                    true
                                                )
                                        )}
                                    </div>
                                ) : (
                                    !isRecording && (
                                        <div className="mt-4 rounded-xl border border-dashed border-(--border) bg-(--navy-800)/20 px-4 py-7 text-center">
                                            <Mic
                                                size={
                                                    20
                                                }
                                                className="mx-auto opacity-30"
                                            />

                                            <p className="mt-2 text-xs font-medium opacity-50">
                                                No voice
                                                notes
                                                added
                                            </p>

                                            <p className="mt-1 text-[11px] opacity-30">
                                                Press
                                                "Add Voice"
                                                to record
                                                a message.
                                            </p>
                                        </div>
                                    )
                                )}
                            </section>

                            {/* YOUR NOTE */}

                            <section className="mt-7 sm:mt-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                        <Send
                                            size={
                                                14
                                            }
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Your Note
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Add a
                                            message for
                                            your teacher
                                        </p>
                                    </div>
                                </div>

                                <div className="relative mt-4">
                                    <textarea
                                        id="task-note"
                                        value={note}
                                        onChange={(
                                            event
                                        ) =>
                                            setNote(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={6}
                                        placeholder="Write something for your teacher..."
                                        className="min-h-32 w-full resize-y rounded-xl border border-(--border) bg-(--navy-800)/30 px-4 py-4 pr-20 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-(--gold-500)/60 focus:bg-(--navy-800)/50"
                                    />

                                    <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-(--navy-900) px-2 py-1 text-[10px] opacity-30">
                                        Optional
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* FOOTER */}

                        <div className="shrink-0 border-t border-(--border) bg-(--navy-800)/30 px-4 py-3.5 sm:px-6 sm:py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="hidden text-[11px] leading-5 opacity-30 sm:block">
                                    {resubmitMode
                                        ? "Only changed information will be resubmitted."
                                        : "Make sure your work is ready before submitting."}
                                </p>

                                <div className="flex w-full gap-2 sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={
                                            closeSubmitModal
                                        }
                                        disabled={
                                            submitting
                                        }
                                        className="flex-1 rounded-xl border border-(--border) px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            handleSubmit
                                        }
                                        disabled={
                                            submitting ||
                                            isRecording ||
                                            (resubmitMode &&
                                                !hasChanges())
                                        }
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--gold-500) px-4 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
                                    >
                                        {submitting && (
                                            <Loader2
                                                size={
                                                    16
                                                }
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
            ====================================================== */}

            {viewTask && (
                <div
                    className="fixed inset-0 z-100 flex items-end justify-center overflow-y-auto bg-black/75 px-0 py-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeViewModal();
                        }
                    }}
                >
                    <div className="flex max-h-[100dvh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-(--border) bg-(--navy-900) shadow-2xl sm:max-h-[94vh] sm:rounded-2xl">
                        {/* HEADER */}

                        <div className="relative shrink-0 border-b border-(--border) bg-(--navy-800)/50 px-4 py-4 sm:px-6 sm:py-5">
                            <div className="absolute left-0 top-0 h-full w-1 bg-(--gold-500)" />

                            <div className="flex min-w-0 items-start justify-between gap-3 pl-2 sm:gap-5">
                                <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />

                                        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-green-300 sm:text-[10px]">
                                            Submitted Task
                                        </span>
                                    </div>

                                    <h2 className="max-w-2xl break-words text-lg font-semibold leading-tight text-white sm:text-2xl">
                                        {
                                            viewTask.title
                                        }
                                    </h2>

                                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
                                        <span className="inline-flex items-center rounded-lg border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1.5 text-[10px] font-semibold text-(--gold-500)">
                                            {
                                                viewTask.difficulty
                                            }
                                            x
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70">
                                            <Clock3
                                                size={
                                                    13
                                                }
                                            />

                                            {formatDeadline(
                                                viewTask.deadline
                                            )}
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--navy-900)/60 px-2 py-1.5 text-[10px] opacity-70">
                                            <UserRound
                                                size={
                                                    13
                                                }
                                            />

                                            <span className="max-w-[180px] truncate">
                                                {viewTask
                                                    .teacher
                                                    ?.name ||
                                                    viewTask
                                                        .teacher
                                                        ?.username ||
                                                    "Unknown"}
                                            </span>
                                        </span>

                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-400/30 bg-green-400/10 px-2 py-1.5 text-[10px] font-medium text-green-300">
                                            <Check
                                                size={
                                                    13
                                                }
                                            />

                                            Submitted
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium ${getSubmissionStatus(
                                                viewTask
                                            ) ===
                                                    "ontime"
                                                    ? "border-green-400/30 bg-green-400/10 text-green-300"
                                                    : "border-red-400/30 bg-red-400/10 text-red-300"
                                                }`}
                                        >
                                            {getSubmissionStatus(
                                                viewTask
                                            ) ===
                                                "ontime"
                                                ? "Ontime"
                                                : "Delayed"}
                                        </span>

                                        {viewTask.isChecked && (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-(--gold-500)/30 bg-(--gold-500)/10 px-2 py-1.5 text-[10px] font-medium text-(--gold-500)">
                                                <Check
                                                    size={
                                                        13
                                                    }
                                                />

                                                Checked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        closeViewModal
                                    }
                                    className="shrink-0 rounded-xl p-2 text-white/50 transition hover:bg-white/5 hover:text-white"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}

                        <div className="scholar-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
                            {/* DESCRIPTION */}

                            <section>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                        <FileText
                                            size={
                                                15
                                            }
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Task Description
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Instructions
                                            from your
                                            teacher
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

                            <section className="mt-6 rounded-2xl border border-(--border) bg-(--navy-800)/20 p-4 sm:mt-8 sm:p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-green-400/20 bg-green-400/10 text-green-300">
                                        <Paperclip
                                            size={
                                                16
                                            }
                                        />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">
                                            Your
                                            Submission
                                        </h3>

                                        <p className="mt-0.5 text-[11px] opacity-40">
                                            Work
                                            submitted
                                            to your
                                            teacher
                                        </p>
                                    </div>
                                </div>

                                {getSubmission(
                                    viewTask
                                ) && (
                                        <>
                                            <div className="mt-4 rounded-lg border border-(--border) bg-(--navy-900)/50 px-3 py-2.5">
                                                <p className="text-[10px] uppercase tracking-wider opacity-30">
                                                    Submitted
                                                    On
                                                </p>

                                                <p className="mt-1 text-xs opacity-60">
                                                    {formatDateTime(
                                                        getSubmission(
                                                            viewTask
                                                        )!
                                                            .submittedAt
                                                    )}
                                                </p>
                                            </div>

                                            <div className="mt-5">
                                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                    Attached
                                                    Work
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
                                                            size={
                                                                20
                                                            }
                                                            className="mx-auto opacity-30"
                                                        />

                                                        <p className="mt-2 text-xs opacity-40">
                                                            No
                                                            media
                                                            attached
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* =================================================
                                            VOICE NOTES
                                        ================================================== */}

                                            <div className="mt-6">
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                            Voice
                                                            Notes
                                                        </p>

                                                        <p className="mt-1 text-[11px] opacity-30">
                                                            Recorded
                                                            voice
                                                            messages
                                                        </p>
                                                    </div>

                                                    {(getSubmission(
                                                        viewTask
                                                    )!
                                                        .voiceNotes
                                                        ?.length ||
                                                        0) >
                                                        0 && (
                                                            <span className="rounded-md border border-(--gold-500)/20 bg-(--gold-500)/5 px-2 py-1 text-[10px] text-(--gold-500)">
                                                                {
                                                                    getSubmission(
                                                                        viewTask
                                                                    )!
                                                                        .voiceNotes
                                                                        ?.length
                                                                }{" "}
                                                                {getSubmission(
                                                                    viewTask
                                                                )!
                                                                    .voiceNotes
                                                                    ?.length ===
                                                                    1
                                                                    ? "note"
                                                                    : "notes"}
                                                            </span>
                                                        )}
                                                </div>

                                                {(getSubmission(
                                                    viewTask
                                                )!
                                                    .voiceNotes
                                                    ?.length ||
                                                    0) >
                                                    0 ? (
                                                    <div className="space-y-2.5">
                                                        {getSubmission(
                                                            viewTask
                                                        )!
                                                            .voiceNotes
                                                            ?.map(
                                                                (
                                                                    voice
                                                                ) =>
                                                                    renderVoiceNote(
                                                                        {
                                                                            id: voice.id,
                                                                            voiceNoteId:
                                                                                voice.id,
                                                                            url: voice.url,
                                                                            fileName:
                                                                                voice.fileName,
                                                                            resourceType:
                                                                                "audio",
                                                                            format:
                                                                                voice.fileName
                                                                                    .split(
                                                                                        "."
                                                                                    )
                                                                                    .pop()
                                                                                    ?.toLowerCase() ||
                                                                                null,
                                                                            bytes:
                                                                                voice.bytes,
                                                                            mimeType:
                                                                                voice.mimeType,
                                                                            duration:
                                                                                voice.duration,
                                                                        },
                                                                        0
                                                                    )
                                                            )}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-(--border) px-4 py-6 text-center">
                                                        <Mic
                                                            size={
                                                                20
                                                            }
                                                            className="mx-auto opacity-30"
                                                        />

                                                        <p className="mt-2 text-xs opacity-40">
                                                            No
                                                            voice
                                                            notes
                                                            attached
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* NOTE */}

                                            <div className="mt-5">
                                                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                    Your
                                                    Note
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
                                                        No note
                                                        was
                                                        added
                                                        with
                                                        this
                                                        submission.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                            </section>

                            {/* TEACHER REVIEW */}

                            <section className="mt-5 rounded-2xl border border-(--border) bg-(--navy-800)/20 p-4 sm:mt-6 sm:p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--gold-500)/20 bg-(--gold-500)/10 text-(--gold-500)">
                                            <Check
                                                size={
                                                    16
                                                }
                                            />
                                        </div>

                                        <div>
                                            <h3 className="font-semibold">
                                                Teacher
                                                Review
                                            </h3>

                                            <p className="mt-0.5 text-[11px] opacity-40">
                                                Feedback
                                                and
                                                evaluation
                                            </p>
                                        </div>
                                    </div>

                                    {viewTask.review && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase tracking-wider opacity-30">
                                                Points
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
                                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-xl border border-(--border) bg-(--navy-900)/50 p-4">
                                                <p className="text-[10px] uppercase tracking-wider opacity-30">
                                                    Teacher
                                                    Rating
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
                                                        /5
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-(--gold-500)/20 bg-(--gold-500)/5 p-4">
                                                <p className="text-[10px] uppercase tracking-wider opacity-40">
                                                    Total
                                                    Score
                                                </p>

                                                <p className="mt-2 text-2xl font-semibold text-(--gold-500)">
                                                    {calculateTotalScore(
                                                        viewTask.difficulty,
                                                        viewTask.review
                                                    )}
                                                </p>

                                                <p className="mt-1 text-[10px] opacity-30">
                                                    Difficulty
                                                    × teacher
                                                    score
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider opacity-40">
                                                Teacher
                                                Message
                                            </p>

                                            {viewTask
                                                .review
                                                .note ? (
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
                                                    No
                                                    teacher
                                                    message
                                                    was
                                                    provided.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="mt-5 rounded-xl border border-dashed border-(--border) bg-(--navy-900)/30 px-4 py-7 text-center">
                                        <Clock3
                                            size={
                                                19
                                            }
                                            className="mx-auto opacity-40"
                                        />

                                        <p className="mt-3 text-sm font-medium opacity-60">
                                            Awaiting
                                            Teacher
                                            Review
                                        </p>

                                        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 opacity-30">
                                            Your submission
                                            has been
                                            received. The
                                            teacher has not
                                            checked this
                                            task yet.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* FOOTER */}

                        <div className="shrink-0 border-t border-(--border) bg-(--navy-800)/30 px-4 py-3.5 sm:px-6 sm:py-4">
                            <div className="flex w-full justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        closeViewModal
                                    }
                                    className="flex-1 rounded-xl border border-(--border) px-4 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/5 sm:flex-none sm:px-5"
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        startResubmit
                                    }
                                    className="flex-1 rounded-xl bg-(--gold-500) px-4 py-3 text-sm font-semibold text-(--navy-900) transition hover:opacity-90 sm:flex-none sm:px-5"
                                >
                                    Resubmit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =====================================================
                MEDIA PREVIEW
            ====================================================== */}

            {previewMedia && (
                <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/85 p-3 sm:p-4">
                    <button
                        type="button"
                        onClick={() =>
                            setPreviewMedia(
                                null
                            )
                        }
                        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-3 text-white sm:right-5 sm:top-5"
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
                            className="max-h-[88vh] max-w-[96vw] rounded-xl object-contain sm:max-h-[85vh] sm:max-w-[90vw]"
                        />
                    ) : isPdf(
                        previewMedia
                    ) ? (
                        <div className="h-[88vh] w-[96vw] max-w-5xl overflow-hidden rounded-xl bg-white sm:h-[85vh] sm:w-[90vw]">
                            <iframe
                                src={`/api/student/tasks/pdf-preview?url=${encodeURIComponent(
                                    previewMedia.url
                                )}`}
                                title={
                                    previewMedia.fileName
                                }
                                className="h-full w-full"
                            />
                        </div>
                    ) : isAudio(
                        previewMedia
                    ) ? (
                        <div className="mx-3 w-full max-w-xl rounded-2xl border border-white/10 bg-(--navy-900) p-6 text-center sm:p-10">
                            <Volume2
                                size={46}
                                className="mx-auto mb-4 text-(--gold-500)"
                            />

                            <p className="break-words font-medium">
                                {
                                    previewMedia.fileName
                                }
                            </p>

                            <audio
                                controls
                                autoPlay
                                src={
                                    previewMedia.url
                                }
                                className="mt-6 w-full"
                            />
                        </div>
                    ) : (
                        <div className="mx-3 max-w-full rounded-2xl border border-white/10 bg-(--navy-900) p-7 text-center sm:mx-0 sm:p-12">
                            <FileText
                                size={48}
                                className="mx-auto mb-4 opacity-50"
                            />

                            <p className="max-w-[280px] break-words font-medium sm:max-w-md">
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
                                className="mt-6 inline-flex rounded-xl bg-(--gold-500) px-5 py-3 text-sm font-semibold text-(--navy-900)"
                            >
                                Open File
                            </a>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

