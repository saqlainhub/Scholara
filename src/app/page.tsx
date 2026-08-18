import {
    redirect,
} from "next/navigation";

import {
    getSession,
    getPortalForRole,
} from "@/lib/auth";

export default async function HomePage() {
    const session =
        await getSession();

    if (!session) {
        redirect("/login");
    }

    redirect(
        getPortalForRole(
            session.role
        )
    );
}