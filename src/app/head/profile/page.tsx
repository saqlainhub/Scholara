import HeadProfileForm from "@/app/components/head/profile/head-profile-form";

export default function HeadProfilePage() {
    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-2xl">
                <p
                    className="
                        mb-2
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.22em]
                        text-(--gold-400)
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
                    Profile
                </h1>

                <p
                    className="
                        mt-2
                        max-w-xl
                        text-sm
                        leading-6
                        opacity-70
                        sm:mt-3
                    "
                >
                    Manage head account and profile information
                </p>
            </div>

            <div className="mt-6 w-full sm:mt-8 lg:mt-10">
                <HeadProfileForm />
            </div>
        </main>
    );
}