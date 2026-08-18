import {
    redirect,
} from "next/navigation";

import {
    getSession,
    SessionUser,
} from "./session";

export {
    createSession,
    destroySession,
    getSession,
} from "./session";

export {
    verifyPassword,
    hashPassword,
} from "./password";

export {
    AUTH_COOKIE_NAME,
    AUTH_ROLES,
    PORTAL_PATHS,
} from "./constants";

export type {
    AuthRole,
} from "./constants";

export type {
    SessionUser,
} from "./session";

export {
    HEAD_VIEW_AS_COOKIE,
} from "./viewing";

export async function requireAuth(): Promise<
    SessionUser
> {
    const session =
        await getSession();

    if (!session) {
        redirect("/login");
    }

    return session;
}

export async function requireRole(
    ...allowedRoles: SessionUser["role"][]
): Promise<SessionUser> {
    const session =
        await requireAuth();

    if (
        !allowedRoles.includes(
            session.role
        )
    ) {
        redirect(
            getPortalForRole(
                session.role
            )
        );
    }

    return session;
}

export function canAccessPortal(
    role: SessionUser["role"],
    portal:
        | "HEAD"
        | "TEACHER"
        | "STUDENT"
) {
    if (role === "HEAD") {
        return true;
    }

    return role === portal;
}

export function getPortalForRole(
    role: SessionUser["role"]
) {
    switch (role) {
        case "HEAD":
            return "/head";

        case "TEACHER":
            return "/teacher";

        case "STUDENT":
            return "/student";

        default:
            return "/login";
    }
}