
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
} from "lucide-react";

const leaderboardLinks = [
    {
        name: "Overall",
        href: "/teacher/leaderboard",
        icon: BarChart3,
    },
    {
        name: "Daily",
        href: "/teacher/leaderboard/daily",
        icon: CalendarDays,
    },
    {
        name: "Weekly",
        href: "/teacher/leaderboard/weekly",
        icon: BarChart3,
    },
    {
        name: "Monthly",
        href: "/teacher/leaderboard/monthly",
        icon: BarChart3,
    },
    {
        name: "Awards",
        href: "/teacher/leaderboard/awards",
        icon: Trophy,
    },
    {
        name: "Streaks",
        href: "/teacher/leaderboard/streaks",
        icon: Crown,
    },
];

type TeacherProfile = {
    name: string;
    username: string;
    profileImg: string | null;
};

export default function TeacherSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [teacher, setTeacher] =
        useState<TeacherProfile | null>(null);

    const [loadingTeacher, setLoadingTeacher] =
        useState(true);

    const [loggingOut, setLoggingOut] =
        useState(false);

    /*
     * =====================================================
     * ACTIVE SECTIONS
     * =====================================================
     */

    const assignmentsActive =
        pathname.startsWith(
            "/teacher/assignments"
        );

    const leaderboardOpen =
        pathname.startsWith(
            "/teacher/leaderboard"
        );

    /*
     * =====================================================
     * LOAD CURRENT TEACHER PROFILE
     * =====================================================
     */

    useEffect(() => {
        let mounted = true;

        async function loadTeacherProfile() {
            try {
                const response =
                    await fetch(
                        "/api/teacher/profile",
                        {
                            method: "GET",
                            cache: "no-store",
                        }
                    );

                if (!response.ok) {
                    if (
                        response.status ===
                        401
                    ) {
                        router.replace("/");
                    }

                    return;
                }

                const data =
                    await response.json();

                if (
                    mounted &&
                    data.teacher
                ) {
                    setTeacher({
                        name:
                            data.teacher.name ||
                            "Teacher",

                        username:
                            data.teacher
                                .username ||
                            "",

                        profileImg:
                            data.teacher
                                .profileImg ||
                            null,
                    });
                }
            } catch (error) {
                console.error(
                    "LOAD TEACHER PROFILE ERROR:",
                    error
                );
            } finally {
                if (mounted) {
                    setLoadingTeacher(
                        false
                    );
                }
            }
        }

        loadTeacherProfile();

        return () => {
            mounted = false;
        };
    }, [router]);

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

    const teacherName =
        teacher?.name || "Teacher";

    const teacherUsername =
        teacher?.username || "";

    const teacherInitial =
        teacherName
            .trim()
            .charAt(0)
            .toUpperCase() || "T";

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
                <Link href="/teacher">
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
                        Teacher Portal
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
                        ASSIGNMENTS
                    ================================================== */}

                    <Link
                        href="/teacher/assignments"
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
                                assignmentsActive
                                    ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                    : "text-(--text-primary) hover:bg-(--navy-800)"
                            }
                        `}
                    >
                        <ClipboardList
                            size={20}
                            strokeWidth={1.8}
                        />

                        <span>
                            Assignments
                        </span>
                    </Link>

                    {/* =================================================
                        LEADERBOARD
                    ================================================== */}

                    <div className="pt-1">
                        <Link
                            href="/teacher/leaderboard"
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
                </div>
            </nav>

            {/* =====================================================
                TEACHER ACCOUNT + LOGOUT
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
                {/* =================================================
                    TEACHER PROFILE
                    NOT CLICKABLE
                ================================================== */}

                <div
                    className="
                        flex
                        items-center
                        gap-3
                        rounded-xl
                        px-2
                        py-2
                    "
                >
                    {/* Profile image */}

                    {teacher?.profileImg ? (
                        <img
                            src={
                                teacher.profileImg
                            }
                            alt={
                                teacherName
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
                            {loadingTeacher
                                ? "..."
                                : teacherInitial}
                        </div>
                    )}

                    {/* Teacher name + username */}

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
                            {loadingTeacher
                                ? "Loading..."
                                : teacherName}
                        </p>

                        <p
                            className="
                                truncate
                                text-xs
                                opacity-50
                            "
                        >
                            {loadingTeacher
                                ? "Loading..."
                                : teacherUsername
                                    ? `@${teacherUsername}`
                                    : "Teacher"}
                        </p>
                    </div>
                </div>

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

