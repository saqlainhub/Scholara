"use client";

import {
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

type Student = {
    id: string;
    name: string;
    username: string;
    profileImg: string | null;
};

export default function EditStudentForm({
    studentId,
}: {
    studentId: string;
}) {
    const router = useRouter();

    const [student, setStudent] =
        useState<Student | null>(null);

    const [form, setForm] = useState({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    const [profileImage, setProfileImage] =
        useState<File | null>(null);

    const [imagePreview, setImagePreview] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [
        imagePopupOpen,
        setImagePopupOpen,
    ] = useState(false);

    const [imageZoom, setImageZoom] =
        useState(1);

    // ======================================================
    // LOAD STUDENT
    // ======================================================

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `/api/head/students/${studentId}`,
                        {
                            cache: "no-store",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Failed to load student."
                    );
                }

                const loadedStudent =
                    data.student;

                setStudent(
                    loadedStudent
                );

                setForm({
                    name:
                        loadedStudent.name ||
                        "",
                    username:
                        loadedStudent.username ||
                        "",
                    password: "",
                    confirmPassword: "",
                });

                setImagePreview(
                    loadedStudent.profileImg ||
                        null
                );
            } catch (error) {
                console.error(
                    "LOAD STUDENT ERROR:",
                    error
                );

                setError(
                    error instanceof Error
                        ? error.message
                        : "Failed to load student."
                );
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [studentId]);

    // ======================================================
    // CLEAN OBJECT URL
    // ======================================================

    useEffect(() => {
        return () => {
            if (
                imagePreview &&
                imagePreview.startsWith(
                    "blob:"
                )
            ) {
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
            | "password"
            | "confirmPassword",
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError("");
        setMessage("");
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
        setMessage("");

        if (
            imagePreview &&
            imagePreview.startsWith("blob:")
        ) {
            URL.revokeObjectURL(
                imagePreview
            );
        }

        setProfileImage(file);

        setImagePreview(
            URL.createObjectURL(file)
        );

        setImageZoom(1);
    }

    // ======================================================
    // SAVE
    // ======================================================

    async function save() {
        setError("");
        setMessage("");

        const name =
            form.name.trim();

        const username =
            form.username.trim();

        const password =
            form.password;

        const confirmPassword =
            form.confirmPassword;

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

        /*
         * Password is optional.
         *
         * If both password fields are blank,
         * the existing password remains unchanged.
         */

        if (
            password ||
            confirmPassword
        ) {
            if (!password) {
                setError(
                    "Please enter a new password."
                );
                return;
            }

            if (!confirmPassword) {
                setError(
                    "Please confirm the new password."
                );
                return;
            }

            if (
                password !==
                confirmPassword
            ) {
                setError(
                    "Password and confirm password do not match."
                );
                return;
            }
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

            if (password) {
                formData.append(
                    "password",
                    password
                );
            }

            if (profileImage) {
                formData.append(
                    "profileImage",
                    profileImage
                );
            }

            const response =
                await fetch(
                    `/api/head/students/${studentId}/edit`,
                    {
                        method: "PUT",
                        body: formData,
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Failed to update student."
                );
            }

            router.push(
                `/head/students/${studentId}`
            );

            router.refresh();
        } catch (error) {
            console.error(
                "UPDATE STUDENT ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to update student."
            );

            setSaving(false);
        }
    }

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div
                className="
                    w-full
                    max-w-xl
                    rounded-2xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    px-4
                    py-12
                    text-center
                    sm:px-6
                "
            >
                <p className="text-sm opacity-50">
                    Loading student...
                </p>
            </div>
        );
    }

    // ======================================================
    // NOT FOUND
    // ======================================================

    if (!student) {
        return (
            <div
                className="
                    w-full
                    max-w-xl
                    rounded-xl
                    border
                    border-red-400/20
                    bg-red-400/5
                    px-4
                    py-4
                    text-sm
                    text-red-400
                "
            >
                {error ||
                    "Student not found."}
            </div>
        );
    }

    // ======================================================
    // UI
    // ======================================================

    return (
        <>
            <div
                className="
                    w-full
                    max-w-xl
                    space-y-6
                    sm:space-y-7
                "
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
                            px-4
                            py-3
                            text-sm
                            leading-5
                            text-red-300
                            break-words
                        "
                    >
                        {error}
                    </div>
                )}

                {/* ==================================================
                    SUCCESS
                ================================================== */}

                {message && (
                    <div
                        className="
                            rounded-xl
                            border
                            border-green-400/20
                            bg-green-400/5
                            px-4
                            py-3
                            text-sm
                            leading-5
                            text-green-300
                        "
                    >
                        {message}
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
                            min-[400px]:flex-row
                            min-[400px]:items-center
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
                                h-20
                                w-20
                                shrink-0
                                overflow-hidden
                                rounded-full
                                border
                                border-(--border)
                                bg-(--navy-900)
                                disabled:cursor-default
                                focus:outline-none
                                focus:ring-2
                                focus:ring-(--gold-500)/50
                            "
                        >
                            {imagePreview ? (
                                <img
                                    src={
                                        imagePreview
                                    }
                                    alt={
                                        student.name
                                    }
                                    className="
                                        h-full
                                        w-full
                                        object-cover
                                        transition
                                        duration-200
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

                        <div
                            className="
                                min-w-0
                                w-full
                                min-[400px]:w-auto
                            "
                        >
                            <label
                                htmlFor="student-profile-image"
                                className="
                                    inline-flex
                                    min-h-10
                                    max-w-full
                                    cursor-pointer
                                    items-center
                                    justify-center
                                    rounded-lg
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    px-4
                                    py-2
                                    text-center
                                    text-sm
                                    font-medium
                                    transition
                                    hover:border-(--gold-500)
                                    hover:text-(--gold-500)
                                    active:scale-[0.98]
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
                            px-3.5
                            py-3
                            text-sm
                            outline-none
                            transition
                            focus:border-(--gold-500)
                            sm:text-base
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
                        value={
                            form.username
                        }
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
                            px-3.5
                            py-3
                            text-sm
                            outline-none
                            transition
                            focus:border-(--gold-500)
                            sm:text-base
                        "
                    />
                </div>

                {/* ==================================================
                    PASSWORD SECTION
                ================================================== */}

                <div>
                    {/* PASSWORD */}

                    <div>
                        <label
                            htmlFor="student-password"
                            className="
                                flex
                                flex-col
                                gap-1
                                text-sm
                                font-medium
                                min-[480px]:flex-row
                                min-[480px]:items-center
                                min-[480px]:justify-between
                            "
                        >
                            <span>
                                Password
                            </span>

                            <span
                                className="
                                    text-xs
                                    font-normal
                                    leading-5
                                    text-red-400
                                    opacity-80
                                "
                            >
                                Leave blank to keep current password
                            </span>
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
                                onChange={(
                                    event
                                ) =>
                                    update(
                                        "password",
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Enter password"
                                autoComplete="new-password"
                                className="
                                    min-h-12
                                    w-full
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    px-3.5
                                    py-3
                                    pr-12
                                    text-sm
                                    outline-none
                                    transition
                                    focus:border-(--gold-500)
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
                                    right-2.5
                                    top-1/2
                                    flex
                                    h-9
                                    w-9
                                    -translate-y-1/2
                                    items-center
                                    justify-center
                                    rounded-lg
                                    opacity-50
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                    active:scale-95
                                "
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOffIcon />
                                ) : (
                                    <EyeIcon />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div className="mt-5">
                        <label
                            htmlFor="student-confirm-password"
                            className="
                                text-sm
                                font-medium
                            "
                        >
                            Confirm Password
                        </label>

                        <div className="relative mt-2">
                            <input
                                id="student-confirm-password"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    form.confirmPassword
                                }
                                onChange={(
                                    event
                                ) =>
                                    update(
                                        "confirmPassword",
                                        event.target
                                            .value
                                    )
                                }
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                className="
                                    min-h-12
                                    w-full
                                    rounded-xl
                                    border
                                    border-(--border)
                                    bg-(--navy-900)
                                    px-3.5
                                    py-3
                                    pr-12
                                    text-sm
                                    outline-none
                                    transition
                                    focus:border-(--gold-500)
                                    sm:text-base
                                "
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(
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
                                    opacity-50
                                    transition
                                    hover:bg-(--navy-800)
                                    hover:opacity-100
                                    active:scale-95
                                "
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOffIcon />
                                ) : (
                                    <EyeIcon />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    SAVE
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        gap-3
                        pt-1
                        sm:flex-row
                        sm:items-center
                        sm:pt-2
                    "
                >
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="
                            min-h-12
                            w-full
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
                            sm:text-base
                        "
                    >
                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>
                </div>
            </div>

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
                                w-full
                                max-w-md
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                p-4
                                shadow-2xl
                                sm:p-6
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
                                        Preview profile
                                        image.
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
                                        active:scale-95
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
                                    rounded-xl
                                    sm:mt-6
                                "
                            >
                                <div
                                    className="
                                        relative
                                        h-[min(68vw,280px)]
                                        w-[min(68vw,280px)]
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
                                        alt={
                                            student.name
                                        }
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
                                        active:scale-95
                                    "
                                    aria-label="Zoom out"
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
                                        active:scale-95
                                    "
                                    aria-label="Zoom in"
                                >
                                    +
                                </button>
                            </div>

                            <div
                                className="
                                    mt-6
                                    flex
                                    flex-col-reverse
                                    gap-2.5
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
                                        active:scale-[0.99]
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
                                        active:scale-[0.99]
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

/* ==========================================================
   EYE ICON
========================================================== */

function EyeIcon() {
    return (
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
    );
}

/* ==========================================================
   EYE OFF ICON
========================================================== */

function EyeOffIcon() {
    return (
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
    );
}