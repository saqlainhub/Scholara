
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    Crown,
    GraduationCap,
    LogOut,
    Trophy,
    UserCircle,
    Users,
} from "lucide-react";

const templateLinks = [
    {
        name: "Routines",
        href: "/head/templates/routines",
        icon: ClipboardList,
    },
    {
        name: "Tasks",
        href: "/head/templates/tasks",
        icon: ClipboardList,
    },
];

const leaderboardLinks = [
    {
        name: "Overall",
        href: "/head/leaderboard",
        icon: BarChart3,
    },
    {
        name: "Daily",
        href: "/head/leaderboard/daily",
        icon: CalendarDays,
    },
    {
        name: "Weekly",
        href: "/head/leaderboard/weekly",
        icon: BarChart3,
    },
    {
        name: "Monthly",
        href: "/head/leaderboard/monthly",
        icon: BarChart3,
    },
    {
        name: "Award",
        href: "/head/leaderboard/awards",
        icon: Trophy,
    },
    {
        name: "Streaks",
        href: "/head/leaderboard/streaks",
        icon: Crown,
    },
];

type HeadProfile = {
    name: string;
    profileImg: string | null;
};

export default function HeadSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [head, setHead] =
        useState<HeadProfile | null>(null);

    const [loadingHead, setLoadingHead] =
        useState(true);

    const [loggingOut, setLoggingOut] =
        useState(false);

    /*
     * =====================================================
     * ACTIVE SECTIONS
     * =====================================================
     */

    const templatesOpen =
        pathname.startsWith(
            "/head/templates"
        );

    const leaderboardOpen =
        pathname.startsWith(
            "/head/leaderboard"
        );

    const profileActive =
        pathname.startsWith(
            "/head/profile"
        );

    /*
     * =====================================================
     * FETCH HEAD PROFILE
     * =====================================================
     *
     * Existing API:
     *
     * GET /api/head/profile
     *
     * Response:
     *
     * {
     *     exists: true,
     *     head: {
     *         name,
     *         profileImg,
     *         ...
     *     }
     * }
     *
     * We therefore read data.head.
     */

    useEffect(() => {
        let mounted = true;

        async function loadHeadProfile() {
            try {
                const response =
                    await fetch(
                        "/api/head/profile",
                        {
                            method: "GET",
                            cache: "no-store",
                        }
                    );

                if (!response.ok) {
                    console.error(
                        "Failed to fetch head profile."
                    );

                    return;
                }

                const data =
                    await response.json();

                if (
                    mounted &&
                    data.head
                ) {
                    setHead({
                        name:
                            data.head.name ||
                            "Head",

                        profileImg:
                            data.head
                                .profileImg ||
                            null,
                    });
                }
            } catch (error) {
                console.error(
                    "LOAD HEAD PROFILE ERROR:",
                    error
                );
            } finally {
                if (mounted) {
                    setLoadingHead(false);
                }
            }
        }

        loadHeadProfile();

        return () => {
            mounted = false;
        };
    }, []);

    /*
     * =====================================================
     * LOGOUT
     * =====================================================
     */

    async function handleLogout() {
        if (loggingOut) {
            return;
        }

        try {
            setLoggingOut(true);

            const response =
                await fetch(
                    "/api/auth/logout",
                    {
                        method: "POST",
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Logout failed."
                );
            }

            router.replace("/");
            router.refresh();
        } catch (error) {
            console.error(
                "LOGOUT ERROR:",
                error
            );

            setLoggingOut(false);
        }
    }

    /*
     * =====================================================
     * DISPLAY VALUES
     * =====================================================
     */

    const headName =
        head?.name || "Head";

    const headInitial =
        headName
            .trim()
            .charAt(0)
            .toUpperCase() || "H";

    return (
        <aside
            className="
                h-full
                w-full
                flex
                flex-col
                bg-(--navy-900)
                border-r
                border-(--border)
            "
        >
            {/* =====================================================
                LOGO
            ====================================================== */}

            <div
                className="
                    shrink-0
                    px-6
                    pb-4
                    pt-7
                "
            >
                <Link href="/head">
                    <h1
                        className="
                            font-serif
                            text-4xl
                            tracking-tight
                            text-(--gold-500)
                        "
                    >
                        Scholara
                    </h1>

                    <p
                        className="
                            mt-1
                            text-[11px]
                            uppercase
                            tracking-[2.5px]
                            opacity-60
                        "
                    >
                        Head Portal
                    </p>
                </Link>
            </div>

            {/* =====================================================
                NAVIGATION
            ====================================================== */}

            <nav
                className="
                    min-h-0
                    flex-1
                    overflow-y-auto
                    scrollbar-none
                    px-4
                    py-4
                "
            >
                <div className="space-y-2">

                    {/* =================================================
                        STUDENTS
                    ================================================== */}

                    <Link
                        href="/head/students"
                        className={`
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            px-4
                            py-3
                            transition-all
                            duration-200
                            ${
                                pathname.startsWith(
                                    "/head/students"
                                )
                                    ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                    : "text-(--text-primary) hover:bg-(--navy-800)"
                            }
                        `}
                    >
                        <Users
                            size={20}
                            strokeWidth={1.8}
                        />

                        <span>
                            Students
                        </span>
                    </Link>

                    {/* =================================================
                        TEACHERS
                    ================================================== */}

                    <Link
                        href="/head/teachers"
                        className={`
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            px-4
                            py-3
                            transition-all
                            duration-200
                            ${
                                pathname.startsWith(
                                    "/head/teachers"
                                )
                                    ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                    : "text-(--text-primary) hover:bg-(--navy-800)"
                            }
                        `}
                    >
                        <GraduationCap
                            size={20}
                            strokeWidth={1.8}
                        />

                        <span>
                            Teachers
                        </span>
                    </Link>

                    {/* =================================================
                        TEMPLATES
                    ================================================== */}

                    <div className="pt-1">
                        <Link
                            href="/head/templates/routines"
                            className={`
                                flex
                                items-center
                                justify-between
                                rounded-xl
                                px-4
                                py-3
                                transition-all
                                duration-200
                                ${
                                    templatesOpen
                                        ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                        : "text-(--text-primary) hover:bg-(--navy-800)"
                                }
                            `}
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >
                                <ClipboardList
                                    size={20}
                                    strokeWidth={1.8}
                                />

                                <span>
                                    Templates
                                </span>
                            </div>

                            <ChevronDown
                                size={17}
                                strokeWidth={1.8}
                                className={`
                                    transition-transform
                                    duration-200
                                    ${
                                        templatesOpen
                                            ? "rotate-180"
                                            : ""
                                    }
                                `}
                            />
                        </Link>

                        {templatesOpen && (
                            <div
                                className="
                                    ml-5
                                    mt-1
                                    space-y-1
                                    border-l
                                    border-(--border)
                                    pl-4
                                "
                            >
                                {templateLinks.map(
                                    (link) => {
                                        const Icon =
                                            link.icon;

                                        const isActive =
                                            pathname ===
                                                link.href ||
                                            pathname.startsWith(
                                                `${link.href}/`
                                            );

                                        return (
                                            <Link
                                                key={
                                                    link.href
                                                }
                                                href={
                                                    link.href
                                                }
                                                className={`
                                                    flex
                                                    items-center
                                                    gap-3
                                                    rounded-lg
                                                    px-3
                                                    py-2.5
                                                    text-sm
                                                    transition-colors
                                                    duration-200
                                                    ${
                                                        isActive
                                                            ? "font-semibold text-(--gold-500)"
                                                            : "text-(--text-primary) opacity-60 hover:opacity-100"
                                                    }
                                                `}
                                            >
                                                <Icon
                                                    size={
                                                        16
                                                    }
                                                    strokeWidth={
                                                        1.8
                                                    }
                                                />

                                                <span>
                                                    {
                                                        link.name
                                                    }
                                                </span>
                                            </Link>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        LEADERBOARD
                    ================================================== */}

                    <div className="pt-1">
                        <Link
                            href="/head/leaderboard"
                            className={`
                                flex
                                items-center
                                justify-between
                                rounded-xl
                                px-4
                                py-3
                                transition-all
                                duration-200
                                ${
                                    leaderboardOpen
                                        ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                        : "text-(--text-primary) hover:bg-(--navy-800)"
                                }
                            `}
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >
                                <Trophy
                                    size={20}
                                    strokeWidth={1.8}
                                />

                                <span>
                                    Leaderboard
                                </span>
                            </div>

                            <ChevronDown
                                size={17}
                                strokeWidth={1.8}
                                className={`
                                    transition-transform
                                    duration-200
                                    ${
                                        leaderboardOpen
                                            ? "rotate-180"
                                            : ""
                                    }
                                `}
                            />
                        </Link>

                        {leaderboardOpen && (
                            <div
                                className="
                                    ml-5
                                    mt-1
                                    space-y-1
                                    border-l
                                    border-(--border)
                                    pl-4
                                "
                            >
                                {leaderboardLinks.map(
                                    (link) => {
                                        const Icon =
                                            link.icon;

                                        const isActive =
                                            pathname ===
                                            link.href;

                                        return (
                                            <Link
                                                key={
                                                    link.href
                                                }
                                                href={
                                                    link.href
                                                }
                                                className={`
                                                    flex
                                                    items-center
                                                    gap-3
                                                    rounded-lg
                                                    px-3
                                                    py-2.5
                                                    text-sm
                                                    transition-colors
                                                    duration-200
                                                    ${
                                                        isActive
                                                            ? "font-semibold text-(--gold-500)"
                                                            : "text-(--text-primary) opacity-60 hover:opacity-100"
                                                    }
                                                `}
                                            >
                                                <Icon
                                                    size={
                                                        16
                                                    }
                                                    strokeWidth={
                                                        1.8
                                                    }
                                                />

                                                <span>
                                                    {
                                                        link.name
                                                    }
                                                </span>
                                            </Link>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        PROFILE
                    ================================================== */}

                    <Link
                        href="/head/profile"
                        className={`
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            px-4
                            py-3
                            transition-all
                            duration-200
                            ${
                                profileActive
                                    ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                    : "text-(--text-primary) hover:bg-(--navy-800)"
                            }
                        `}
                    >
                        <UserCircle
                            size={20}
                            strokeWidth={1.8}
                        />

                        <span>
                            Profile
                        </span>
                    </Link>
                </div>
            </nav>

            {/* =====================================================
                HEAD PROFILE
            ====================================================== */}

            <div
                className="
                    shrink-0
                    border-t
                    border-(--border)
                    px-4
                    py-4
                "
            >
                <Link
                    href="/head/profile"
                    className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-2
                        py-2
                        transition-colors
                        hover:bg-(--navy-800)
                    "
                >
                    {/* =================================================
                        PROFILE IMAGE
                    ================================================== */}

                    {head?.profileImg ? (
                        <img
                            src={
                                head.profileImg
                            }
                            alt={
                                headName
                            }
                            className="
                                h-11
                                w-11
                                shrink-0
                                rounded-full
                                border-2
                                border-(--gold-border)
                                object-cover
                            "
                        />
                    ) : (
                        <div
                            className="
                                flex
                                h-11
                                w-11
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                border-2
                                border-(--gold-border)
                                bg-(--gold-300)
                                text-sm
                                font-semibold
                                text-(--gold-500)
                            "
                        >
                            {loadingHead
                                ? "..."
                                : headInitial}
                        </div>
                    )}

                    {/* =================================================
                        PROFILE NAME
                    ================================================== */}

                    <div
                        className="
                            min-w-0
                        "
                    >
                        <p
                            className="
                                truncate
                                text-sm
                                font-medium
                            "
                        >
                            {loadingHead
                                ? "Loading..."
                                : headName}
                        </p>

                        <p
                            className="
                                truncate
                                text-xs
                                opacity-50
                            "
                        >
                            Administrator
                        </p>
                    </div>
                </Link>

                {/* =================================================
                    LOGOUT
                ================================================== */}

                <button
                    type="button"
                    onClick={
                        handleLogout
                    }
                    disabled={
                        loggingOut
                    }
                    className="
                        mt-2
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        px-4
                        py-3
                        text-sm
                        text-(--text-primary)
                        transition-all
                        duration-200
                        hover:bg-red-500/10
                        hover:text-red-400
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <LogOut
                        size={20}
                        strokeWidth={1.8}
                    />

                    <span>
                        {loggingOut
                            ? "Logging out..."
                            : "Logout"}
                    </span>
                </button>
            </div>
        </aside>
    );
}

