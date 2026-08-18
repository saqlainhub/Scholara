"use client";

import {
    FormEvent,
    useState,
} from "react";

import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [role, setRole] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response =
                await fetch(
                    "/api/auth/login",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        credentials:
                            "include",
                        body: JSON.stringify({
                            username,
                            password,
                            role,
                        }),
                    }
                );

            /*
             * Read the response as text first.
             * This prevents:
             *
             * Unexpected token '<'
             *
             * when Next.js returns an HTML error page.
             */
            const text =
                await response.text();

            let data: {
                success?: boolean;
                message?: string;
                user?: {
                    id: string;
                    username: string;
                    name: string;
                    role: string;
                };
            } = {};

            try {
                data = text
                    ? JSON.parse(text)
                    : {};
            } catch {
                console.error(
                    "LOGIN API RETURNED NON-JSON:",
                    text
                );

                throw new Error(
                    "The login server returned an invalid response. Check the terminal for the API error."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Login failed."
                );
            }

            if (
                !data.success ||
                !data.user
            ) {
                throw new Error(
                    data.message ||
                        "Login failed."
                );
            }

            /*
             * Redirect according to role.
             */
            switch (
                data.user.role
            ) {
                case "HEAD":
                    router.replace(
                        "/head"
                    );
                    break;

                case "TEACHER":
                    router.replace(
                        "/teacher"
                    );
                    break;

                case "STUDENT":
                    /*
                     * Students use the main student
                     * dashboard. The student ID is NOT
                     * placed in the URL because the
                     * dashboard gets it securely from
                     * the authenticated session.
                     */
                    router.replace(
                        "/student"
                    );
                    break;

                default:
                    throw new Error(
                        "Invalid user role."
                    );
            }
        } catch (error) {
            console.error(
                "LOGIN ERROR:",
                error
            );

            setError(
                error instanceof Error
                    ? error.message
                    : "Login failed."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            className="
                flex
                min-h-dvh
                w-full
                items-center
                justify-center
                px-4
                py-6
                sm:px-6
                sm:py-10
            "
        >
            <section
                className="
                    w-full
                    max-w-md
                    overflow-hidden
                    rounded-2xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    p-5
                    shadow-xl
                    sm:p-7
                    md:p-8
                "
            >
                {/* HEADER */}

                <div className="mb-6 sm:mb-7">
                    <h1
                        className="
                            font-serif
                            text-2xl
                            font-semibold
                            leading-tight
                            sm:text-3xl
                        "
                    >
                        Login
                    </h1>

                    <p
                        className="
                            mt-2
                            max-w-sm
                            text-sm
                            leading-6
                            opacity-50
                        "
                    >
                        Sign in to your Scolara
                        portal.
                    </p>
                </div>

                {/* ERROR */}

                {error && (
                    <div
                        className="
                            mb-5
                            rounded-xl
                            border
                            border-red-400/30
                            bg-red-400/5
                            px-4
                            py-3
                            text-sm
                            leading-5
                            break-words
                            text-red-400
                        "
                    >
                        {error}
                    </div>
                )}

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    autoComplete="new-password"
                    className="space-y-5"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                >
                    {/* USERNAME */}

                    <div>
                        <label
                            htmlFor="username"
                            className="
                                mb-2
                                block
                                text-sm
                                font-medium
                            "
                        >
                            Username
                        </label>

                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target
                                        .value
                                )
                            }
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-bwignore="true"
                            required
                            className="
                                w-full
                                min-w-0
                                rounded-xl
                                border
                                border-(--border)
                                bg-transparent
                                px-4
                                py-3.5
                                text-base
                                outline-none
                                transition
                                placeholder:opacity-30
                                focus:border-(--gold-500)
                                focus:ring-2
                                focus:ring-(--gold-500)/10
                                sm:text-sm
                            "
                        />
                    </div>

                    {/* PASSWORD */}

                    <div>
                        <label
                            htmlFor="password"
                            className="
                                mb-2
                                block
                                text-sm
                                font-medium
                            "
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target
                                        .value
                                )
                            }
                            /*
                             * "new-password" is generally
                             * more effective than "off"
                             * for preventing browsers from
                             * treating this as a saved-login
                             * credential field.
                             */
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-bwignore="true"
                            required
                            className="
                                w-full
                                min-w-0
                                rounded-xl
                                border
                                border-(--border)
                                bg-transparent
                                px-4
                                py-3.5
                                text-base
                                outline-none
                                transition
                                placeholder:opacity-30
                                focus:border-(--gold-500)
                                focus:ring-2
                                focus:ring-(--gold-500)/10
                                sm:text-sm
                            "
                        />
                    </div>

                    {/* ROLE */}

                    <div>
                        <label
                            htmlFor="role"
                            className="
                                mb-2
                                block
                                text-sm
                                font-medium
                            "
                        >
                            Role
                        </label>

                        <select
                            id="role"
                            name="role"
                            value={role}
                            onChange={(event) =>
                                setRole(
                                    event.target
                                        .value
                                )
                            }
                            autoComplete="off"
                            required
                            className="
                                w-full
                                min-w-0
                                rounded-xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                                px-4
                                py-3.5
                                text-base
                                outline-none
                                transition
                                focus:border-(--gold-500)
                                focus:ring-2
                                focus:ring-(--gold-500)/10
                                sm:text-sm
                            "
                        >
                            <option value="">
                                Select role
                            </option>

                            <option value="HEAD">
                                Head
                            </option>

                            <option value="TEACHER">
                                Teacher
                            </option>

                            <option value="STUDENT">
                                Student
                            </option>
                        </select>
                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            mt-1
                            flex
                            min-h-12
                            w-full
                            items-center
                            justify-center
                            rounded-xl
                            bg-(--gold-500)
                            px-5
                            py-3
                            text-sm
                            font-semibold
                            text-black
                            transition
                            hover:opacity-90
                            active:scale-[0.99]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        {loading
                            ? "Signing in..."
                            : "Login"}
                    </button>
                </form>
            </section>
        </main>
    );
}