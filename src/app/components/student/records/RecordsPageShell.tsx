import type {
    ReactNode,
} from "react";

import RecordsHeader from "./RecordsHeader";

type Props = {
    active:
        | "overview"
        | "daily"
        | "weekly"
        | "monthly";

    children: ReactNode;
};

export default function RecordsPageShell({
    active,
    children,
}: Props) {
    return (
        <main
            className="
                min-h-full
                w-full
                px-3
                py-4
                min-[400px]:px-4
                min-[400px]:py-5
                sm:px-6
                sm:py-6
                lg:px-8
                lg:py-7
            "
        >
            <div
                className="
                    mx-auto
                    w-full
                    max-w-[1800px]
                "
            >
                <RecordsHeader
                    active={active}
                />

                <div className="mt-5 sm:mt-6 lg:mt-7">
                    {children}
                </div>
            </div>
        </main>
    );
}