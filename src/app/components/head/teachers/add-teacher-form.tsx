"use client";

import {
    useState,
} from "react";

import { useRouter } from "next/navigation";

export default function AddTeacherForm() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        username: "",
        password: "",
    });

    const [profileImage, setProfileImage] =
        useState<File | null>(null);

    const [imagePreview, setImagePreview] =
        useState<string | null>(null);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [imagePopupOpen, setImagePopupOpen] =
        useState(false);

    const [imageZoom, setImageZoom] =
        useState(1);

    // ======================================================
    // UPDATE FORM
    // ======================================================

    function update(
        field: keyof typeof form,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    // ======================================================
    // IMAGE SELECT
    // ======================================================

    function handleImageChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ];

        if (
            !allowedTypes.includes(file.type)
        ) {
            setError(
                "Only JPG, PNG, WEBP or GIF images are allowed."
            );

            event.target.value = "";
            return;
        }

        if (
            file.size >
            2 * 1024 * 1024
        ) {
            setError(
                "Profile image must be 2 MB or smaller."
            );

            event.target.value = "";
            return;
        }

        setError("");

        setProfileImage(file);

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        setImagePreview(
            URL.createObjectURL(file)
        );

        setImageZoom(1);
    }

    // ======================================================
    // CREATE TEACHER
    // ======================================================

    async function save() {
        setError("");

        if (!form.name.trim()) {
            setError(
                "Teacher name is required."
            );
            return;
        }

        if (!form.username.trim()) {
            setError(
                "Username is required."
            );
            return;
        }

        if (!form.password) {
            setError(
                "Password is required."
            );
            return;
        }

        try {
            setSaving(true);

            const formData =
                new FormData();

            formData.append(
                "name",
                form.name.trim()
            );

            formData.append(
                "username",
                form.username.trim()
            );

            formData.append(
                "password",
                form.password
            );

            if (profileImage) {
                formData.append(
                    "profileImage",
                    profileImage
                );
            }

            const response =
                await fetch(
                    "/api/head/teachers",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                    "Failed to create teacher."
                );

                return;
            }

            router.push(
                "/head/teachers"
            );

            router.refresh();
        } catch (error) {
            console.error(
                "CREATE TEACHER ERROR:",
                error
            );

            setError(
                "Something went wrong while creating the teacher."
            );
        } finally {
            setSaving(false);
        }
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="w-full max-w-xl space-y-6 sm:space-y-7">

            {/* ==================================================
                ERROR
            ================================================== */}

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
                        leading-5
                        text-red-300
                    "
                >
                    {error}
                </div>
            )}

            {/* ==================================================
                PROFILE IMAGE
            ================================================== */}

            <div className="space-y-3">

                <label
                    className="
                        block
                        text-sm
                        font-medium
                    "
                >
                    Profile Image
                </label>

                <div
                    className="
                        flex
                        flex-col
                        items-center
                        gap-4
                        rounded-2xl
                        border
                        border-(--border)
                        bg-(--navy-900)/40
                        p-4
                        sm:flex-row
                        sm:items-center
                        sm:border-0
                        sm:bg-transparent
                        sm:p-0
                    "
                >

                    {/* PROFILE PREVIEW */}

                    <button
                        type="button"
                        onClick={() => {
                            if (imagePreview) {
                                setImagePopupOpen(
                                    true
                                );
                            }
                        }}
                        className="
                            group
                            relative
                            h-24
                            w-24
                            shrink-0
                            overflow-hidden
                            rounded-full
                            border
                            border-(--border)
                            bg-(--navy-900)
                            focus:outline-none
                            focus:ring-2
                            focus:ring-(--gold-500)/40
                            sm:h-20
                            sm:w-20
                        "
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Teacher profile preview"
                                className="
                                    h-full
                                    w-full
                                    object-cover
                                    transition
                                    duration-300
                                    group-hover:scale-105
                                "
                            />
                        ) : (
                            <div
                                className="
                                    flex
                                    h-full
                                    w-full
                                    items-center
                                    justify-center
                                    px-2
                                    text-center
                                    text-xs
                                    opacity-50
                                "
                            >
                                No Image
                            </div>
                        )}

                        {imagePreview && (
                            <div
                                className="
                                    absolute
                                    inset-0
                                    hidden
                                    items-center
                                    justify-center
                                    bg-black/50
                                    text-xs
                                    font-medium
                                    text-white
                                    opacity-0
                                    transition
                                    group-hover:flex
                                    group-hover:opacity-100
                                    sm:flex
                                "
                            >
                                View
                            </div>
                        )}
                    </button>

                    {/* IMAGE ACTIONS */}

                    <div
                        className="
                            min-w-0
                            w-full
                            flex-1
                            text-center
                            sm:w-auto
                            sm:text-left
                        "
                    >
                        <label
                            htmlFor="teacher-profile-image"
                            className="
                                inline-flex
                                min-h-11
                                w-full
                                cursor-pointer
                                items-center
                                justify-center
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                px-4
                                py-2.5
                                text-sm
                                font-medium
                                transition
                                hover:border-(--gold-500)
                                hover:text-(--gold-500)
                                sm:w-auto
                            "
                        >
                            {imagePreview
                                ? "Change Image"
                                : "Choose Image"}
                        </label>

                        <input
                            id="teacher-profile-image"
                            type="file"
                            accept="
                                image/jpeg,
                                image/png,
                                image/webp,
                                image/gif
                            "
                            onChange={
                                handleImageChange
                            }
                            className="hidden"
                        />

                        <p
                            className="
                                mt-2
                                text-xs
                                leading-5
                                opacity-50
                            "
                        >
                            JPG, PNG, WEBP or GIF.
                            Maximum 2 MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* ==================================================
                NAME
            ================================================== */}

            <div className="space-y-2">

                <label
                    htmlFor="teacher-name"
                    className="
                        block
                        text-sm
                        font-medium
                    "
                >
                    Teacher Name
                </label>

                <input
                    id="teacher-name"
                    value={form.name}
                    onChange={(event) =>
                        update(
                            "name",
                            event.target.value
                        )
                    }
                    placeholder="Teacher name"
                    maxLength={70}
                    className="
                        mt-1
                        min-h-12
                        w-full
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-(--gold-500)
                        sm:mt-0
                        sm:text-base
                    "
                />
            </div>

            {/* ==================================================
                USERNAME
            ================================================== */}

            <div className="space-y-2">

                <label
                    htmlFor="teacher-username"
                    className="
                        block
                        text-sm
                        font-medium
                    "
                >
                    Username
                </label>

                <input
                    id="teacher-username"
                    value={form.username}
                    onChange={(event) =>
                        update(
                            "username",
                            event.target.value
                        )
                    }
                    placeholder="Username"
                    maxLength={50}
                    className="
                        mt-1
                        min-h-12
                        w-full
                        rounded-xl
                        border
                        border-(--border)
                        bg-(--navy-900)
                        px-4
                        py-3
                        text-sm
                        outline-none
                        transition
                        focus:border-(--gold-500)
                        sm:mt-0
                        sm:text-base
                    "
                />
            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div className="space-y-2">

                <label
                    htmlFor="teacher-password"
                    className="
                        block
                        text-sm
                        font-medium
                    "
                >
                    Password
                </label>

                <div className="relative">

                    <input
                        id="teacher-password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        value={form.password}
                        onChange={(event) =>
                            update(
                                "password",
                                event.target.value
                            )
                        }
                        placeholder="Password"
                        className="
                            mt-1
                            min-h-12
                            w-full
                            rounded-xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            px-4
                            py-3
                            pr-14
                            text-sm
                            outline-none
                            transition
                            focus:border-(--gold-500)
                            sm:mt-0
                            sm:text-base
                        "
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (current) =>
                                    !current
                            )
                        }
                        className="
                            absolute
                            right-2
                            top-1/2
                            flex
                            h-10
                            w-10
                            -translate-y-1/2
                            items-center
                            justify-center
                            rounded-lg
                            opacity-60
                            transition
                            hover:bg-white/5
                            hover:opacity-100
                        "
                        aria-label={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                    >
                        {showPassword ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 3l18 18" />
                                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.7 4 10 8a14.5 14.5 0 0 1-2.2 3.8" />
                                <path d="M6.6 6.6C4.8 7.9 3.5 10 2 12c1.3 4 5 8 10 8a10.7 10.7 0 0 0 3.1-.5" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="3"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* ==================================================
                CREATE BUTTON
            ================================================== */}

            <div className="pt-1 sm:pt-2">

                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="
                        inline-flex
                        min-h-12
                        w-full
                        items-center
                        justify-center
                        rounded-xl
                        bg-(--gold-500)
                        px-6
                        py-3
                        text-sm
                        font-medium
                        text-black
                        transition
                        hover:opacity-90
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        sm:w-auto
                    "
                >
                    {saving
                        ? "Creating..."
                        : "Create Teacher"}
                </button>
            </div>

            {/* ==================================================
                IMAGE POPUP
            ================================================== */}

            {imagePopupOpen &&
                imagePreview && (
                    <div
                        className="
                            fixed
                            inset-0
                            z-100
                            flex
                            items-center
                            justify-center
                            overflow-y-auto
                            bg-black/70
                            px-3
                            py-4
                            backdrop-blur-[2px]
                            sm:px-4
                            sm:py-8
                        "
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setImagePopupOpen(
                                    false
                                );
                            }
                        }}
                    >
                        <div
                            className="
                                w-full
                                max-w-md
                                overflow-hidden
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                p-4
                                shadow-2xl
                                sm:p-6
                            "
                        >

                            {/* POPUP HEADER */}

                            <div
                                className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-3
                                "
                            >
                                <div className="min-w-0">

                                    <h3
                                        className="
                                            text-base
                                            font-semibold
                                            sm:text-lg
                                        "
                                    >
                                        Profile Image
                                    </h3>

                                    <p
                                        className="
                                            mt-1
                                            text-xs
                                            leading-5
                                            opacity-50
                                        "
                                    >
                                        Preview and adjust your
                                        profile image.
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImagePopupOpen(
                                            false
                                        )
                                    }
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-(--border)
                                        text-lg
                                        opacity-60
                                        transition
                                        hover:opacity-100
                                    "
                                    aria-label="Close image preview"
                                >
                                    ×
                                </button>
                            </div>

                            {/* IMAGE */}

                            <div className="mt-5 flex justify-center sm:mt-6">

                                <div
                                    className="
                                        relative
                                        h-[min(68vw,256px)]
                                        w-[min(68vw,256px)]
                                        max-h-64
                                        max-w-64
                                        overflow-hidden
                                        rounded-full
                                        border-2
                                        border-(--gold-500)
                                        bg-black
                                    "
                                >
                                    <img
                                        src={imagePreview}
                                        alt="Teacher profile"
                                        className="
                                            h-full
                                            w-full
                                            object-cover
                                        "
                                        style={{
                                            transform:
                                                `scale(${imageZoom})`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* ZOOM CONTROLS */}

                            <div
                                className="
                                    mt-5
                                    flex
                                    items-center
                                    justify-center
                                    gap-3
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageZoom(
                                            (current) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                        0.1
                                                )
                                        )
                                    }
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-(--border)
                                        text-lg
                                        transition
                                        hover:border-(--gold-500)
                                        active:scale-95
                                    "
                                    aria-label="Zoom out"
                                >
                                    −
                                </button>

                                <span className="min-w-16 text-center text-sm opacity-70">
                                    {Math.round(
                                        imageZoom *
                                            100
                                    )}
                                    %
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setImageZoom(
                                            (current) =>
                                                Math.min(
                                                    3,
                                                    current +
                                                        0.1
                                                )
                                        )
                                    }
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-(--border)
                                        text-lg
                                        transition
                                        hover:border-(--gold-500)
                                        active:scale-95
                                    "
                                    aria-label="Zoom in"
                                >
                                    +
                                </button>
                            </div>

                            {/* POPUP ACTIONS */}

                            <div
                                className="
                                    mt-6
                                    grid
                                    grid-cols-1
                                    gap-2
                                    sm:flex
                                    sm:items-center
                                    sm:justify-end
                                    sm:gap-3
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePopupOpen(
                                            false
                                        );
                                        setImageZoom(1);
                                    }}
                                    className="
                                        min-h-11
                                        w-full
                                        rounded-lg
                                        border
                                        border-(--border)
                                        px-4
                                        py-2
                                        text-sm
                                        transition
                                        hover:bg-(--navy-800)
                                        sm:w-auto
                                    "
                                >
                                    Done
                                </button>

                                <label
                                    htmlFor="teacher-profile-image-popup"
                                    className="
                                        flex
                                        min-h-11
                                        w-full
                                        cursor-pointer
                                        items-center
                                        justify-center
                                        rounded-lg
                                        bg-(--gold-500)
                                        px-4
                                        py-2
                                        text-sm
                                        font-medium
                                        text-black
                                        transition
                                        hover:opacity-90
                                        sm:w-auto
                                    "
                                >
                                    Change Image
                                </label>

                                <input
                                    id="teacher-profile-image-popup"
                                    type="file"
                                    accept="
                                        image/jpeg,
                                        image/png,
                                        image/webp,
                                        image/gif
                                    "
                                    onChange={
                                        handleImageChange
                                    }
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}