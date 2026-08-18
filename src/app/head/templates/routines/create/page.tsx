"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 100;
const TEMPLATE_NAME_MAX_LENGTH = 100;

type RoutineItem = {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: string;
    durationMinutes: number;
};

function convertToMinutes(time: string) {
    if (!time) {
        return null;
    }

    const parts = time.split(":");

    if (parts.length !== 2) {
        return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    return hours * 60 + minutes;
}

function calculateDuration(
    startTime: string,
    endTime: string
) {
    const start = convertToMinutes(startTime);
    const end = convertToMinutes(endTime);

    if (start === null || end === null) {
        return null;
    }

    let difference = end - start;

    if (difference < 0) {
        difference += 24 * 60;
    }

    if (difference === 0) {
        return null;
    }

    const hours = Math.floor(difference / 60);
    const minutes = difference % 60;

    return {
        totalMinutes: difference,
        formatted: `${hours}:${minutes
            .toString()
            .padStart(2, "0")}`,
    };
}

function formatTime(time: string) {
    if (!time) {
        return "";
    }

    const parts = time.split(":");

    if (parts.length !== 2) {
        return "";
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

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

export default function CreateRoutinePage() {
    const router = useRouter();

    const [templateName, setTemplateName] =
        useState("");

    const [routines, setRoutines] =
        useState<RoutineItem[]>([]);

    const [modalOpen, setModalOpen] =
        useState(false);

    const [editingRoutineId, setEditingRoutineId] =
        useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] =
        useState("");

    const [startTime, setStartTime] =
        useState("08:00");

    const [endTime, setEndTime] =
        useState("09:00");

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] =
        useState("");

    const duration = useMemo(
        () =>
            calculateDuration(
                startTime,
                endTime
            ),
        [startTime, endTime]
    );

    const isEditing =
        editingRoutineId !== null;

    function resetRoutineForm() {
        setTitle("");
        setDescription("");
        setStartTime("08:00");
        setEndTime("09:00");
        setEditingRoutineId(null);
    }

    function openAddModal() {
        resetRoutineForm();
        setModalOpen(true);
    }

    function openEditModal(
        routine: RoutineItem
    ) {
        setEditingRoutineId(routine.id);
        setTitle(routine.title);
        setDescription(routine.description);
        setStartTime(routine.startTime);
        setEndTime(routine.endTime);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        resetRoutineForm();
    }

    function addOrUpdateRoutine() {
        const cleanTitle = title.trim();
        const cleanDescription =
            description.trim();

        if (!cleanTitle) {
            return;
        }

        if (
            cleanTitle.length >
            TITLE_MAX_LENGTH
        ) {
            return;
        }

        if (
            cleanDescription.length >
            DESCRIPTION_MAX_LENGTH
        ) {
            return;
        }

        if (!duration) {
            return;
        }

        if (isEditing) {
            setRoutines((current) =>
                current.map((routine) => {
                    if (
                        routine.id !==
                        editingRoutineId
                    ) {
                        return routine;
                    }

                    return {
                        ...routine,
                        title: cleanTitle,
                        description:
                            cleanDescription,
                        startTime,
                        endTime,
                        duration:
                            duration.formatted,
                        durationMinutes:
                            duration.totalMinutes,
                    };
                })
            );
        } else {
            const newRoutine: RoutineItem = {
                id: crypto.randomUUID(),
                title: cleanTitle,
                description: cleanDescription,
                startTime,
                endTime,
                duration:
                    duration.formatted,
                durationMinutes:
                    duration.totalMinutes,
            };

            setRoutines((current) => [
                ...current,
                newRoutine,
            ]);
        }

        closeModal();
    }

    function deleteRoutine(id: string) {
        setRoutines((current) =>
            current.filter(
                (routine) =>
                    routine.id !== id
            )
        );
    }

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
                "Template name cannot exceed 100 characters."
            );

            return;
        }

        if (routines.length === 0) {
            setSaveMessage(
                "Please add at least one routine."
            );

            return;
        }

        try {
            setSaving(true);
            setSaveMessage("");

            const response = await fetch(
                "/api/head/templates/routines",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        name: cleanName,
                        items: routines.map(
                            (routine, index) => ({
                                title: routine.title,
                                description: routine.description,
                                startTime: routine.startTime,
                                endTime: routine.endTime,
                                sortOrder: index,
                            })
                        ),
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                setSaveMessage(
                    data.message ||
                    "Failed to save routine template."
                );

                return;
            }

            router.push(
                "/head/templates/routines"
            );
        } catch (error) {
            console.error(
                "SAVE ROUTINE TEMPLATE ERROR:",
                error
            );

            setSaveMessage(
                "Something went wrong while saving the template."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="
                min-h-screen
                space-y-6
                px-3
                py-5
                sm:space-y-8
                sm:px-6
                sm:py-8
                lg:px-8
            "
        >
            {/* BACK */}

            <Link
                href="/head/templates/routines/"
                className="
                    inline-flex
                    min-h-10
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-(--border)
                    px-3
                    text-xs
                    opacity-70
                    transition
                    hover:bg-(--navy-800)
                    hover:text-(--gold-500)
                    hover:opacity-100
                    sm:text-sm
                "
            >
                <ArrowLeft
                    size={18}
                    strokeWidth={1.8}
                />

                Back to Templates
            </Link>

            {/* HEADER */}

            <div
                className="
                    flex
                    flex-col
                    items-start
                    gap-5
                    md:flex-row
                    md:items-center
                    md:justify-between
                    md:gap-6
                "
            >
                <div className="min-w-0">
                    <h1
                        className="
                            font-heading
                            text-3xl
                            font-semibold
                            tracking-wide
                            text-white
                            sm:text-4xl
                        "
                    >
                        Create Routine Template
                    </h1>

                    <p
                        className="
                            mt-2
                            max-w-2xl
                            text-xs
                            leading-5
                            opacity-60
                            sm:mt-1
                            sm:text-sm
                            sm:leading-normal
                        "
                    >
                        Create a routine template by
                        adding scheduled routines.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSaveTemplate}
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
                        active:scale-[0.98]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        md:w-auto
                        md:shrink-0
                    "
                >
                    <Save
                        size={17}
                        strokeWidth={2}
                    />

                    <span>
                        {saving
                            ? "Saving..."
                            : "Save Routine Template"}
                    </span>
                </button>
            </div>

            {/* SAVE MESSAGE */}

            {saveMessage && (
                <div
                    className="
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-3
                        py-3
                        text-xs
                        leading-5
                        sm:px-4
                        sm:text-sm
                    "
                >
                    {saveMessage}
                </div>
            )}

            {/* TEMPLATE NAME */}

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
                        items-center
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

                    <span
                        className={`shrink-0 text-[10px] sm:text-xs ${
                            templateName.length >=
                            TEMPLATE_NAME_MAX_LENGTH
                                ? "text-red-400"
                                : "opacity-40"
                        }`}
                    >
                        {templateName.length}/
                        {TEMPLATE_NAME_MAX_LENGTH}
                    </span>
                </div>

                <input
                    id="template-name"
                    type="text"
                    maxLength={
                        TEMPLATE_NAME_MAX_LENGTH
                    }
                    value={templateName}
                    onChange={(event) =>
                        setTemplateName(
                            event.target.value
                        )
                    }
                    placeholder="Enter routine template name"
                    className="
                        mt-2
                        w-full
                        max-w-xl
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-800)
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        placeholder:opacity-40
                        focus:border-(--gold-500)
                    "
                />
            </section>

            {/* TIMELINE */}

            <section>
                <div className="border-t border-(--border)" />

                <div className="mt-6 sm:mt-8">
                    <div className="relative">
                        {/* MOBILE TIMELINE LINE */}

                        <div
                            className="
                                absolute
                                bottom-3
                                left-3
                                top-7
                                w-px
                                bg-(--border)
                                sm:hidden
                            "
                        />

                        {/* DESKTOP TIMELINE LINE */}

                        <div
                            className="
                                absolute
                                bottom-3
                                left-25
                                top-12
                                hidden
                                w-px
                                bg-(--border)
                                sm:block
                            "
                        />

                        <div className="space-y-4 sm:space-y-7">
                            {routines.map(
                                (routine) => (
                                    <div
                                        key={routine.id}
                                        className="
                                            relative
                                            grid
                                            grid-cols-[25px_minmax(0,1fr)]
                                            items-start
                                            gap-x-3
                                            sm:grid-cols-[19px_auto_minmax(0,1fr)]
                                            sm:items-center
                                            sm:gap-x-4
                                        "
                                    >
                                        {/* MOBILE CIRCLE */}

                                        <div
                                            className="
                                                relative
                                                z-10
                                                mt-5
                                                h-2.5
                                                w-2.5
                                                rounded-full
                                                border-2
                                                border-(--gold-500)
                                                bg-(--gold-500)
                                                sm:hidden
                                            "
                                        />

                                        {/* DESKTOP TIME */}

                                        <div
                                            className="
                                                hidden
                                                whitespace-nowrap
                                                text-sm
                                                sm:block
                                            "
                                        >
                                            <span className="font-mono font-light opacity-70">
                                                {formatTime(
                                                    routine.startTime
                                                )}
                                            </span>
                                        </div>

                                        {/* DESKTOP CIRCLE */}

                                        <div
                                            className="
                                                relative
                                                z-10
                                                ml-15
                                                mr-2
                                                hidden
                                                h-3
                                                w-3
                                                rounded-full
                                                border-2
                                                border-(--gold-500)
                                                bg-(--gold-500)
                                                sm:block
                                            "
                                        />

                                        {/* CARD */}

                                        <div
                                            className="
                                                min-w-0
                                                overflow-hidden
                                                rounded-2xl
                                                border
                                                border-l-3
                                                border-y-(--gold-400)/20
                                                border-r-(--gold-400)/20
                                                border-l-(--gold-500)
                                                bg-(--navy-900)
                                                sm:h-28
                                                sm:rounded-r-2xl
                                            "
                                        >
                                            <div
                                                className="
                                                    flex
                                                    min-w-0
                                                    flex-col
                                                    gap-3
                                                    px-3
                                                    py-3
                                                    sm:h-full
                                                    sm:flex-row
                                                    sm:items-start
                                                    sm:gap-4
                                                    sm:px-5
                                                    sm:py-4
                                                "
                                            >
                                                {/* MOBILE TIME */}

                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-3
                                                        sm:hidden
                                                    "
                                                >
                                                    <span
                                                        className="
                                                            font-mono
                                                            text-xs
                                                            font-light
                                                            text-(--gold-500)
                                                        "
                                                    >
                                                        {formatTime(
                                                            routine.startTime
                                                        )}
                                                    </span>

                                                    <span
                                                        className="
                                                            rounded-lg
                                                            bg-(--navy-800)
                                                            px-2.5
                                                            py-1
                                                            font-mono
                                                            text-[11px]
                                                            font-medium
                                                            text-(--gold-500)
                                                        "
                                                    >
                                                        {routine.duration}
                                                    </span>
                                                </div>

                                                {/* CONTENT */}

                                                <div
                                                    className="
                                                        min-w-0
                                                        flex-1
                                                        overflow-hidden
                                                        sm:mt-3
                                                    "
                                                >
                                                    <h3
                                                        className="
                                                            break-words
                                                            text-base
                                                            font-semibold
                                                            leading-6
                                                            tracking-wide
                                                            sm:truncate
                                                            sm:text-xl
                                                        "
                                                        title={
                                                            routine.title
                                                        }
                                                    >
                                                        {routine.title}
                                                    </h3>

                                                    <p
                                                        className="
                                                            mt-1
                                                            line-clamp-2
                                                            overflow-hidden
                                                            text-xs
                                                            leading-5
                                                            opacity-60
                                                            sm:line-clamp-1
                                                            sm:text-sm
                                                        "
                                                    >
                                                        {routine.description ||
                                                            "No description provided."}
                                                    </p>
                                                </div>

                                                {/* ACTIONS + DESKTOP DURATION */}

                                                <div
                                                    className="
                                                        flex
                                                        w-full
                                                        shrink-0
                                                        items-center
                                                        justify-between
                                                        gap-2
                                                        border-t
                                                        border-(--border)
                                                        pt-2
                                                        sm:w-auto
                                                        sm:items-start
                                                        sm:justify-start
                                                        sm:border-0
                                                        sm:pt-0
                                                    "
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    routine
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
                                                                active:scale-95
                                                            "
                                                            aria-label={`Edit ${routine.title}`}
                                                        >
                                                            <Pencil
                                                                size={15}
                                                                strokeWidth={1.8}
                                                            />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteRoutine(
                                                                    routine.id
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
                                                                active:scale-95
                                                            "
                                                            aria-label={`Delete ${routine.title}`}
                                                        >
                                                            <Trash2
                                                                size={15}
                                                                strokeWidth={1.8}
                                                            />
                                                        </button>
                                                    </div>

                                                    <span
                                                        className="
                                                            hidden
                                                            rounded-lg
                                                            bg-(--navy-800)
                                                            px-3
                                                            py-1.5
                                                            font-mono
                                                            text-sm
                                                            font-medium
                                                            text-(--gold-500)
                                                            sm:block
                                                        "
                                                    >
                                                        {routine.duration}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* EMPTY */}

                            {routines.length ===
                                0 && (
                                    <div
                                        className="
                                            relative
                                            grid
                                            grid-cols-[25px_minmax(0,1fr)]
                                            items-center
                                            gap-x-3
                                            sm:flex
                                            sm:min-h-17.5
                                            sm:items-center
                                            sm:gap-6
                                        "
                                    >
                                        {/* MOBILE CIRCLE */}

                                        <div
                                            className="
                                                relative
                                                z-10
                                                ml-0.5
                                                h-2.5
                                                w-2.5
                                                rounded-full
                                                border-2
                                                border-(--gold-500)
                                                bg-(--navy-900)
                                                sm:hidden
                                            "
                                        />

                                        {/* DESKTOP CIRCLE */}

                                        <div
                                            className="
                                                relative
                                                z-10
                                                ml-23.75
                                                hidden
                                                h-3
                                                w-3
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                border-2
                                                border-(--gold-500)
                                                bg-(--navy-900)
                                                sm:flex
                                            "
                                        />

                                        <button
                                            type="button"
                                            onClick={openAddModal}
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
                                                active:scale-[0.98]
                                                sm:w-auto
                                            "
                                        >
                                            <Plus
                                                size={17}
                                                strokeWidth={2}
                                            />

                                            <span>
                                                Add Routine
                                            </span>
                                        </button>
                                    </div>
                                )}

                            {/* ADD BUTTON */}

                            {routines.length > 0 && (
                                <div
                                    className="
                                        relative
                                        grid
                                        grid-cols-[25px_minmax(0,1fr)]
                                        items-center
                                        gap-x-3
                                        sm:flex
                                        sm:min-h-13.75
                                        sm:items-center
                                        sm:gap-6
                                    "
                                >
                                    {/* MOBILE CIRCLE */}

                                    <div
                                        className="
                                            relative
                                            z-10
                                            ml-0.5
                                            h-2.5
                                            w-2.5
                                            rounded-full
                                            border-2
                                            border-(--gold-500)
                                            bg-(--navy-900)
                                            sm:hidden
                                        "
                                    />

                                    {/* DESKTOP CIRCLE */}

                                    <div
                                        className="
                                            relative
                                            z-10
                                            ml-23.75
                                            hidden
                                            h-3
                                            w-3
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-full
                                            border-2
                                            border-(--gold-500)
                                            bg-(--navy-900)
                                            sm:flex
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={openAddModal}
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
                                            active:scale-[0.98]
                                            sm:w-auto
                                        "
                                    >
                                        <Plus
                                            size={17}
                                            strokeWidth={2}
                                        />

                                        <span>
                                            Add Routine
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* MODAL */}

            {modalOpen && (
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
                        backdrop-blur-sm
                        sm:items-center
                        sm:px-4
                        sm:py-8
                    "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-2xl
                            overflow-hidden
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
                                gap-4
                                border-b
                                border-(--border)
                                px-4
                                py-4
                                sm:items-center
                                sm:px-6
                                sm:py-5
                            "
                        >
                            <div className="min-w-0">
                                <h2
                                    className="
                                        text-base
                                        font-semibold
                                        sm:text-lg
                                    "
                                >
                                    {isEditing
                                        ? "Edit Routine"
                                        : "Add Routine"}
                                </h2>

                                <p
                                    className="
                                        mt-1
                                        text-[11px]
                                        leading-4
                                        opacity-50
                                        sm:text-xs
                                    "
                                >
                                    {isEditing
                                        ? "Update this scheduled routine."
                                        : "Add a scheduled routine to this template."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    opacity-60
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                    active:scale-95
                                "
                                aria-label="Close"
                            >
                                <X
                                    size={18}
                                    strokeWidth={1.8}
                                />
                            </button>
                        </div>

                        {/* BODY */}

                        <div
                            className="
                                max-h-[70vh]
                                space-y-5
                                overflow-y-auto
                                px-4
                                py-5
                                sm:max-h-none
                                sm:px-6
                                sm:py-6
                            "
                        >
                            {/* TITLE */}

                            <div>
                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                    "
                                >
                                    <label
                                        htmlFor="routine-title"
                                        className="text-sm font-medium"
                                    >
                                        Title
                                    </label>

                                    <span
                                        className={`shrink-0 text-[10px] sm:text-xs ${
                                            title.length >=
                                            TITLE_MAX_LENGTH
                                                ? "text-red-400"
                                                : "opacity-40"
                                        }`}
                                    >
                                        {title.length}/
                                        {TITLE_MAX_LENGTH}
                                    </span>
                                </div>

                                <input
                                    id="routine-title"
                                    type="text"
                                    maxLength={
                                        TITLE_MAX_LENGTH
                                    }
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Morning Exercise"
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
                                        placeholder:opacity-40
                                        focus:border-(--gold-500)
                                    "
                                />
                            </div>

                            {/* DESCRIPTION */}

                            <div>
                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        gap-3
                                    "
                                >
                                    <label
                                        htmlFor="routine-description"
                                        className="text-sm font-medium"
                                    >
                                        Description
                                    </label>

                                    <span className="shrink-0 text-[10px] opacity-40 sm:text-xs">
                                        {description.length}/
                                        {DESCRIPTION_MAX_LENGTH}
                                    </span>
                                </div>

                                <textarea
                                    id="routine-description"
                                    value={description}
                                    maxLength={
                                        DESCRIPTION_MAX_LENGTH
                                    }
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Describe this routine..."
                                    rows={3}
                                    className="
                                        mt-2
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
                                        placeholder:opacity-40
                                        focus:border-(--gold-500)
                                    "
                                />
                            </div>

                            {/* TIME */}

                            <div>
                                <label className="text-sm font-medium">
                                    Time
                                </label>

                                <div
                                    className="
                                        mt-2
                                        grid
                                        grid-cols-1
                                        gap-3
                                        sm:flex
                                        sm:flex-wrap
                                        sm:items-center
                                    "
                                >
                                    {/* START */}

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-3
                                            rounded-xl
                                            border
                                            border-(--border)
                                            bg-(--navy-800)
                                            px-3
                                            py-2
                                            sm:border-0
                                            sm:bg-transparent
                                            sm:p-0
                                        "
                                    >
                                        <span className="text-xs opacity-50">
                                            Start
                                        </span>

                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(event) =>
                                                setStartTime(
                                                    event.target.value
                                                )
                                            }
                                            className="
                                                rounded-lg
                                                border
                                                border-(--border)
                                                bg-(--navy-800)
                                                px-3
                                                py-2
                                                text-sm
                                                outline-none
                                                focus:border-(--gold-500)
                                            "
                                        />
                                    </div>

                                    <span className="hidden opacity-40 sm:inline">
                                        —
                                    </span>

                                    {/* END */}

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-3
                                            rounded-xl
                                            border
                                            border-(--border)
                                            bg-(--navy-800)
                                            px-3
                                            py-2
                                            sm:border-0
                                            sm:bg-transparent
                                            sm:p-0
                                        "
                                    >
                                        <span className="text-xs opacity-50">
                                            End
                                        </span>

                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(event) =>
                                                setEndTime(
                                                    event.target.value
                                                )
                                            }
                                            className="
                                                rounded-lg
                                                border
                                                border-(--border)
                                                bg-(--navy-800)
                                                px-3
                                                py-2
                                                text-sm
                                                outline-none
                                                focus:border-(--gold-500)
                                            "
                                        />
                                    </div>

                                    {/* TOTAL */}

                                    <div
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-2
                                            rounded-xl
                                            bg-(--navy-800)
                                            px-3
                                            py-2.5
                                            sm:ml-auto
                                        "
                                    >
                                        <span className="text-xs opacity-50">
                                            Total
                                        </span>

                                        <span
                                            className="
                                                text-sm
                                                font-semibold
                                                text-(--gold-500)
                                            "
                                        >
                                            {duration?.formatted ??
                                                "0:00"}
                                        </span>
                                    </div>
                                </div>

                                {startTime &&
                                    endTime && (
                                        <p className="mt-2 text-xs opacity-40">
                                            {formatTime(
                                                startTime
                                            )}{" "}
                                            —{" "}
                                            {formatTime(
                                                endTime
                                            )}
                                        </p>
                                    )}

                                {startTime &&
                                    endTime &&
                                    !duration && (
                                        <p className="mt-2 text-xs text-red-400">
                                            Start and end time must
                                            be different.
                                        </p>
                                    )}
                            </div>
                        </div>

                        {/* FOOTER */}

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
                                sm:gap-3
                                sm:px-6
                            "
                        >
                            <button
                                type="button"
                                onClick={closeModal}
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
                                    active:scale-[0.98]
                                    sm:w-auto
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    addOrUpdateRoutine
                                }
                                disabled={
                                    !title.trim() ||
                                    !duration
                                }
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
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-(--navy-900)
                                    transition
                                    hover:opacity-90
                                    active:scale-[0.98]
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                    sm:w-auto
                                "
                            >
                                {isEditing ? (
                                    <Pencil
                                        size={16}
                                        strokeWidth={2}
                                    />
                                ) : (
                                    <Plus
                                        size={17}
                                        strokeWidth={2}
                                    />
                                )}

                                <span>
                                    {isEditing
                                        ? "Save Changes"
                                        : "Add"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}