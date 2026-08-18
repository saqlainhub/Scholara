"use client";

import {
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

export default function AddStudentForm() {
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
    // CLEAN IMAGE PREVIEW URL
    // ======================================================

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(
                    imagePreview
                );
            }
        };
    }, [imagePreview]);

    // ======================================================
    // UPDATE FORM
    // ======================================================

    function update(
        field:
            | "name"
            | "username"
            | "password",
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
            setProfileImage(null);
            setImagePreview(null);
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ];

        if (
            !allowedTypes.includes(
                file.type
            )
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

        setImagePreview(
            URL.createObjectURL(file)
        );

        setImageZoom(1);
    }

    // ======================================================
    // CREATE STUDENT
    // ======================================================

    async function save() {
        setError("");

        const name =
            form.name.trim();

        const username =
            form.username.trim();

        if (!name) {
            setError(
                "Student name is required."
            );
            return;
        }

        if (!username) {
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
                name
            );

            formData.append(
                "username",
                username
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
                    "/api/head/students",
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
                        "Failed to create student."
                );

                return;
            }

            router.push(
                "/head/students"
            );

            router.refresh();
        } catch (error) {
            console.error(
                "CREATE STUDENT ERROR:",
                error
            );

            setError(
                "Something went wrong while creating the student."
            );
        } finally {
            setSaving(false);
        }
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <>
            <form
                autoComplete="off"
                className="
                    w-full
                    max-w-xl
                    space-y-6
                    pb-2
                "
                onSubmit={(event) => {
                    event.preventDefault();

                    if (!saving) {
                        save();
                    }
                }}
            >
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
                            px-3
                            py-3
                            text-sm
                            leading-5
                            text-red-300
                            sm:px-4
                        "
                    >
                        {error}
                    </div>
                )}

                {/* ==================================================
                    PROFILE IMAGE
                ================================================== */}

                <div>
                    <label
                        className="
                            text-sm
                            font-medium
                        "
                    >
                        Profile Image
                    </label>

                    <div
                        className="
                            mt-3
                            flex
                            flex-col
                            items-start
                            gap-4
                            rounded-2xl
                            border
                            border-white/[0.06]
                            bg-white/[0.02]
                            p-4
                            sm:flex-row
                            sm:items-center
                            sm:border-0
                            sm:bg-transparent
                            sm:p-0
                        "
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (
                                    imagePreview
                                ) {
                                    setImagePopupOpen(
                                        true
                                    );
                                }
                            }}
                            disabled={
                                !imagePreview
                            }
                            className="
                                group
                                relative
                                h-24
                                w-24
                                shrink-0
                                self-center
                                overflow-hidden
                                rounded-full
                                border
                                border-(--border)
                                bg-(--navy-900)
                                disabled:cursor-default
                                sm:h-20
                                sm:w-20
                                sm:self-auto
                            "
                        >
                            {imagePreview ? (
                                <img
                                    src={
                                        imagePreview
                                    }
                                    alt="Profile preview"
                                    className="
                                        h-full
                                        w-full
                                        object-cover
                                        transition
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
                                        flex
                                        items-center
                                        justify-center
                                        bg-black/50
                                        text-xs
                                        font-medium
                                        text-white
                                        opacity-0
                                        transition
                                        group-hover:opacity-100
                                    "
                                >
                                    View
                                </div>
                            )}
                        </button>

                        <div className="w-full min-w-0 sm:w-auto">
                            <label
                                htmlFor="student-profile-image"
                                className="
                                    inline-flex
                                    min-h-10
                                    w-full
                                    cursor-pointer
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    px-4
                                    py-2
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
                                id="student-profile-image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={
                                    handleImageChange
                                }
                                className="hidden"
                            />

                            <p
                                className="
                                    mt-2
                                    max-w-xs
                                    text-xs
                                    leading-5
                                    opacity-50
                                "
                            >
                                JPG, PNG, WEBP or
                                GIF. Maximum 2 MB.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    NAME
                ================================================== */}

                <div>
                    <label
                        htmlFor="student-name"
                        className="
                            text-sm
                            font-medium
                        "
                    >
                        Student Name
                    </label>

                    <input
                        id="student-name"
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                            update(
                                "name",
                                event.target.value
                            )
                        }
                        placeholder="Student name"
                        maxLength={70}
                        autoComplete="off"
                        className="
                            mt-2
                            min-h-12
                            w-full
                            rounded-xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            px-3
                            py-3
                            text-base
                            outline-none
                            transition
                            focus:border-(--gold-500)
                            sm:text-sm
                        "
                    />
                </div>

                {/* ==================================================
                    USERNAME
                ================================================== */}

                <div>
                    <label
                        htmlFor="student-username"
                        className="
                            text-sm
                            font-medium
                        "
                    >
                        Username
                    </label>

                    <input
                        id="student-username"
                        type="text"
                        value={form.username}
                        onChange={(event) =>
                            update(
                                "username",
                                event.target.value
                            )
                        }
                        placeholder="Username"
                        maxLength={50}
                        autoComplete="off"
                        className="
                            mt-2
                            min-h-12
                            w-full
                            rounded-xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            px-3
                            py-3
                            text-base
                            outline-none
                            transition
                            focus:border-(--gold-500)
                            sm:text-sm
                        "
                    />
                </div>

                {/* ==================================================
                    PASSWORD
                ================================================== */}

                <div>
                    <label
                        htmlFor="student-password"
                        className="
                            text-sm
                            font-medium
                        "
                    >
                        Password
                    </label>

                    <div className="relative mt-2">
                        <input
                            id="student-password"
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                form.password
                            }
                            onChange={(event) =>
                                update(
                                    "password",
                                    event.target.value
                                )
                            }
                            placeholder="Password"
                            autoComplete="new-password"
                            className="
                                min-h-12
                                w-full
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                px-3
                                py-3
                                pr-12
                                text-base
                                outline-none
                                transition
                                focus:border-(--gold-500)
                                sm:text-sm
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
                                right-2.5
                                top-1/2
                                flex
                                h-9
                                w-9
                                -translate-y-1/2
                                items-center
                                justify-center
                                rounded-lg
                                p-1
                                opacity-60
                                transition
                                hover:bg-(--navy-800)
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
                    CREATE
                ================================================== */}

                <button
                    type="submit"
                    disabled={saving}
                    className="
                        min-h-12
                        w-full
                        rounded-xl
                        bg-(--gold-500)
                        px-6
                        py-3
                        font-medium
                        text-black
                        transition
                        hover:opacity-90
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        sm:w-auto
                    "
                >
                    {saving
                        ? "Creating..."
                        : "Create Student"}
                </button>
            </form>

            {/* ==================================================
                IMAGE PREVIEW POPUP
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
                                setImagePopupOpen(
                                    false
                                );
                                setImageZoom(1);
                            }
                        }}
                    >
                        <div
                            className="
                                flex
                                max-h-[calc(100dvh-2rem)]
                                w-full
                                max-w-md
                                flex-col
                                overflow-y-auto
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                p-4
                                shadow-2xl
                                sm:max-h-none
                                sm:p-6
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-4
                                "
                            >
                                <div className="min-w-0">
                                    <h3
                                        className="
                                            text-lg
                                            font-semibold
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
                                        Preview your
                                        selected image.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePopupOpen(
                                            false
                                        );
                                        setImageZoom(1);
                                    }}
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

                            <div
                                className="
                                    mt-5
                                    flex
                                    justify-center
                                    overflow-hidden
                                    px-2
                                    sm:mt-6
                                "
                            >
                                <div
                                    className="
                                        relative
                                        h-[min(64vw,14rem)]
                                        w-[min(64vw,14rem)]
                                        shrink-0
                                        overflow-hidden
                                        rounded-full
                                        border-2
                                        border-(--gold-500)
                                        bg-black
                                        sm:h-64
                                        sm:w-64
                                    "
                                >
                                    <img
                                        src={
                                            imagePreview
                                        }
                                        alt="Profile image"
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
                                    "
                                >
                                    −
                                </button>

                                <span
                                    className="
                                        min-w-16
                                        text-center
                                        text-sm
                                        opacity-70
                                    "
                                >
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
                                    "
                                >
                                    +
                                </button>
                            </div>

                            <div
                                className="
                                    mt-6
                                    flex
                                    flex-col-reverse
                                    gap-3
                                    sm:flex-row
                                    sm:justify-end
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
                                    htmlFor="student-profile-image-popup"
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
                                        text-center
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
                                    id="student-profile-image-popup"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={
                                        handleImageChange
                                    }
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}