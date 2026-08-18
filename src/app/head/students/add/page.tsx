import AddStudentForm from "@/app/components/head/students/add-student-form";

export default function AddStudentPage() {
    return (
        <main
            className="
                min-h-screen
                px-3
                py-5
                sm:px-6
                sm:py-8
                lg:px-8
            "
        >
            <div className="mx-auto w-full max-w-3xl">
                <p
                    className="
                        mb-1
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.25em]
                        text-(--gold-400)
                        sm:mb-2
                        sm:text-xs
                        sm:tracking-[0.3em]
                    "
                >
                    Head Portal
                </p>

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
                    Add Student
                </h1>

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
                    Create a new student account with unique credentials.
                </p>

                <div
                    className="
                        mt-6
                        w-full
                        sm:mt-8
                    "
                >
                    <AddStudentForm />
                </div>
            </div>
        </main>
    );
}