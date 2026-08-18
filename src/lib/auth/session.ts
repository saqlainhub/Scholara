import {
    jwtVerify,
    SignJWT,
} from "jose";

import {
    cookies,
    headers,
} from "next/headers";

import {
    AUTH_COOKIE_NAME,
    AuthRole,
} from "./constants";

import {
    HEAD_VIEW_AS_COOKIE,
    HEAD_VIEW_AS_TEACHER_COOKIE,
} from "./viewing";

const secretValue =
    process.env.AUTH_SECRET;

if (!secretValue) {
    throw new Error(
        "AUTH_SECRET is not configured."
    );
}

const secret =
    new TextEncoder().encode(
        secretValue
    );

export type SessionUser = {
    id: string;
    username: string;
    name: string;
    role: AuthRole;
};

type SessionPayload = {
    userId: string;
    username: string;
    name: string;
    role: AuthRole;
};

export async function createSession(
    user: SessionUser
) {
    const token =
        await new SignJWT({
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
        } satisfies SessionPayload)
            .setProtectedHeader({
                alg: "HS256",
            })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);

    const cookieStore =
        await cookies();

    cookieStore.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure:
            process.env.NODE_ENV ===
            "production",
        sameSite: "strict",
        path: "/",
    });
}

export async function getSession(): Promise<
    SessionUser | null
> {
    try {
        const cookieStore =
            await cookies();

        const token =
            cookieStore.get(
                AUTH_COOKIE_NAME
            )?.value;

        if (!token) {
            return null;
        }

        const { payload } =
            await jwtVerify(
                token,
                secret
            );

        if (
            typeof payload.userId !==
                "string" ||
            typeof payload.username !==
                "string" ||
            typeof payload.name !==
                "string" ||
            ![
                "HEAD",
                "TEACHER",
                "STUDENT",
            ].includes(
                String(payload.role)
            )
        ) {
            return null;
        }

        const realSession: SessionUser = {
            id: payload.userId,
            username:
                payload.username,
            name: payload.name,
            role:
                payload.role as AuthRole,
        };

/*
 * ========================================================
 * HEAD VIEWING ANOTHER PORTAL
 * ========================================================
 *
 * The real JWT remains HEAD.
 *
 * The proxy creates an internal header based on the
 * appropriate viewing cookie.
 *
 * getSession() converts that request context into the
 * portal-specific session.
 */

if (
    realSession.role === "HEAD"
) {
    const requestHeaders =
        await headers();

    /*
     * ========================================================
     * HEAD VIEWING STUDENT
     * ========================================================
     */

    const viewingStudentId =
        requestHeaders.get(
            "x-scolara-view-as"
        );

    if (viewingStudentId) {
        return {
            id:
                viewingStudentId,

            username: "",

            name: "",

            role: "STUDENT",
        };
    }

    /*
     * ========================================================
     * HEAD VIEWING TEACHER
     * ========================================================
     */

    const viewingTeacherId =
        requestHeaders.get(
            "x-scolara-view-as-teacher"
        );

    if (viewingTeacherId) {
        return {
            id:
                viewingTeacherId,

            username: "",

            name: "",

            role: "TEACHER",
        };
    }
}

return realSession;

    } catch {
        return null;
    }
}

export async function destroySession() {
    const cookieStore =
        await cookies();

    cookieStore.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        httpOnly: true,
        secure:
            process.env.NODE_ENV ===
            "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(0),
    });
}