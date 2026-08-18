import StudentTable from "@/app/components/head/students/student-table";
import Link from "next/link";

import {
    Plus
} from "lucide-react";

export default function StudentsPage() {
    return (
        <div
            className="
                min-h-screen
                px-3
                py-5
                sm:px-6
                sm:py-8
                lg:px-8
            "
        >
            <div className="mx-auto w-full max-w-7xl">
                <p
                    className="
                        mb-1
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.25em]
                        text-(--gold-400)
                        sm:text-xs
                        sm:tracking-[0.3em]
                    "
                >
                    Head Portal
                </p>

                <div
                    className="
                        mt-2
                        flex
                        flex-col
                        items-start
                        justify-between
                        gap-3
                        sm:mt-3
                        sm:flex-row
                        sm:items-center
                        sm:gap-4
                    "
                >
                    <h1
                        className="
                            font-heading
                            text-3xl
                            font-bold
                            tracking-wide
                            text-white
                            sm:text-4xl
                            md:text-5xl
                        "
                    >
                        Students
                    </h1>

                    <Link
                        href="/head/students/add"
                        className="
                            inline-flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-(--gold-500)
                            px-4
                            py-3
                            text-sm
                            font-medium
                            text-black
                            transition
                            hover:opacity-90
                            active:scale-[0.98]
                            sm:w-auto
                            sm:px-5
                        "
                    >
                        <Plus
                            size={18}
                            strokeWidth={2}
                        />

                        <span>Add Student</span>
                    </Link>
                </div>

                <p
                    className="
                        mt-2
                        max-w-2xl
                        text-xs
                        leading-5
                        opacity-70
                        sm:mt-3
                        sm:text-sm
                        sm:leading-normal
                    "
                >
                    Create and manage student accounts.
                </p>

                <div
                    className="
                        mt-6
                        w-full
                        sm:mt-8
                        lg:mt-10
                    "
                >
                    <StudentTable />
                </div>
            </div>
        </div>
    );
}