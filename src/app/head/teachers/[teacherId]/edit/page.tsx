import EditTeacherForm from "@/app/components/head/teachers/edit-teacher-form";

import BackToTeacherButton from "@/app/components/head/teachers/back-to-teacher-button";

export default async function Page({
    params,
}: {
    params: Promise<{
        teacherId: string;
    }>;
}) {
    const { teacherId } = await params;

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
            {/* ==================================================
                BACK
            ================================================== */}

            <BackToTeacherButton
                teacherId={teacherId}
            />

            {/* ==================================================
                HEADER
            ================================================== */}

            <div
                className="
                    mb-6
                    mt-5
                    sm:mb-8
                    sm:mt-6
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
                    Edit Teacher
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
                    Update the teacher profile and account credentials
                </p>
            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <div className="w-full">
                <EditTeacherForm
                    teacherId={teacherId}
                />
            </div>
        </main>
    );
}