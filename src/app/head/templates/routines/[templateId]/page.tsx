"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock3,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  createdAt: string;
  updatedAt: string;
  items: RoutineItem[];
};

type PageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

function formatTime(time: string) {
  if (!time) {
    return "";
  }

  const [hours, minutes] = time.split(":").map(Number);

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
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}:${remainingMinutes
    .toString()
    .padStart(2, "0")}`;
}

export default function RoutineTemplateViewPage({
  params,
}: PageProps) {
  const [template, setTemplate] =
    useState<RoutineTemplate | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError("");

        const { templateId } = await params;

        const response = await fetch(
          `/api/head/templates/routines/${templateId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.message ||
              "Failed to load routine template."
          );

          return;
        }

        setTemplate(data.template);
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

  async function handleDeleteTemplate() {
    if (!template || deleting) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `/api/head/templates/routines/${template.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to delete routine template."
        );

        setDeleting(false);
        return;
      }

      setShowDeleteConfirm(false);

      window.location.href =
        "/head/templates/routines";
    } catch (error) {
      console.error(
        "DELETE ROUTINE TEMPLATE ERROR:",
        error
      );

      setError(
        "Something went wrong while deleting the routine template."
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Routine Template
          </h1>

          <p className="mt-1 text-sm opacity-60">
            Loading routine template...
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

  if (error || !template) {
    return (
      <div className="min-h-screen space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
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
            aria-label="Back to routines"
          >
            <ArrowLeft
              size={18}
              strokeWidth={1.8}
            />
          </Link>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Routine Template
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
          {error || "Routine template not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8">
      {/* BACK */}

      <Link
        href="/head/templates/routines"
        className="
          mb-2
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

        <span>Back to Routines</span>
      </Link>

      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          items-start
          justify-between
          gap-5
          sm:gap-6
          lg:flex-row
          lg:items-start
        "
      >
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold sm:text-3xl">
            {template.name}
          </h1>

          <p className="mt-1 text-sm opacity-60">
            View the routines in this template.
          </p>
        </div>

        <div
          className="
            flex
            w-full
            items-center
            gap-2
            sm:w-auto
            sm:gap-3
          "
        >
          <Link
            href={`/head/templates/routines/${template.id}/edit`}
            className="
              inline-flex
              min-h-11
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-(--border)
              px-4
              py-3
              text-sm
              font-medium
              transition
              hover:bg-(--navy-800)
              hover:text-(--gold-500)
              sm:flex-none
            "
          >
            <Pencil
              size={17}
              strokeWidth={2}
            />

            Edit
          </Link>

          {/* Delete Button */}

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowDeleteConfirm(true);
            }}
            disabled={deleting}
            className="
              inline-flex
              min-h-11
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-red-400/30
              px-4
              py-3
              text-sm
              font-medium
              text-red-300
              transition
              hover:bg-red-400/10
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:flex-none
            "
          >
            <Trash2
              size={17}
              strokeWidth={2}
            />

            Delete
          </button>
        </div>
      </div>

      {/* ERROR */}

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

      {/* TEMPLATE INFO */}

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
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:gap-4
          "
        >
          <div className="min-w-0">
            <label className="text-sm font-medium">
              Template Name
            </label>

            <h2 className="mt-2 break-words text-lg font-semibold">
              {template.name}
            </h2>
          </div>

          <div
            className="
              flex
              items-center
              justify-between
              rounded-xl
              bg-(--navy-800)
              px-4
              py-3
              sm:block
              sm:bg-transparent
              sm:p-0
              sm:text-right
            "
          >
            <p className="text-xs opacity-40">
              Total routines
            </p>

            <p
              className="
                text-lg
                font-semibold
                text-(--gold-500)
                sm:mt-1
              "
            >
              {template.items.length}
            </p>
          </div>
        </div>
      </section>

      {/* ROUTINES */}

      <section>
        <div className="border-t border-(--border)" />

        <div className="mt-6 sm:mt-8">
          {template.items.length === 0 ? (
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
              <p className="text-base font-medium">
                No routines in this template
              </p>

              <p className="mt-2 text-sm opacity-50">
                Edit the template to add routines.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop timeline line */}

              <div
                className="
                  absolute
                  left-[7.25rem]
                  top-12
                  bottom-3
                  hidden
                  w-px
                  bg-(--border)
                  sm:block
                "
              />

              <div className="space-y-4 sm:space-y-7">
                {template.items.map(
                  (routine: RoutineItem) => (
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

                      <div className="flex items-center justify-between sm:hidden">
                        <div className="flex items-center gap-2">
                          <div
                            className="
                              h-2.5
                              w-2.5
                              rounded-full
                              border-2
                              border-(--gold-500)
                              bg-(--gold-500)
                            "
                          />

                          <span className="font-mono text-xs font-light opacity-60">
                            {formatTime(
                              routine.startTime
                            )}
                          </span>
                        </div>

                        <span
                          className="
                            rounded-lg
                            bg-(--navy-800)
                            px-2.5
                            py-1
                            font-mono
                            text-xs
                            font-medium
                            text-(--gold-500)
                          "
                        >
                          {formatDuration(
                            routine.durationMin
                          )}
                        </span>
                      </div>

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
                          border-(--gold-400)/20
                          border-l-3
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
                            gap-4
                            px-4
                            py-4
                            sm:h-full
                            sm:flex-row
                            sm:items-start
                            sm:gap-4
                            sm:px-5
                            sm:py-4
                          "
                        >
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
                              title={routine.title}
                            >
                              {routine.title}
                            </h3>

                            <p
                              className="
                                mt-1
                                text-sm
                                leading-5
                                opacity-60
                                sm:line-clamp-1
                                sm:overflow-hidden
                              "
                            >
                              {routine.description ||
                                "No description provided."}
                            </p>
                          </div>

                          {/* DETAILS */}

                          <div
                            className="
                              flex
                              shrink-0
                              flex-col
                              items-start
                              gap-2
                              border-t
                              border-(--border)
                              pt-3
                              sm:flex-row
                              sm:items-center
                              sm:gap-3
                              sm:border-0
                              sm:pt-0
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                                text-xs
                                opacity-50
                              "
                            >
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
                                sm:inline-block
                              "
                            >
                              {formatDuration(
                                routine.durationMin
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* DELETE CONFIRMATION MODAL */}

      {showDeleteConfirm && (
        <div
          className="
            fixed
            inset-0
            z-100
            flex
            items-center
            justify-center
            overflow-y-auto
            bg-black/60
            px-3
            py-6
            backdrop-blur-sm
            sm:px-4
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (!deleting) {
                setShowDeleteConfirm(false);
              }
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-template-title"
            className="
              w-full
              max-w-md
              overflow-hidden
              rounded-2xl
              border
              border-(--border)
              bg-(--navy-900)
              shadow-2xl
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
                id="delete-template-title"
                className="mt-5 text-lg font-semibold"
              >
                Delete Routine Template?
              </h2>

              <p className="mt-2 text-sm leading-6 opacity-60">
                This action cannot be undone. The template{" "}
                <span className="font-medium text-white opacity-100">
                  "{template.name}"
                </span>{" "}
                and all{" "}
                <span className="font-medium text-white opacity-100">
                  {template.items.length}
                </span>{" "}
                routine
                {template.items.length === 1
                  ? ""
                  : "s"} inside it will be permanently
                deleted.
              </p>
            </div>

            <div
              className="
                flex
                flex-col-reverse
                gap-2
                border-t
                border-(--border)
                p-4
                sm:flex-row
                sm:items-center
                sm:justify-end
                sm:gap-3
                sm:px-6
                sm:py-4
              "
            >
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                className="
                  min-h-11
                  rounded-xl
                  border
                  border-(--border)
                  px-4
                  py-2.5
                  text-sm
                  transition
                  hover:bg-(--navy-800)
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteTemplate}
                className="
                  inline-flex
                  min-h-11
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
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Trash2
                  size={16}
                  strokeWidth={2}
                />

                {deleting
                  ? "Deleting..."
                  : "Delete Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}