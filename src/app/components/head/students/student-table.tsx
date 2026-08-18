"use client";

import Link from "next/link";

import {
    useEffect,
    useState,
} from "react";

import {
    calculateStudentStatuses,
} from "@/lib/utils/student-status";

type Student = {
    id: string;
    name: string;
    profileImage: string | null;
    totalScore: number;
    createdAt: string;

    user: {
        username: string;
    };
};

type StudentStatus =
    | "TOP"
    | "ACTIVE"
    | "WEAK";

function SummaryCard({
    label,
    value,
    description,
}: {
    label: string;
    value: string | number;
    description?: string;
}) {
    return (
        <div
            className="
                rounded-2xl
                border
                border-(--border)
                bg-(--navy-900)
                px-4
                py-4
                sm:px-5
            "
        >
            <div
                className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    opacity-50
                    sm:text-xs
                    sm:tracking-wider
                "
            >
                {label}
            </div>

            <div
                className="
                    mt-1.5
                    text-2xl
                    font-semibold
                    sm:mt-2
                "
            >
                {value}
            </div>

            {description && (
                <div
                    className="
                        mt-1
                        text-[11px]
                        leading-4
                        opacity-40
                        sm:text-xs
                    "
                >
                    {description}
                </div>
            )}
        </div>
    );
}

function formatDate(
    dateString: string
) {
    const date =
        new Date(dateString);

    return new Intl.DateTimeFormat(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    ).format(date);
}

function getStatusClasses(
    status: StudentStatus
) {
    if (status === "TOP") {
        return `
            bg-(--gold-500)/10
            text-(--gold-500)
        `;
    }

    if (status === "ACTIVE") {
        return `
            bg-green-400/10
            text-green-400
        `;
    }

    return `
        bg-red-400/10
        text-red-400
    `;
}

export default function StudentTable() {
    const [students, setStudents] =
        useState<Student[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // ======================================================
    // LOAD STUDENTS
    // ======================================================

    useEffect(() => {
        let cancelled = false;

        async function loadStudents() {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        "/api/head/students",
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
                            "Failed to load students."
                        );
                    }

                    return;
                }

                if (
                    !Array.isArray(data)
                ) {
                    if (!cancelled) {
                        setError(
                            "Invalid students response from server."
                        );
                    }

                    return;
                }

                if (!cancelled) {
                    setStudents(data);
                }
            } catch (error) {
                console.error(
                    "LOAD STUDENTS ERROR:",
                    error
                );

                if (!cancelled) {
                    setError(
                        "Something went wrong while loading students."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadStudents();

        return () => {
            cancelled = true;
        };
    }, []);

    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {
        return (
            <div
                className="
                    rounded-2xl
                    border
                    border-(--border)
                    px-4
                    py-12
                    text-center
                    sm:px-6
                    sm:py-14
                "
            >
                <p className="text-sm opacity-60">
                    Loading students...
                </p>
            </div>
        );
    }

    // ======================================================
    // ERROR
    // ======================================================

    if (error) {
        return (
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
        );
    }

    // ======================================================
    // CALCULATE STUDENT STATUSES
    // ======================================================

    const {
        averageScore,
        students: studentsWithStatus,
    } =
        calculateStudentStatuses(
            students
        );

    const topStudents =
        studentsWithStatus.filter(
            (student) =>
                student.status ===
                "TOP"
        ).length;

    const activeStudents =
        studentsWithStatus.filter(
            (student) =>
                student.status ===
                "ACTIVE"
        ).length;

    const weakStudents =
        studentsWithStatus.filter(
            (student) =>
                student.status ===
                "WEAK"
        ).length;

    // ======================================================
    // EMPTY
    // ======================================================

    if (students.length === 0) {
        return (
            <div className="space-y-4 sm:space-y-6">

                <div
                    className="
                        grid
                        grid-cols-2
                        gap-2.5
                        sm:grid-cols-2
                        sm:gap-3
                        lg:grid-cols-4
                    "
                >
                    <SummaryCard
                        label="Total Students"
                        value={0}
                        description="All student accounts"
                    />

                    <SummaryCard
                        label="Top"
                        value={0}
                        description="Above 90% of average"
                    />

                    <SummaryCard
                        label="Active"
                        value={0}
                        description="60% – 90% of average"
                    />

                    <SummaryCard
                        label="Weak"
                        value={0}
                        description="Below 60% of average"
                    />
                </div>

                <div
                    className="
                        rounded-2xl
                        border
                        border-dashed
                        border-(--border)
                        px-4
                        py-12
                        text-center
                        sm:px-6
                        sm:py-14
                    "
                >
                    <p className="font-medium">
                        No students found
                    </p>

                    <p
                        className="
                            mx-auto
                            mt-1
                            max-w-xs
                            text-sm
                            leading-5
                            opacity-50
                        "
                    >
                        Create a student account
                        to see it here.
                    </p>
                </div>

            </div>
        );
    }

    // ======================================================
    // TABLE
    // ======================================================

    return (
        <div className="space-y-4 sm:space-y-6">

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div
                className="
                    grid
                    grid-cols-2
                    gap-2.5
                    sm:grid-cols-2
                    sm:gap-3
                    lg:grid-cols-4
                "
            >
                <SummaryCard
                    label="Total Students"
                    value={
                        students.length
                    }
                    description="All student accounts"
                />

                <SummaryCard
                    label="Top"
                    value={
                        topStudents
                    }
                    description="Above 90% of average"
                />

                <SummaryCard
                    label="Active"
                    value={
                        activeStudents
                    }
                    description="60% – 90% of average"
                />

                <SummaryCard
                    label="Weak"
                    value={
                        weakStudents
                    }
                    description="Below 60% of average"
                />
            </div>


            {/* ==================================================
                MOBILE CARDS
            ================================================== */}

            <div
                className="
                    space-y-3
                    md:hidden
                "
            >
                {studentsWithStatus.map(
                    (
                        student,
                        index
                    ) => (
                        <div
                            key={
                                student.id
                            }
                            className="
                                overflow-hidden
                                rounded-2xl
                                border
                                border-(--border)
                                bg-(--navy-900)
                            "
                        >

                            {/* STUDENT HEADER */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                    border-b
                                    border-(--border)
                                    p-4
                                "
                            >

                                <div
                                    className="
                                        flex
                                        min-w-0
                                        items-center
                                        gap-3
                                    "
                                >

                                    {student.profileImage ? (
                                        <img
                                            src={
                                                student.profileImage
                                            }
                                            alt={
                                                student.name
                                            }
                                            className="
                                                h-11
                                                w-11
                                                shrink-0
                                                rounded-full
                                                border
                                                border-(--border)
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
                                                bg-(--navy-800)
                                                text-sm
                                                font-semibold
                                                opacity-70
                                            "
                                        >
                                            {student.name
                                                .charAt(
                                                    0
                                                )
                                                .toUpperCase()}
                                        </div>
                                    )}

                                    <div className="min-w-0">

                                        <p
                                            className="
                                                truncate
                                                text-sm
                                                font-semibold
                                            "
                                        >
                                            {
                                                student.name
                                            }
                                        </p>

                                        <p
                                            className="
                                                mt-0.5
                                                truncate
                                                text-xs
                                                opacity-50
                                            "
                                        >
                                            @
                                            {
                                                student
                                                    .user
                                                    .username
                                            }
                                        </p>

                                    </div>

                                </div>

                                <span
                                    className="
                                        shrink-0
                                        text-[11px]
                                        font-medium
                                        opacity-35
                                    "
                                >
                                    #
                                    {index +
                                        1}
                                </span>

                            </div>

                            {/* STUDENT DETAILS */}

                            <div
                                className="
                                    grid
                                    grid-cols-2
                                    gap-3
                                    p-4
                                "
                            >

                                <div
                                    className="
                                        rounded-xl
                                        bg-(--navy-800)
                                        px-3
                                        py-2.5
                                    "
                                >
                                    <p
                                        className="
                                            text-[10px]
                                            font-medium
                                            uppercase
                                            tracking-[0.12em]
                                            opacity-40
                                        "
                                    >
                                        Score
                                    </p>

                                    <p
                                        className="
                                            mt-1
                                            text-base
                                            font-semibold
                                        "
                                    >
                                        {Number(
                                            student.totalScore ||
                                            0
                                        ).toFixed(
                                            0
                                        )}
                                    </p>
                                </div>

                                <div
                                    className="
                                        rounded-xl
                                        bg-(--navy-800)
                                        px-3
                                        py-2.5
                                    "
                                >
                                    <p
                                        className="
                                            text-[10px]
                                            font-medium
                                            uppercase
                                            tracking-[0.12em]
                                            opacity-40
                                        "
                                    >
                                        Status
                                    </p>

                                    <span
                                        className={`
                                            mt-1
                                            inline-flex
                                            rounded-lg
                                            px-2.5
                                            py-1
                                            text-[11px]
                                            font-semibold
                                            ${getStatusClasses(
                                                student.status
                                            )}
                                        `}
                                    >
                                        {
                                            student.status
                                        }
                                    </span>
                                </div>

                            </div>

                            {/* ACTION */}

                            <div
                                className="
                                    px-4
                                    pb-4
                                "
                            >
                                <Link
                                    href={`/head/students/${student.id}`}
                                    className="
                                        flex
                                        min-h-11
                                        w-full
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-(--gold-500)
                                        px-3
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-(--gold-500)
                                        transition
                                        hover:bg-(--gold-500)
                                        hover:text-black
                                        active:scale-[0.98]
                                    "
                                >
                                    View Student
                                </Link>
                            </div>

                        </div>
                    )
                )}
            </div>

            {/* ==================================================
                DESKTOP TABLE
            ================================================== */}

            <div
                className="
                    hidden
                    overflow-x-auto
                    rounded-2xl
                    border
                    border-(--border)
                    md:block
                "
            >

                <table
                    className="
                        w-full
                        min-w-225
                        text-left
                    "
                >

                    <thead>

                        <tr
                            className="
                                border-b
                                border-(--border)
                                bg-(--navy-900)
                            "
                        >

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                #
                            </th>

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Student
                            </th>

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Username
                            </th>

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Score
                            </th>

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Status
                            </th>

                            <th
                                className="
                                    px-5
                                    py-4
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wider
                                    opacity-50
                                "
                            >
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {studentsWithStatus.map(
                            (
                                student,
                                index
                            ) => (

                                <tr
                                    key={
                                        student.id
                                    }
                                    className="
                                        border-t
                                        border-(--border)
                                        transition
                                        hover:bg-(--navy-900)
                                    "
                                >

                                    {/* NUMBER */}

                                    <td
                                        className="
                                            px-5
                                            py-4
                                            text-sm
                                            opacity-50
                                        "
                                    >
                                        {index +
                                            1}
                                    </td>

                                    {/* STUDENT */}

                                    <td className="px-5 py-4">

                                        <div
                                            className="
                                                flex
                                                items-center
                                                gap-3
                                            "
                                        >

                                            {student.profileImage ? (
                                                <img
                                                    src={
                                                        student.profileImage
                                                    }
                                                    alt={
                                                        student.name
                                                    }
                                                    className="
                                                        h-10
                                                        w-10
                                                        shrink-0
                                                        rounded-full
                                                        object-cover
                                                    "
                                                />
                                            ) : (
                                                <div
                                                    className="
                                                        flex
                                                        h-10
                                                        w-10
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        bg-(--navy-800)
                                                        text-xs
                                                        font-semibold
                                                        opacity-60
                                                    "
                                                >
                                                    {student.name
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>
                                            )}

                                            <span className="font-medium">
                                                {
                                                    student.name
                                                }
                                            </span>

                                        </div>

                                    </td>

                                    {/* USERNAME */}

                                    <td
                                        className="
                                            px-5
                                            py-4
                                            text-sm
                                            opacity-70
                                        "
                                    >
                                        {
                                            student
                                                .user
                                                .username
                                        }
                                    </td>

                                    {/* SCORE */}

                                    <td className="px-5 py-4">

                                        <span
                                            className="
                                                rounded-lg
                                                bg-(--navy-800)
                                                px-3
                                                py-1.5
                                                text-sm
                                                font-semibold
                                            "
                                        >
                                            {Number(
                                                student.totalScore ||
                                                0
                                            ).toFixed(
                                                0
                                            )}
                                        </span>

                                    </td>

                                    {/* STATUS */}

                                    <td className="px-5 py-4">

                                        <span
                                            className={`
                                                inline-flex
                                                rounded-lg
                                                px-3
                                                py-1.5
                                                text-xs
                                                font-semibold
                                                ${getStatusClasses(
                                                    student.status
                                                )}
                                            `}
                                        >
                                            {
                                                student.status
                                            }
                                        </span>

                                    </td>

                                    {/* ACTION */}

                                    <td className="px-5 py-4">

                                        <Link
                                            href={`/head/students/${student.id}`}
                                            className="
                                                inline-flex
                                                rounded-lg
                                                border
                                                border-(--gold-500)
                                                px-3
                                                py-2
                                                text-sm
                                                font-medium
                                                text-(--gold-500)
                                                transition
                                                hover:bg-(--gold-500)
                                                hover:text-black
                                            "
                                        >
                                            View
                                        </Link>

                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}