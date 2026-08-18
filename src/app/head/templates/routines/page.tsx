"use client";

import Link from "next/link";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
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

export default function RoutinesPage() {
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedTemplate, setSelectedTemplate] =
    useState<RoutineTemplate | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  async function loadTemplates() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/head/templates/routines",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to load routine templates."
        );

        return;
      }

      setTemplates(
        Array.isArray(data.templates)
          ? data.templates
          : []
      );
    } catch (error) {
      console.error(
        "LOAD ROUTINE TEMPLATES ERROR:",
        error
      );

      setError(
        "Something went wrong while loading routine templates."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  function openDeleteConfirm(
    template: RoutineTemplate
  ) {
    setError("");
    setSelectedTemplate(template);
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    if (deletingId) {
      return;
    }

    setShowDeleteConfirm(false);
    setSelectedTemplate(null);
  }

  async function deleteTemplate() {
    if (!selectedTemplate || deletingId) {
      return;
    }

    try {
      setDeletingId(selectedTemplate.id);
      setError("");

      const response = await fetch(
        `/api/head/templates/routines/${selectedTemplate.id}`,
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

        return;
      }

      setTemplates((current) =>
        current.filter(
          (item) => item.id !== selectedTemplate.id
        )
      );

      setShowDeleteConfirm(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error(
        "DELETE ROUTINE TEMPLATE ERROR:",
        error
      );

      setError(
        "Something went wrong while deleting the template."
      );
    } finally {
      setDeletingId(null);
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
      {/* PAGE HEADER */}

      <div
        className="
          flex
          flex-col
          items-start
          justify-between
          gap-5
          md:flex-row
          md:items-center
          md:gap-4
        "
      >
        <div className="min-w-0">
          <p
            className="
              mb-1
              text-[10px]
              font-bold
              uppercase
              tracking-[0.25em]
              text-(--gold-400)
              opacity-70
              sm:mb-2
              sm:text-xs
              sm:tracking-[0.3em]
            "
          >
            Head Portal
          </p>

          <h1
            className="
              font-heading
              text-3xl
              font-bold
              tracking-wide
              text-white
              sm:text-4xl
              md:text-5xl
            "
          >
            Routine Templates
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-xs
              leading-5
              opacity-70
              sm:mt-3
              sm:text-sm
              sm:leading-normal
            "
          >
            Create and manage routine templates
          </p>
        </div>

        <Link
          href="/head/templates/routines/create"
          className="
            inline-flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-(--gold-500)
            px-4
            py-3
            text-sm
            font-medium
            text-black
            transition
            hover:opacity-90
            active:scale-[0.98]
            md:w-auto
            md:shrink-0
            md:px-5
          "
        >
          <Plus
            size={18}
            strokeWidth={2}
          />

          <span>Create New</span>
        </Link>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-400/30
            bg-red-400/5
            px-3
            py-3
            text-xs
            leading-5
            text-red-300
            sm:px-4
            sm:text-sm
          "
        >
          {error}
        </div>
      )}

      {/* ==================================================
          MOBILE TEMPLATE CARDS
      ================================================== */}

      <div className="space-y-3 md:hidden">
        {/* LOADING */}

        {loading && (
          <div
            className="
              rounded-2xl
              border
              border-(--border)
              bg-(--navy-900)
              px-4
              py-12
              text-center
            "
          >
            <p className="text-sm opacity-50">
              Loading routine templates...
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading && templates.length === 0 && (
          <div
            className="
              rounded-2xl
              border
              border-(--border)
              bg-(--navy-900)
              px-4
              py-12
              text-center
            "
          >
            <div className="space-y-2">
              <p className="text-base font-medium">
                No routine templates yet
              </p>

              <p className="text-xs leading-5 opacity-50">
                Create your first routine template
                to get started.
              </p>
            </div>
          </div>
        )}

        {/* TEMPLATES */}

        {!loading &&
          templates.map((template) => (
            <div
              key={template.id}
              className="
                rounded-2xl
                border
                border-(--border)
                bg-(--navy-900)
                p-4
                transition-colors
                active:bg-(--navy-800)
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
                <div className="min-w-0 flex-1">
                  <p
                    className="
                      break-words
                      text-sm
                      font-medium
                      text-white
                    "
                  >
                    {template.name}
                  </p>

                  <p
                    className="
                      mt-1.5
                      text-xs
                      opacity-40
                    "
                  >
                    {template.items.length}{" "}
                    {template.items.length === 1
                      ? "routine"
                      : "routines"}
                  </p>
                </div>
              </div>

              <div
                className="
                  mt-4
                  grid
                  grid-cols-3
                  gap-2
                  border-t
                  border-(--border)
                  pt-3
                "
              >
                {/* EDIT */}

                <Link
                  href={`/head/templates/routines/${template.id}/edit`}
                  className="
                    flex
                    min-h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-(--navy-800)
                    text-xs
                    opacity-70
                    transition
                    hover:bg-red-400/10
                    hover:text-red-400
                    hover:opacity-100
                    active:scale-[0.97]
                  "
                  aria-label={`Edit ${template.name}`}
                  title="Edit"
                >
                  <Pencil
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>Edit</span>
                </Link>

                {/* VIEW */}

                <Link
                  href={`/head/templates/routines/${template.id}`}
                  className="
                    flex
                    min-h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-(--navy-800)
                    text-xs
                    opacity-70
                    transition
                    hover:bg-red-400/10
                    hover:text-red-400
                    hover:opacity-100
                    active:scale-[0.97]
                  "
                  aria-label={`View ${template.name}`}
                  title="View"
                >
                  <Eye
                    size={16}
                    strokeWidth={1.8}
                  />

                  <span>View</span>
                </Link>

                {/* DELETE */}

                <button
                  type="button"
                  disabled={
                    deletingId === template.id
                  }
                  onClick={() =>
                    openDeleteConfirm(template)
                  }
                  className="
                    flex
                    min-h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-(--navy-800)
                    text-xs
                    opacity-70
                    transition
                    hover:bg-red-400/10
                    hover:text-red-400
                    hover:opacity-100
                    active:scale-[0.97]
                    disabled:cursor-not-allowed
                    disabled:opacity-30
                  "
                  aria-label={`Delete ${template.name}`}
                  title="Delete"
                >
                  <Trash2
                    size={15}
                    strokeWidth={1.8}
                  />

                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ==================================================
          DESKTOP TABLE
      ================================================== */}

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
                    colSpan={4}
                    className="px-6 py-16 text-center"
                  >
                    <p className="text-sm opacity-50">
                      Loading routine templates...
                    </p>
                  </td>
                </tr>
              )}

              {/* EMPTY */}

              {!loading &&
                templates.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center"
                    >
                      <div className="space-y-2">
                        <p className="text-base font-medium">
                          No routine templates yet
                        </p>

                        <p className="text-sm opacity-50">
                          Create your first routine
                          template to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

              {/* TEMPLATES */}

              {!loading &&
                templates.map((template) => (
                  <tr
                    key={template.id}
                    className="
                      border-b
                      border-(--border)
                      last:border-b-0
                      transition-colors
                      hover:bg-(--navy-800)
                    "
                  >
                    {/* NAME */}

                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {template.name}
                        </p>

                        <p className="mt-1 text-xs opacity-40">
                          {template.items.length}{" "}
                          {template.items.length === 1
                            ? "routine"
                            : "routines"}
                        </p>
                      </div>
                    </td>

                    {/* EDIT */}

                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/head/templates/routines/${template.id}/edit`}
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
                        "
                        aria-label={`Edit ${template.name}`}
                        title="Edit"
                      >
                        <Pencil
                          size={16}
                          strokeWidth={1.8}
                        />
                      </Link>
                    </td>

                    {/* VIEW */}

                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/head/templates/routines/${template.id}`}
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
                        "
                        aria-label={`View ${template.name}`}
                        title="View"
                      >
                        <Eye
                          size={17}
                          strokeWidth={1.8}
                        />
                      </Link>
                    </td>

                    {/* DELETE */}

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        disabled={
                          deletingId === template.id
                        }
                        onClick={() =>
                          openDeleteConfirm(template)
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
                        title="Delete"
                      >
                        <Trash2
                          size={16}
                          strokeWidth={1.8}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}

      {showDeleteConfirm && selectedTemplate && (
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
            pb-3
            backdrop-blur-sm
            sm:items-center
            sm:px-4
            sm:pb-0
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteConfirm();
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
            {/* MODAL CONTENT */}

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
                className="
                  mt-4
                  text-base
                  font-semibold
                  sm:mt-5
                  sm:text-lg
                "
              >
                Delete Routine Template?
              </h2>

              <p
                className="
                  mt-2
                  text-xs
                  leading-5
                  opacity-60
                  sm:text-sm
                  sm:leading-6
                "
              >
                This action cannot be undone. The
                template{" "}
                <span className="font-medium text-white opacity-100">
                  "{selectedTemplate.name}"
                </span>{" "}
                and all{" "}
                <span className="font-medium text-white opacity-100">
                  {selectedTemplate.items.length}
                </span>{" "}
                routine
                {selectedTemplate.items.length === 1
                  ? ""
                  : "s"} inside it will be permanently
                deleted.
              </p>
            </div>

            {/* MODAL ACTIONS */}

            <div
              className="
                flex
                flex-col-reverse
                gap-2
                border-t
                border-(--border)
                px-5
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
                disabled={deletingId !== null}
                onClick={closeDeleteConfirm}
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
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                  sm:w-auto
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingId !== null}
                onClick={deleteTemplate}
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
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                "
              >
                <Trash2
                  size={16}
                  strokeWidth={2}
                />

                {deletingId !== null
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