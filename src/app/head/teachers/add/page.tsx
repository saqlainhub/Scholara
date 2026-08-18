import AddTeacherForm from "@/app/components/head/teachers/add-teacher-form";

export default function AddTeacherPage() {
    return (
        <main className="p-4 sm:p-6 lg:p-8">

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
                Add Teacher
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
                Create a teacher account that can
                manage and check student tasks.
            </p>

            <div className="mt-8 sm:mt-10">
                <AddTeacherForm />
            </div>
        </main>
    );
}