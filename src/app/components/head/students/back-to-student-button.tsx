"use client";

import { useRouter } from "next/navigation";

export default function BackToStudentButton({
    studentId,
}: {
    studentId: string;
}) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() =>
                router.push(
                    `/head/students/${studentId}`
                )
            }
            className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-(--border)
                px-3
                py-2
                text-sm
                opacity-70
                transition
                hover:bg-(--gold-500)
                hover:text-black
                font-medium
                hover:opacity-100
            "
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
            </svg>

            Back to Student
        </button>
    );
}