"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
  Clock3,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type RoutineItem = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  durationMin: number;
  sortOrder: number;
};

type RoutineTemplate = {
  id: string;
  name: string;
  items: RoutineItem[];
};

type PageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

type EditableRoutine = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: string;
  durationMinutes: number;
};

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 100;
const TEMPLATE_NAME_MAX_LENGTH = 100;

function convertToMinutes(time: string) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
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

  const hours = Math.floor(
    difference / 60
  );

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

  const [hours, minutes] = time
    .split(":")
    .map(Number);

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

function formatDuration(minutes: number) {
  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  return `${hours}:${remainingMinutes
    .toString()
    .padStart(2, "0")}`;
}

export default function EditRoutineTemplatePage({
  params,
}: PageProps) {
  const [templateId, setTemplateId] =
    useState("");

  const [templateName, setTemplateName] =
    useState("");

  const [routines, setRoutines] =
    useState<EditableRoutine[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingRoutineId,
    setEditingRoutineId,
  ] = useState<string | null>(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [startTime, setStartTime] =
    useState("08:00");

  const [endTime, setEndTime] =
    useState("09:00");

  const [deleteRoutineId, setDeleteRoutineId] =
    useState<string | null>(null);

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

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError("");

        const { templateId } =
          await params;

        setTemplateId(templateId);

        const response =
          await fetch(
            `/api/head/templates/routines/${templateId}`,
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
              "Failed to load routine template."
          );

          return;
        }

        const template:
          RoutineTemplate =
          data.template;

        setTemplateName(
          template.name
        );

        setRoutines(
          template.items.map(
            (routine: RoutineItem) => ({
              id: routine.id,
              title: routine.title,
              description:
                routine.description ||
                "",
              startTime:
                routine.startTime,
              endTime:
                routine.endTime,
              duration:
                formatDuration(
                  routine.durationMin
                ),
              durationMinutes:
                routine.durationMin,
            })
          )
        );
      } catch (error) {
        console.error(
          "LOAD ROUTINE TEMPLATE ERROR:",
          error
        );

        setError(
          "Something went wrong while loading the routine template."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [params]);

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
    routine: EditableRoutine
  ) {
    setEditingRoutineId(
      routine.id
    );

    setTitle(routine.title);
    setDescription(
      routine.description
    );
    setStartTime(
      routine.startTime
    );
    setEndTime(
      routine.endTime
    );

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    resetRoutineForm();
  }

  function addOrUpdateRoutine() {
    const cleanTitle =
      title.trim();

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
      setRoutines(
        (current) =>
          current.map(
            (routine: EditableRoutine) => {
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
            }
          )
      );
    } else {
      const newRoutine: EditableRoutine =
        {
          id: crypto.randomUUID(),
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

      setRoutines(
        (current) => [
          ...current,
          newRoutine,
        ]
      );
    }

    closeModal();
  }

  function requestDeleteRoutine(
    id: string
  ) {
    setDeleteRoutineId(id);
  }

  function cancelDeleteRoutine() {
    setDeleteRoutineId(null);
  }

  function confirmDeleteRoutine() {
    if (!deleteRoutineId) {
      return;
    }

    setRoutines(
      (current) =>
        current.filter(
          (routine: EditableRoutine) =>
            routine.id !==
            deleteRoutineId
        )
    );

    setDeleteRoutineId(null);
  }

  async function handleSaveTemplate() {
    const cleanTemplateName =
      templateName.trim();

    if (!cleanTemplateName) {
      setSaveMessage(
        "Please enter a template name."
      );

      return;
    }

    if (
      cleanTemplateName.length >
      TEMPLATE_NAME_MAX_LENGTH
    ) {
      setSaveMessage(
        "Template name cannot exceed 100 characters."
      );

      return;
    }

    if (!templateId) {
      setSaveMessage(
        "Template ID is missing."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      const response =
        await fetch(
          `/api/head/templates/routines/${templateId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name: cleanTemplateName,
              items: routines.map(
                (
                  routine: EditableRoutine,
                  index: number
                ) => ({
                  title:
                    routine.title.trim(),
                  description:
                    routine.description.trim(),
                  startTime:
                    routine.startTime,
                  endTime:
                    routine.endTime,
                  durationMin:
                    routine.durationMinutes,
                  sortOrder: index,
                })
              ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to update routine template."
        );

        return;
      }

      setSaveMessage(
        "Routine template updated successfully."
      );
    } catch (error) {
      console.error(
        "UPDATE ROUTINE TEMPLATE ERROR:",
        error
      );

      setError(
        "Something went wrong while saving the routine template."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:space-y-8 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Edit Routine Template
          </h1>

          <p className="mt-1 text-sm opacity-60">
            Loading template...
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-(--border)
            bg-(--navy-900)
            px-4
            py-14
            text-center
            sm:px-6
            sm:py-16
          "
        >
          <p className="text-sm opacity-50">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (error && !templateName) {
    return (
      <div className="space-y-6 p-4 sm:space-y-8 sm:p-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link
            href="/head/templates/routines"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-(--border)
              transition
              hover:bg-(--navy-800)
            "
          >
            <ArrowLeft
              size={18}
              strokeWidth={1.8}
            />
          </Link>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Edit Routine Template
            </h1>

            <p className="mt-1 text-sm opacity-60">
              Unable to load this template.
            </p>
          </div>
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
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-8">
      {/* BACK */}

      <Link
        href={`/head/templates/routines/${templateId}`}
        className="
          mb-5
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
          sm:mb-6
        "
      >
        <ArrowLeft
          size={18}
          strokeWidth={1.8}
        />

        Back to Template
      </Link>

      {/* HEADER */}

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
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Edit Routine Template
          </h1>

          <p className="mt-1 max-w-xl text-sm leading-6 opacity-60">
            Update the template and its scheduled routines.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveTemplate}
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

          {saving
            ? "Saving..."
            : "Save Changes"}
        </button>
      </div>

      {/* MESSAGES */}

      {error && (
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
          {error}
        </div>
      )}

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
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="template-name"
            className="text-sm font-medium"
          >
            Template Name
          </label>

          <span
            className={`
              shrink-0
              text-xs
              ${
                templateName.length >=
                TEMPLATE_NAME_MAX_LENGTH
                  ? "text-red-400"
                  : "opacity-40"
              }
            `}
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
            {/* Desktop timeline line */}

            <div
              className="
                absolute
                bottom-3
                left-[100px]
                top-12
                hidden
                w-px
                bg-(--border)
                sm:block
              "
            />

            <div className="space-y-5 sm:space-y-7">
              {routines.map(
                (
                  routine: EditableRoutine
                ) => (
                  <div
                    key={routine.id}
                    className="
                      relative
                      grid
                      grid-cols-1
                      gap-2
                      sm:grid-cols-[19px_auto_minmax(0,1fr)]
                      sm:items-center
                      sm:gap-x-4
                    "
                  >
                    {/* MOBILE TIME */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        px-1
                        sm:hidden
                      "
                    >
                      <Clock3
                        size={14}
                        strokeWidth={1.8}
                        className="text-(--gold-500)"
                      />

                      <span className="font-mono text-xs opacity-60">
                        {formatTime(
                          routine.startTime
                        )}
                      </span>
                    </div>

                    {/* DESKTOP TIME */}

                    <div className="hidden whitespace-nowrap text-sm sm:block">
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
                        hidden
                        h-3
                        w-3
                        rounded-full
                        border-2
                        border-(--gold-500)
                        bg-(--gold-500)
                        sm:ml-15
                        sm:mr-2
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
                        border-(--gold-400)/20
                        border-l-3
                        border-l-(--gold-500)
                        bg-(--navy-900)
                        sm:min-h-28
                        sm:rounded-r-2xl
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
                          sm:min-h-28
                          sm:flex-row
                          sm:items-center
                          sm:gap-4
                          sm:px-5
                        "
                      >
                        {/* CONTENT */}

                        <div
                          className="
                            min-w-0
                            flex-1
                            sm:self-center
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
                              sm:leading-normal
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
                              text-sm
                              leading-5
                              opacity-60
                            "
                          >
                            {routine.description ||
                              "No description provided."}
                          </p>
                        </div>

                        {/* ACTIONS / DURATION */}

                        <div
                          className="
                            flex
                            w-full
                            items-center
                            justify-between
                            gap-2
                            border-t
                            border-(--border)
                            mb-12
                            sm:w-auto
                            sm:shrink-0
                            sm:justify-start
                            sm:border-0
                            sm:pt-0
                          "
                        >
                          <div className="flex items-center gap-1.5 text-xs opacity-40 sm:hidden">
                            <Clock3
                              size={14}
                              strokeWidth={1.8}
                            />

                            <span>
                              {formatTime(
                                routine.startTime
                              )}{" "}
                              –{" "}
                              {formatTime(
                                routine.endTime
                              )}
                            </span>
                          </div>

                          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2">
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
                                sm:h-8
                                sm:w-8
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
                                requestDeleteRoutine(
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
                                sm:h-8
                                sm:w-8
                              "
                              aria-label={`Delete ${routine.title}`}
                            >
                              <Trash2
                                size={15}
                                strokeWidth={1.8}
                              />
                            </button>

                            <span
                              className="
                                rounded-lg
                                bg-(--navy-800)
                                px-2.5
                                py-1.5
                                font-mono
                                text-xs
                                font-medium
                                text-(--gold-500)
                                sm:px-3
                                sm:text-sm
                              "
                            >
                              {
                                routine.duration
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* ADD ROUTINE */}

              <div
                className="
                  relative
                  flex
                  min-h-14
                  items-center
                  gap-3
                  sm:gap-6
                "
              >
                {/* Desktop timeline circle */}

                <div
                  className="
                    relative
                    z-10
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
                    sm:ml-23.75
                    sm:flex
                  "
                />

                <button
                  type="button"
                  onClick={openAddModal}
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
                    size={17}
                    strokeWidth={2}
                  />

                  Add Routine
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDIT / ADD MODAL */}

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
            px-0
            py-0
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
              rounded-t-2xl
              border
              border-(--border)
              bg-(--navy-900)
              shadow-2xl
              sm:rounded-2xl
            "
          >
            {/* MODAL HEADER */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
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
                  {isEditing
                    ? "Edit Routine"
                    : "Add Routine"}
                </h2>

                <p className="mt-1 text-xs leading-5 opacity-50">
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
                "
                aria-label="Close"
              >
                <X
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
              {/* TITLE */}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="routine-title"
                    className="text-sm font-medium"
                  >
                    Title
                  </label>

                  <span
                    className={`
                      shrink-0
                      text-xs
                      ${
                        title.length >=
                        TITLE_MAX_LENGTH
                          ? "text-red-400"
                          : "opacity-40"
                      }
                    `}
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
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="routine-description"
                    className="text-sm font-medium"
                  >
                    Description
                  </label>

                  <span className="shrink-0 text-xs opacity-40">
                    {description.length}/
                    {
                      DESCRIPTION_MAX_LENGTH
                    }
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
                    sm:grid-cols-[1fr_auto_1fr_auto]
                    sm:items-end
                  "
                >
                  {/* START */}

                  <div>
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
                        mt-1
                        w-full
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-800)
                        px-3
                        py-2.5
                        text-sm
                        outline-none
                        focus:border-(--gold-500)
                      "
                    />
                  </div>

                  <span className="hidden pb-3 opacity-40 sm:block">
                    —
                  </span>

                  {/* END */}

                  <div>
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
                        mt-1
                        w-full
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-800)
                        px-3
                        py-2.5
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
                    "
                  >
                    <span className="text-xs opacity-50">
                      Total
                    </span>

                    <span className="text-sm font-semibold text-(--gold-500)">
                      {duration?.formatted ||
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

            {/* MODAL FOOTER */}

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
                  addOrUpdateRoutine
                }
                disabled={
                  !title.trim() ||
                  !duration
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
                  py-2.5
                  text-sm
                  font-semibold
                  text-(--navy-900)
                  transition
                  hover:opacity-90
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

                {isEditing
                  ? "Save Changes"
                  : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ROUTINE MODAL */}

      {deleteRoutineId && (
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
            py-0
            sm:items-center
            sm:px-4
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cancelDeleteRoutine();
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              rounded-t-2xl
              border
              border-(--border)
              bg-(--navy-900)
              shadow-2xl
              sm:rounded-2xl
            "
          >
            <div className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold">
                Delete Routine?
              </h2>

              <p className="mt-2 text-sm leading-6 opacity-60">
                This routine will be removed from
                the template when you save the
                template.
              </p>
            </div>

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
                onClick={
                  cancelDeleteRoutine
                }
                className="
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
                  confirmDeleteRoutine
                }
                className="
                  inline-flex
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

                Delete Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}