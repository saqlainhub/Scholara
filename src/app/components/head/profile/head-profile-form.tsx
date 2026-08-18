"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    Eye,
    EyeOff,
} from "lucide-react";

type HeadProfile = {
    id: string;
    username: string;
    name: string;
    profileImg: string | null;
    createdAt: string;
    updatedAt: string;
};

export default function HeadProfileForm() {
    const [exists, setExists] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

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

    const [imagePopupOpen, setImagePopupOpen] =
        useState(false);

    const [imageZoom, setImageZoom] =
        useState(1);

    // ======================================================
    // PASSWORD VISIBILITY
    // ======================================================

    const [showPassword, setShowPassword] =
        useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    // ======================================================
    // LOAD PROFILE
    // ======================================================

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        "/api/head/profile",
                        {
                            method: "GET",
                            cache: "no-store",
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    if (!cancelled) {
                        setError(
                            data.message ||
                                "Failed to load profile."
                        );
                    }

                    return;
                }

                if (cancelled) {
                    return;
                }

                setExists(
                    Boolean(data.exists)
                );

                if (data.head) {
                    setForm({
                        name:
                            data.head.name ||
                            "",
                        username:
                            data.head.username ||
                            "",
                        password: "",
                        confirmPassword: "",
                    });

                    setImagePreview(
                        data.head.profileImg ||
                            null
                    );
                }
            } catch (error) {
                console.error(
                    "LOAD HEAD PROFILE ERROR:",
                    error
                );

                if (!cancelled) {
                    setError(
                        "Something went wrong while loading the profile."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

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
        setSuccess("");
    }

    // ======================================================
    // IMAGE
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
        setSuccess("");

        setProfileImage(file);

        const previewUrl =
            URL.createObjectURL(file);

        setImagePreview(previewUrl);
    }

    // ======================================================
    // SAVE
    // ======================================================

    async function save() {
        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError(
                "Name is required."
            );

            return;
        }

        if (!form.username.trim()) {
            setError(
                "Username is required."
            );

            return;
        }

        if (
            !exists &&
            !form.password
        ) {
            setError(
                "Password is required."
            );

            return;
        }

        if (form.password) {
            if (
                form.password !==
                form.confirmPassword
            ) {
                setError(
                    "Passwords do not match."
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
                form.name.trim()
            );

            formData.append(
                "username",
                form.username.trim()
            );

            if (form.password) {
                formData.append(
                    "password",
                    form.password
                );

                formData.append(
                    "confirmPassword",
                    form.confirmPassword
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
                    "/api/head/profile",
                    {
                        method: exists
                            ? "PUT"
                            : "POST",
                        body: formData,
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                        "Failed to save profile."
                );

                return;
            }

            setExists(true);

            setForm((current) => ({
                ...current,
                password: "",
                confirmPassword: "",
            }));

            setProfileImage(null);

            setShowPassword(false);
            setShowConfirmPassword(false);

            if (data.head?.profileImg) {
                setImagePreview(
                    data.head.profileImg
                );
            }

            setSuccess(
                exists
                    ? "Head profile updated successfully."
                    : "Head profile created successfully."
            );
        } catch (error) {
            console.error(
                "SAVE HEAD PROFILE ERROR:",
                error
            );

            setError(
                "Something went wrong while saving the profile."
            );
        } finally {
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
                    rounded-2xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    px-4
                    py-12
                    text-center
                    sm:px-6
                    sm:py-14
                "
            >
                <p className="text-sm opacity-60">
                    Loading profile...
                </p>
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
                    max-w-2xl
                    space-y-5
                    sm:space-y-7
                "
            >
                {/* ==================================================
                    MESSAGES
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

                {success && (
                    <div
                        className="
                            rounded-xl
                            border
                            border-green-400/30
                            bg-green-400/5
                            px-3
                            py-3
                            text-sm
                            leading-5
                            text-green-400
                            sm:px-4
                        "
                    >
                        {success}
                    </div>
                )}

                {/* ==================================================
                    PROFILE IMAGE
                ================================================== */}

                <div>
                    <label className="text-sm font-medium">
                        Profile Image
                    </label>

                    <div
                        className="
                            mt-3
                            flex
                            flex-col
                            items-start
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:gap-5
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
                                focus:ring-(--gold-500)/50
                            "
                        >
                            {imagePreview ? (
                                <img
                                    src={
                                        imagePreview
                                    }
                                    alt="Head profile"
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
                                htmlFor="head-profile-image"
                                className="
                                    inline-flex
                                    w-full
                                    cursor-pointer
                                    items-center
                                    justify-center
                                    rounded-lg
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
                                id="head-profile-image"
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
                    <label className="text-sm font-medium">
                        Name
                    </label>

                    <input
                        value={form.name}
                        onChange={(event) =>
                            update(
                                "name",
                                event.target.value
                            )
                        }
                        placeholder="Head name"
                        maxLength={70}
                        className="
                            mt-2
                            h-12
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
                    <label className="text-sm font-medium">
                        Username
                    </label>

                    <input
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
                        className="
                            mt-2
                            h-12
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
                    PASSWORD
                ================================================== */}

                <div>
                    <label
                        className="
                            flex
                            flex-col
                            gap-1
                            text-sm
                            font-medium
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                        "
                    >
                        <span>
                            Password
                        </span>

                        <span
                            className="
                                text-xs
                                font-normal
                                leading-4
                                text-red-400
                            "
                        >
                            Leave blank to keep current password
                        </span>
                    </label>

                    <div className="relative mt-2">
                        <input
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
                            className="
                                h-12
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
                                right-2
                                top-1/2
                                flex
                                h-9
                                w-9
                                -translate-y-1/2
                                items-center
                                justify-center
                                rounded-lg
                                opacity-60
                                transition
                                hover:bg-(--navy-800)
                                hover:text-(--gold-500)
                                hover:opacity-100
                            "
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff
                                    size={18}
                                />
                            ) : (
                                <Eye
                                    size={18}
                                />
                            )}
                        </button>
                    </div>
                </div>

                {/* ==================================================
                    CONFIRM PASSWORD
                ================================================== */}

                <div>
                    <label className="text-sm font-medium">
                        Confirm Password
                    </label>

                    <div className="relative mt-2">
                        <input
                            type={
                                showConfirmPassword
                                    ? "text"
                                    : "password"
                            }
                            value={
                                form.confirmPassword
                            }
                            onChange={(event) =>
                                update(
                                    "confirmPassword",
                                    event.target.value
                                )
                            }
                            placeholder="Confirm password"
                            className="
                                h-12
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
                                right-2
                                top-1/2
                                flex
                                h-9
                                w-9
                                -translate-y-1/2
                                items-center
                                justify-center
                                rounded-lg
                                opacity-60
                                transition
                                hover:bg-(--navy-800)
                                hover:text-(--gold-500)
                                hover:opacity-100
                            "
                            aria-label={
                                showConfirmPassword
                                    ? "Hide confirm password"
                                    : "Show confirm password"
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff
                                    size={18}
                                />
                            ) : (
                                <Eye
                                    size={18}
                                />
                            )}
                        </button>
                    </div>
                </div>

                {/* ==================================================
                    SAVE
                ================================================== */}

                <div className="pt-1 sm:pt-2">
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="
                            w-full
                            rounded-xl
                            bg-(--gold-500)
                            px-6
                            py-3.5
                            text-sm
                            font-semibold
                            text-black
                            transition
                            hover:opacity-90
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                            sm:w-auto
                            sm:min-w-35
                        "
                    >
                        {saving
                            ? "Saving..."
                            : exists
                              ? "Save Changes"
                              : "Create Head"}
                    </button>
                </div>
            </div>

            {/* ======================================================
                IMAGE POPUP
            ====================================================== */}

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
                            py-5
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
                                    gap-4
                                "
                            >
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold sm:text-lg">
                                        Profile Image
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 opacity-50">
                                        Preview your
                                        profile image.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePopupOpen(
                                            false
                                        );
                                        setImageZoom(
                                            1
                                        );
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
                                    sm:mt-6
                                "
                            >
                                <div
                                    className="
                                        relative
                                        h-[min(68vw,16rem)]
                                        w-[min(68vw,16rem)]
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
                                        src={
                                            imagePreview
                                        }
                                        alt="Head profile"
                                        className="
                                            h-full
                                            w-full
                                            object-cover
                                        "
                                        style={{
                                            transform: `scale(${imageZoom})`,
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
                                            (
                                                current
                                            ) =>
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
                                            (
                                                current
                                            ) =>
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
                                    mt-5
                                    flex
                                    justify-stretch
                                    sm:mt-6
                                    sm:justify-end
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImagePopupOpen(
                                            false
                                        );
                                        setImageZoom(
                                            1
                                        );
                                    }}
                                    className="
                                        w-full
                                        rounded-lg
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
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </>
    );
}