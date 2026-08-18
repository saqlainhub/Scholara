"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
    BarChart3,
    CalendarDays,
    ChevronDown,
    ClipboardCheck,
    ClipboardList,
    Crown,
    List,
    LogOut,
    Trophy,
    UserCircle,
} from "lucide-react";

const recordLinks = [
    {
        name: "Overall",
        href: "/student/records",
        icon: List,
    },
    {
        name: "Daily",
        href: "/student/records/daily",
        icon: CalendarDays,
    },
    {
        name: "Weekly",
        href: "/student/records/weekly",
        icon: BarChart3,
    },
    {
        name: "Monthly",
        href: "/student/records/monthly",
        icon: BarChart3,
    },
];

const leaderboardLinks = [
    {
        name: "Overall",
        href: "/student/leaderboard",
        icon: BarChart3,
    },
    {
        name: "Daily",
        href: "/student/leaderboard/daily",
        icon: CalendarDays,
    },
    {
        name: "Weekly",
        href: "/student/leaderboard/weekly",
        icon: BarChart3,
    },
    {
        name: "Monthly",
        href: "/student/leaderboard/monthly",
        icon: BarChart3,
    },
    {
        name: "Awards",
        href: "/student/leaderboard/awards",
        icon: Trophy,
    },
    {
        name: "Streaks",
        href: "/student/leaderboard/streaks",
        icon: Crown,
    },
];


type StudentProfile = {
    name: string;
    username: string;
    profileImg: string | null;
};

export default function StudentSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const [student, setStudent] =
        useState<StudentProfile | null>(null);

    const [loadingStudent, setLoadingStudent] =
        useState(true);

    const [loggingOut, setLoggingOut] =
        useState(false);

    const recordsOpen =
        pathname.startsWith(
            "/student/records"
        );

    const leaderboardOpen =
        pathname.startsWith(
            "/student/leaderboard"
        );

    const dashboardActive =
        pathname === "/student" ||
        pathname === "/student/";

    const tasksActive =
        pathname.startsWith(
            "/student/tasks"
        );

    const assignmentsActive =
        pathname.startsWith(
            "/student/assignments"
        );

    const profileActive =
        pathname.startsWith(
            "/student/profile"
        );

    useEffect(() => {
        let mounted = true;

        async function loadStudentProfile() {
            try {
                const response =
                    await fetch(
                        "/api/student/profile",
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
                    data.student
                ) {
                    setStudent({
                        name:
                            data.student.name ||
                            "Student",

                        username:
                            data.student
                                .username ||
                            "",

                        profileImg:
                            data.student
                                .profileImg ||
                            null,
                    });
                }
            } catch (error) {
                console.error(
                    "LOAD STUDENT PROFILE ERROR:",
                    error
                );
            } finally {
                if (mounted) {
                    setLoadingStudent(
                        false
                    );
                }
            }
        }

        loadStudentProfile();

        return () => {
            mounted = false;
        };
    }, [router]);

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

    const studentName =
        student?.name || "Student";

    const studentUsername =
        student?.username || "";

    const studentInitial =
        studentName
            .trim()
            .charAt(0)
            .toUpperCase() || "S";

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
                <Link href="/student">
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
                        Student Portal
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
                        DASHBOARD
                    ================================================== */}

                    <Link
                        href="/student"
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
                                dashboardActive
                                    ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                    : "text-(--text-primary) hover:bg-(--navy-800)"
                            }
                        `}
                    >
                        <BarChart3
                            size={20}
                            strokeWidth={1.8}
                        />

                        <span>
                            Dashboard
                        </span>
                    </Link>

                    {/* =================================================
                        TASKS
                    ================================================== */}

                    <Link
                        href="/student/tasks"
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
                                tasksActive
                                    ? "bg-(--navy-800) font-semibold text-(--gold-500)"
                                    : "text-(--text-primary) hover:bg-(--navy-800)"
                            }
                        `}
                    >
                        <ClipboardCheck
                            size={20}
                            strokeWidth={1.8}
                        />

                        <span>
                            Tasks
                        </span>
                    </Link>

                    {/* =================================================
                        ASSIGNMENTS
                    ================================================== */}

                    <Link
                        href="/student/assignments"
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
                        RECORDS
                    ================================================== */}

                    <div className="pt-1">
                        <Link
                            href="/student/records"
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
                                    recordsOpen
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
                                <CalendarDays
                                    size={20}
                                    strokeWidth={1.8}
                                />

                                <span>
                                    Records
                                </span>
                            </div>

                            <ChevronDown
                                size={17}
                                strokeWidth={1.8}
                                className={`
                                    transition-transform
                                    duration-200
                                    ${
                                        recordsOpen
                                            ? "rotate-180"
                                            : ""
                                    }
                                `}
                            />
                        </Link>

                        {recordsOpen && (
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
                                {recordLinks.map(
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
                        LEADERBOARD
                    ================================================== */}

                    <div className="pt-1">
                        <Link
                            href="/student/leaderboard"
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
                USER CARD + LOGOUT
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
                    CLICKABLE PROFILE
                ================================================== */}

                <div

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
                    {/* Profile image */}

                    {student?.profileImg ? (
                        <img
                            src={
                                student.profileImg
                            }
                            alt={
                                studentName
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
                            {loadingStudent
                                ? "..."
                                : studentInitial}
                        </div>
                    )}

                    {/* Name + username */}

                    <div className="min-w-0">
                        <p
                            className="
                                truncate
                                text-sm
                                font-medium
                            "
                        >
                            {loadingStudent
                                ? "Loading..."
                                : studentName}
                        </p>

                        <p
                            className="
                                truncate
                                text-xs
                                opacity-50
                            "
                        >
                            {loadingStudent
                                ? "Loading..."
                                : studentUsername
                                    ? `@${studentUsername}`
                                    : "Student"}
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