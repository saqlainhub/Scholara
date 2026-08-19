"use client";

import {
    CalendarDays,
    Check,
    Clock3,
    Moon,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

type DayOfWeek =
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";

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
    items: RoutineItem[];
};

type WeeklyRoutine = {
    dayOfWeek: DayOfWeek;
    assignmentId: string | null;
    routineTemplate: RoutineTemplate | null;
    isWorking: boolean;
};

type Student = {
    id: string;
    name: string;
    username: string;
    profileImg: string | null;
};

type DashboardResponse = {
    student: Student;
    weeklyRoutine: WeeklyRoutine[];
};

type RoutineStatus =
    | "PASSED"
    | "CURRENT"
    | "UPCOMING";

const DAYS: {
    value: DayOfWeek;
    label: string;
}[] = [
    {
        value: "MONDAY",
        label: "Monday",
    },
    {
        value: "TUESDAY",
        label: "Tuesday",
    },
    {
        value: "WEDNESDAY",
        label: "Wednesday",
    },
    {
        value: "THURSDAY",
        label: "Thursday",
    },
    {
        value: "FRIDAY",
        label: "Friday",
    },
    {
        value: "SATURDAY",
        label: "Saturday",
    },
    {
        value: "SUNDAY",
        label: "Sunday",
    },
];

const JS_DAYS: DayOfWeek[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
];

function getCurrentDay(): DayOfWeek {
    return JS_DAYS[new Date().getDay()];
}

function getOrderedDays(): {
    value: DayOfWeek;
    label: string;
}[] {
    const today = getCurrentDay();

    const todayIndex = DAYS.findIndex(
        (day) => day.value === today
    );

    if (todayIndex === -1) {
        return DAYS;
    }

    return [
        ...DAYS.slice(todayIndex),
        ...DAYS.slice(0, todayIndex),
    ];
}

function getDateForDay(
    day: DayOfWeek
) {
    const today = new Date();

    const todayIndex =
        today.getDay();

    const targetIndex =
        JS_DAYS.indexOf(day);

    let difference =
        targetIndex - todayIndex;

    if (difference < 0) {
        difference += 7;
    }

    const date = new Date(today);

    date.setDate(
        today.getDate() + difference
    );

    return date;
}

function formatDate(
    date: Date
) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    ).format(date);
}

function formatDayDate(
    day: DayOfWeek
) {
    return formatDate(
        getDateForDay(day)
    );
}

function getGreeting() {
    const hour =
        new Date().getHours();

    if (
        hour >= 5 &&
        hour < 12
    ) {
        return "Good morning";
    }

    if (
        hour >= 12 &&
        hour < 17
    ) {
        return "Good afternoon";
    }

    return "Good evening";
}

function formatTime(
    time: string
) {
    if (!time) {
        return "";
    }

    const [
        hours,
        minutes,
    ] = time
        .split(":")
        .map(Number);

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }
    ).format(date);
}

function formatDuration(
    minutes: number
) {
    const hours =
        Math.floor(
            minutes / 60
        );

    const remainingMinutes =
        minutes % 60;

    return `${hours}:${remainingMinutes
        .toString()
        .padStart(2, "0")}`;
}

function timeToMinutes(
    time: string
) {
    const [
        hours,
        minutes,
    ] = time
        .split(":")
        .map(Number);

    return (
        hours * 60 +
        minutes
    );
}

function getRoutineStatus(
    routine: RoutineItem,
    selectedDay: DayOfWeek,
    now: Date
): RoutineStatus {
    const todayIndex =
        now.getDay();

    const selectedDayIndex =
        JS_DAYS.indexOf(
            selectedDay
        );

    if (
        selectedDayIndex === -1
    ) {
        return "UPCOMING";
    }

    const dayDifference =
        selectedDayIndex -
        todayIndex;

    if (dayDifference > 0) {
        return "UPCOMING";
    }

    if (dayDifference < 0) {
        return "PASSED";
    }

    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();

    const start =
        timeToMinutes(
            routine.startTime
        );

    const end =
        timeToMinutes(
            routine.endTime
        );

    if (
        currentMinutes < start
    ) {
        return "UPCOMING";
    }

    if (
        currentMinutes >= start &&
        currentMinutes < end
    ) {
        return "CURRENT";
    }

    return "PASSED";
}

function getStatusLabel(
    status: RoutineStatus
) {
    if (
        status === "CURRENT"
    ) {
        return "In progress";
    }

    if (
        status === "PASSED"
    ) {
        return "Completed";
    }

    return "Upcoming";
}

function getStatusClasses(
    status: RoutineStatus
) {
    if (
        status === "CURRENT"
    ) {
        return {
            card: `
                border-(--gold-500)/35
                bg-(--gold-500)/[0.045]
                shadow-[0_12px_40px_rgba(212,175,55,0.07)]
            `,
            dot: `
                border-(--gold-500)
                bg-(--gold-500)
                shadow-[0_0_0_5px_rgba(212,175,55,0.10),0_0_18px_rgba(212,175,55,0.30)]
            `,
            time: `
                text-(--gold-500)
            `,
            badge: `
                border-(--gold-500)/30
                bg-(--gold-500)/10
                text-(--gold-500)
            `,
            icon: `
                border-(--gold-500)/25
                bg-(--gold-500)/10
                text-(--gold-500)
            `,
        };
    }

    if (
        status === "PASSED"
    ) {
        return {
            card: `
                border-white/[0.08]
                bg-(--navy-900)/70
                opacity-55
            `,
            dot: `
                border-white/20
                bg-white/10
            `,
            time: `
                text-white/35
            `,
            badge: `
                border-white/10
                bg-white/[0.03]
                text-white/35
            `,
            icon: `
                border-white/10
                bg-white/[0.03]
                text-white/30
            `,
        };
    }

    return {
        card: `
            border-emerald-400/20
            bg-(--navy-900)
            hover:border-emerald-400/35
        `,
        dot: `
            border-emerald-400/60
            bg-(--navy-950)
        `,
        time: `
            text-emerald-400
        `,
        badge: `
            border-emerald-400/20
            bg-emerald-400/[0.06]
            text-emerald-400
        `,
        icon: `
            border-emerald-400/15
            bg-emerald-400/[0.05]
            text-emerald-400
        `,
    };
}

export default function StudentDashboardPage() {
    const [
        student,
        setStudent,
    ] =
        useState<Student | null>(
            null
        );

    const [
        weeklyRoutine,
        setWeeklyRoutine,
    ] =
        useState<
            WeeklyRoutine[]
        >([]);

    const [
        selectedDay,
        setSelectedDay,
    ] =
        useState<DayOfWeek>(
            getCurrentDay()
        );

    const [
        now,
        setNow,
    ] =
        useState(
            new Date()
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    /*
     * Keep dashboard clock alive.
     */
    useEffect(() => {
        const interval =
            setInterval(() => {
                setNow(
                    new Date()
                );
            }, 30_000);

        return () => {
            clearInterval(
                interval
            );
        };
    }, []);

    /*
     * Load dashboard data.
     */
    useEffect(() => {
        async function loadDashboard() {
            try {
                setLoading(true);
                setError("");

                const params =
                    new URLSearchParams(
                        window.location.search
                    );

                const viewAs =
                    params.get(
                        "viewAs"
                    );

                const dashboardUrl =
                    viewAs
                        ? `/api/student/dashboard?viewAs=${encodeURIComponent(
                              viewAs
                          )}`
                        : "/api/student/dashboard";

                const response =
                    await fetch(
                        dashboardUrl,
                        {
                            method: "GET",
                            cache: "no-store",
                        }
                    );

                const data:
                    DashboardResponse & {
                        message?: string;
                    } =
                    await response.json();

                if (
                    !response.ok
                ) {
                    setError(
                        data.message ||
                            "Failed to load dashboard."
                    );

                    return;
                }

                setStudent(
                    data.student
                );

                setWeeklyRoutine(
                    data.weeklyRoutine
                );
            } catch (
                error
            ) {
                console.error(
                    "LOAD STUDENT DASHBOARD ERROR:",
                    error
                );

                setError(
                    "Something went wrong while loading your dashboard."
                );
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const greeting =
        useMemo(
            () =>
                getGreeting(),
            [now]
        );

    const formattedDate =
        useMemo(
            () =>
                formatDate(now),
            [now]
        );

    const selectedRoutine =
        weeklyRoutine.find(
            (item) =>
                item.dayOfWeek ===
                selectedDay
        );

    const routineTemplate =
        selectedRoutine
            ?.routineTemplate ??
        null;

    const routineItems =
        routineTemplate
            ?.items ?? [];

    const isOffDay =
        selectedRoutine
            ? !selectedRoutine.isWorking
            : false;

    const orderedDays =
        getOrderedDays();

    /*
     * =============================================================
     * LOADING
     * =============================================================
     */

    if (loading) {
        return (
            <main className="w-full min-w-0 max-w-full overflow-x-clip">
                <div className="w-full min-w-0 space-y-8 px-4 py-6 sm:space-y-10 sm:p-8">
                    <div>
                        <div className="h-3.5 w-28 animate-pulse rounded bg-(--navy-800) sm:h-4 sm:w-32" />

                        <div className="mt-3 h-9 w-full max-w-[360px] animate-pulse rounded bg-(--navy-800) sm:h-10 sm:w-96" />

                        <div className="mt-3 h-3.5 w-48 animate-pulse rounded bg-(--navy-800) sm:h-4 sm:w-56" />
                    </div>

                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2">
                        <div className="flex w-max gap-2">
                            {DAYS.map(
                                (day) => (
                                    <div
                                        key={
                                            day.value
                                        }
                                        className="h-10 w-24 shrink-0 animate-pulse rounded-xl bg-(--navy-800)"
                                    />
                                )
                            )}
                        </div>
                    </div>

                    <div className="h-9 w-56 animate-pulse rounded bg-(--navy-800) sm:h-10 sm:w-64" />

                    <div className="h-36 animate-pulse rounded-2xl bg-(--navy-800) sm:h-32" />

                    <div className="space-y-4 sm:space-y-6">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={
                                        item
                                    }
                                    className="h-44 animate-pulse rounded-2xl bg-(--navy-800) sm:h-28"
                                />
                            )
                        )}
                    </div>
                </div>
            </main>
        );
    }

    /*
     * =============================================================
     * ERROR
     * =============================================================
     */

    if (error) {
        return (
            <main className="w-full min-w-0 max-w-full overflow-x-clip">
                <div className="w-full min-w-0 space-y-6 px-4 py-6 sm:space-y-8 sm:p-8">
                    <div>
                        <p className="text-xs opacity-50 sm:text-sm">
                            Student Dashboard
                        </p>

                        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                            Unable to load dashboard
                        </h1>
                    </div>

                    <div className="w-full min-w-0 rounded-2xl border border-red-400/30 bg-red-400/5 px-4 py-4 text-sm leading-6 text-red-300 sm:px-5">
                        {error}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="w-full min-w-0 max-w-full overflow-x-clip">
            <div className="w-full min-w-0 space-y-8 px-4 py-5 sm:space-y-10 sm:p-8">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <section className="mt-2 min-w-0 sm:mt-10">
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-(--gold-500)" />

                        <p className="text-xs font-semibold font-heading tracking-wide text-(--gold-500) uppercase sm:text-sm">
                            {greeting}
                        </p>
                    </div>

                    <h1 className="mt-2 max-w-full break-words text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                        Welcome back,{" "}
                        <span className="text-(--gold-500)">
                            {student?.name ||
                                "Student"}
                        </span>
                    </h1>

                    <div className="mt-3 flex min-w-0 items-start gap-2 text-xs leading-5 opacity-50 sm:mt-4 sm:text-sm">
                        <CalendarDays
                            size={15}
                            strokeWidth={1.8}
                            className="mt-0.5 shrink-0"
                        />

                        <span className="min-w-0 break-words">
                            {formattedDate}
                        </span>
                    </div>
                </section>

                {/* =====================================================
                    DAY SELECTOR
                ====================================================== */}

                <section className="w-full min-w-0">
                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2">
                        <div className="flex w-max min-w-full gap-2">
                            {orderedDays.map(
                                (day) => {
                                    const active =
                                        selectedDay ===
                                        day.value;

                                    const today =
                                        getCurrentDay() ===
                                        day.value;

                                    return (
                                        <button
                                            key={
                                                day.value
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSelectedDay(
                                                    day.value
                                                )
                                            }
                                            className={`
                                                relative
                                                min-h-10
                                                shrink-0
                                                rounded-xl
                                                border
                                                px-4
                                                py-2.5
                                                text-xs
                                                font-medium
                                                whitespace-nowrap
                                                transition-all
                                                duration-200
                                                active:scale-[0.97]
                                                sm:px-5
                                                sm:text-sm
                                                ${
                                                    active
                                                        ? `
                                                            border-(--gold-500)
                                                            bg-(--gold-500)
                                                            text-(--navy-950)
                                                            shadow-[0_8px_24px_rgba(212,175,55,0.12)]
                                                        `
                                                        : `
                                                            border-(--border)
                                                            bg-(--navy-900)
                                                            hover:border-(--gold-500)/50
                                                            hover:bg-(--navy-800)
                                                        `
                                                }
                                            `}
                                        >
                                            {day.label}

                                            {today && (
                                                <span
                                                    className={`
                                                        absolute
                                                        -right-1
                                                        -top-1
                                                        h-2
                                                        w-2
                                                        rounded-full
                                                        ${
                                                            active
                                                                ? "bg-(--navy-950)"
                                                                : "bg-(--gold-500)"
                                                        }
                                                    `}
                                                />
                                            )}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex min-w-0 items-start gap-2 text-xs leading-5 opacity-50 sm:mt-4 sm:text-sm">
                        <CalendarDays
                            size={14}
                            strokeWidth={1.8}
                            className="mt-0.5 shrink-0"
                        />

                        <span className="min-w-0 break-words">
                            {formatDayDate(
                                selectedDay
                            )}
                        </span>
                    </div>
                </section>

                {/* =====================================================
                    DAY CONTENT
                ====================================================== */}

                <section className="w-full min-w-0">

                    {/* =================================================
                        OFF DAY
                    ================================================== */}

                    {isOffDay ? (
                        <div className="relative w-full min-w-0 overflow-hidden rounded-2xl border border-(--gold-500)/20 bg-(--navy-900) px-5 py-12 text-center sm:rounded-3xl sm:px-6 sm:py-20">
                            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--gold-500)/10 blur-3xl sm:h-56 sm:w-56" />

                            <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--gold-500)/30 bg-(--gold-500)/10 text-(--gold-500) sm:h-16 sm:w-16">
                                <Moon
                                    size={25}
                                    strokeWidth={1.6}
                                />
                            </div>

                            <p className="relative mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--gold-500) sm:mt-6 sm:text-xs">
                                {selectedDay}
                            </p>

                            <h3 className="relative mt-2 text-xl font-semibold sm:text-2xl">
                                It&apos;s an Off Day
                            </h3>

                            <p className="relative mx-auto mt-3 max-w-md text-xs leading-5 opacity-50 sm:text-sm sm:leading-6">
                                There are no academic
                                activities scheduled for
                                you today. Take some time
                                to rest and recharge.
                            </p>

                            <div className="relative mx-auto mt-5 h-px w-12 bg-(--gold-500)/30 sm:mt-6 sm:w-16" />
                        </div>
                    ) : !routineTemplate ||
                      routineItems.length === 0 ? (

                        /* =================================================
                           NO ROUTINE
                        ================================================== */

                        <div className="w-full min-w-0 rounded-2xl border border-(--border) bg-(--navy-900) px-5 py-12 text-center sm:rounded-3xl sm:px-6 sm:py-16">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-(--border) bg-(--navy-800)">
                                <CalendarDays
                                    size={22}
                                    strokeWidth={1.7}
                                    className="opacity-50"
                                />
                            </div>

                            <h3 className="mt-5 text-base font-semibold">
                                No routine scheduled
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 opacity-50 sm:text-sm sm:leading-6">
                                There is no routine assigned
                                to you for this day.
                            </p>
                        </div>

                    ) : (

                        /* =================================================
                           ROUTINE
                        ================================================== */

                        <div className="w-full min-w-0">

                            {/* Routine header */}

                            <div className="mb-5 flex min-w-0 items-end justify-between gap-3 sm:mb-6 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--gold-500) sm:text-[11px]">
                                        Daily routine
                                    </p>

                                    <h2 className="mt-1 text-xl font-semibold tracking-wide sm:mt-1.5 sm:text-2xl">
                                        <span className="text-(--gold-500)">
                                            {selectedDay}&apos;s{" "}
                                        </span>
                                        Routine
                                    </h2>
                                </div>

                                <div className="shrink-0 rounded-xl border border-(--border) bg-(--navy-900) px-3 py-2 text-right">
                                    <p className="text-[9px] uppercase tracking-wider opacity-35 sm:text-[10px]">
                                        Activities
                                    </p>

                                    <p className="mt-0.5 text-sm font-semibold text-(--gold-500)">
                                        {
                                            routineItems.length
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Timeline */}

                            <div className="w-full min-w-0">

                                <div className="space-y-5">

                                    {routineItems.map(
                                        (
                                            routine,
                                            index
                                        ) => {
                                            const status =
                                                getRoutineStatus(
                                                    routine,
                                                    selectedDay,
                                                    now
                                                );

                                            const classes =
                                                getStatusClasses(
                                                    status
                                                );

                                            return (
                                                <div
                                                    key={
                                                        routine.id
                                                    }
                                                    className="relative w-full min-w-0"
                                                >

                                                    {/* =================================================
                                                        MOBILE META
                                                    ================================================== */}

                                                    <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3 sm:hidden">

                                                        <div className="flex min-w-0 items-center gap-3">

                                                            <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                                                                <div
                                                                    className={`
                                                                        relative
                                                                        z-10
                                                                        h-3
                                                                        w-3
                                                                        rounded-full
                                                                        border-2
                                                                        ${classes.dot}
                                                                    `}
                                                                />

                                                                {status ===
                                                                    "CURRENT" && (
                                                                    <span className="absolute -inset-1 animate-ping rounded-full border border-(--gold-500)/20" />
                                                                )}
                                                            </div>

                                                            <div
                                                                className={`
                                                                    flex
                                                                    min-w-0
                                                                    items-center
                                                                    gap-1.5
                                                                    text-[11px]
                                                                    font-medium
                                                                    tracking-wide
                                                                    ${classes.time}
                                                                `}
                                                            >
                                                                <Clock3
                                                                    size={
                                                                        13
                                                                    }
                                                                    strokeWidth={
                                                                        1.8
                                                                    }
                                                                />

                                                                <span className="whitespace-nowrap">
                                                                    {formatTime(
                                                                        routine.startTime
                                                                    )}
                                                                </span>

                                                                <span className="opacity-30">
                                                                    →
                                                                </span>

                                                                <span className="whitespace-nowrap">
                                                                    {formatTime(
                                                                        routine.endTime
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-(--border) bg-(--navy-800) px-2.5 py-1.5">
                                                            <span className="text-[8px] uppercase tracking-wider opacity-35">
                                                                Duration
                                                            </span>

                                                            <span className="font-mono text-[10px] font-semibold text-(--gold-500)">
                                                                {formatDuration(
                                                                    routine.durationMin
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* =================================================
                                                        DESKTOP TIMELINE
                                                    ================================================== */}

                                                    <div className="hidden sm:grid sm:grid-cols-[68px_32px_minmax(0,1fr)] sm:items-stretch sm:gap-x-4">

                                                        <div className="pt-6">
                                                            <div
                                                                className={`
                                                                    text-xs
                                                                    font-medium
                                                                    tracking-wide
                                                                    mt-3
                                                                    ${classes.time}
                                                                `}
                                                            >
                                                                {formatTime(
                                                                    routine.startTime
                                                                )}
                                                            </div>

                                                            <div className="mt-1 text-[10px] opacity-35">
                                                                {formatTime(
                                                                    routine.endTime
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="relative flex justify-center">
                                                            <div
                                                                className={`
                                                                    relative
                                                                    z-10
                                                                    mt-11
                                                                    h-3
                                                                    w-3
                                                                    shrink-0
                                                                    rounded-full
                                                                    border-2
                                                                    ${classes.dot}
                                                                `}
                                                            />

                                                            {status ===
                                                                "CURRENT" && (
                                                                <span className="absolute top-8.5 h-8 w-8 animate-ping rounded-full border border-(--gold-500)/20" />
                                                            )}
                                                        </div>

                                                        {/* =================================================
                                                            CARD
                                                        ================================================== */}

                                                        <div
                                                            className={`
                                                                relative
                                                                min-w-0
                                                                max-w-full
                                                                overflow-hidden
                                                                rounded-2xl
                                                                border
                                                                ${classes.card}
                                                            `}
                                                        >

                                                            {status ===
                                                                "CURRENT" && (
                                                                <div className="absolute inset-y-0 left-0 w-0.5 bg-(--gold-500)" />
                                                            )}

                                                            <div className="relative min-w-0 px-5 py-5">

                                                                {/* Duration top-right */}

                                                                <div className="absolute right-5 top-4 flex shrink-0 items-center gap-2 rounded-xl border border-(--border) bg-(--navy-800) px-3 py-2">
                                                                    <span className="text-[9px] uppercase tracking-wider opacity-35">
                                                                        Duration
                                                                    </span>

                                                                    <span className="font-mono text-xs font-semibold text-(--gold-500)">
                                                                        {formatDuration(
                                                                            routine.durationMin
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {/* Main content */}

                                                                <div className="min-w-0 pr-36">

                                                                    <div className="flex min-w-0 items-start gap-3">

                                                                        {/* Number */}

                                                                        <div
                                                                            className={`
                                                                                mt-0.5
                                                                                flex
                                                                                h-7
                                                                                w-7
                                                                                shrink-0
                                                                                items-center
                                                                                justify-center
                                                                                rounded-lg
                                                                                border
                                                                                text-[10px]
                                                                                font-semibold
                                                                                ${classes.icon}
                                                                            `}
                                                                        >
                                                                            {status ===
                                                                            "PASSED" ? (
                                                                                <Check
                                                                                    size={
                                                                                        13
                                                                                    }
                                                                                    strokeWidth={
                                                                                        2.2
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                String(
                                                                                    index +
                                                                                        1
                                                                                ).padStart(
                                                                                    2,
                                                                                    "0"
                                                                                )
                                                                            )}
                                                                        </div>

                                                                        {/* Title + Badge */}

                                                                        <div className="min-w-0 flex-1">

                                                                            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">

                                                                                <h3
                                                                                    className="min-w-0 text-sm font-semibold tracking-wide sm:text-lg"
                                                                                    title={
                                                                                        routine.title
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        routine.title
                                                                                    }
                                                                                </h3>

                                                                                <span
                                                                                    className={`
                                                                                        shrink-0
                                                                                        rounded-full
                                                                                        border
                                                                                        px-2
                                                                                        py-1
                                                                                        text-[8px]
                                                                                        font-semibold
                                                                                        uppercase
                                                                                        tracking-[0.1em]
                                                                                        sm:px-2.5
                                                                                        sm:text-[9px]
                                                                                        ${classes.badge}
                                                                                    `}
                                                                                >
                                                                                    {getStatusLabel(
                                                                                        status
                                                                                    )}
                                                                                </span>
                                                                            </div>

                                                                            <p className="mt-2 max-w-2xl text-xs leading-5 opacity-50 sm:text-sm sm:leading-6">
                                                                                {routine.description ||
                                                                                    "No description provided."}
                                                                            </p>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* =================================================
                                                        MOBILE CARD
                                                    ================================================== */}

                                                    <div className="sm:hidden">

                                                        <div
                                                            className={`
                                                                relative
                                                                w-full
                                                                min-w-0
                                                                max-w-full
                                                                overflow-hidden
                                                                rounded-2xl
                                                                border
                                                                ${classes.card}
                                                            `}
                                                        >

                                                            {status ===
                                                                "CURRENT" && (
                                                                <div className="absolute inset-y-0 left-0 w-0.5 bg-(--gold-500)" />
                                                            )}

                                                            <div className="relative min-w-0 px-4 py-4">


                                                                <div className="min-w-0">

                                                                    <div className="flex min-w-0 items-start gap-3">

                                                                        {/* Number */}

                                                                        <div
                                                                            className={`
                                                                                mt-0.5
                                                                                flex
                                                                                h-7
                                                                                w-7
                                                                                shrink-0
                                                                                items-center
                                                                                justify-center
                                                                                rounded-lg
                                                                                border
                                                                                text-[10px]
                                                                                font-semibold
                                                                                ${classes.icon}
                                                                            `}
                                                                        >
                                                                            {status ===
                                                                            "PASSED" ? (
                                                                                <Check
                                                                                    size={
                                                                                        13
                                                                                    }
                                                                                    strokeWidth={
                                                                                        2.2
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                String(
                                                                                    index +
                                                                                        1
                                                                                ).padStart(
                                                                                    2,
                                                                                    "0"
                                                                                )
                                                                            )}
                                                                        </div>

                                                                        {/* Title + Badge */}

                                                                        <div className="min-w-0 flex-1">

                                                                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">

                                                                                <h3
                                                                                    className="min-w-0 text-sm font-semibold tracking-wide"
                                                                                    title={
                                                                                        routine.title
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        routine.title
                                                                                    }
                                                                                </h3>

                                                                                <span
                                                                                    className={`
                                                                                        shrink-0
                                                                                        rounded-full
                                                                                        border
                                                                                        px-2
                                                                                        py-1
                                                                                        text-[8px]
                                                                                        font-semibold
                                                                                        uppercase
                                                                                        tracking-[0.1em]
                                                                                        ${classes.badge}
                                                                                    `}
                                                                                >
                                                                                    {getStatusLabel(
                                                                                        status
                                                                                    )}
                                                                                </span>
                                                                            </div>

                                                                            <p className="mt-2 text-xs leading-5 opacity-50">
                                                                                {routine.description ||
                                                                                    "No description provided."}
                                                                            </p>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}