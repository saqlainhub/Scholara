import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    jwtVerify,
} from "jose";

import {
    AUTH_COOKIE_NAME,
} from "@/lib/auth/constants";

import {
    HEAD_VIEW_AS_COOKIE,
    HEAD_VIEW_AS_TEACHER_COOKIE,
} from "@/lib/auth/viewing";

import { prisma } from "@/lib/prisma";

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

export async function GET(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            teacherId: string;
        }>;
    }
) {
    try {
        /*
         * ========================================================
         * VERIFY REAL AUTHENTICATED USER
         * ========================================================
         *
         * We intentionally verify the JWT directly here.
         *
         * Do NOT use getSession() here because getSession()
         * can return a transformed TEACHER session when HEAD
         * is already viewing a teacher.
         */

        const token =
            request.cookies.get(
                AUTH_COOKIE_NAME
            )?.value;

        if (!token) {
            return NextResponse.redirect(
                new URL(
                    "/login",
                    request.url
                )
            );
        }

        let payload;

        try {
            const result =
                await jwtVerify(
                    token,
                    secret
                );

            payload = result.payload;
        } catch (error) {
            console.error(
                "TEACHER VIEW JWT ERROR:",
                error
            );

            return NextResponse.redirect(
                new URL(
                    "/login",
                    request.url
                )
            );
        }

        /*
         * Only the real HEAD user can start
         * teacher viewing mode.
         */

        if (
            payload.role !== "HEAD"
        ) {
            return NextResponse.redirect(
                new URL(
                    "/teacher",
                    request.url
                )
            );
        }

        /*
         * ========================================================
         * GET TEACHER ID
         * ========================================================
         */

        const {
            teacherId,
        } = await params;

        if (!teacherId) {
            return NextResponse.redirect(
                new URL(
                    "/head/teachers",
                    request.url
                )
            );
        }

        /*
         * ========================================================
         * VALIDATE TEACHER
         * ========================================================
         */

        const teacher =
            await prisma.user.findFirst({
                where: {
                    id: teacherId,
                    role: "TEACHER",
                },
                select: {
                    id: true,
                },
            });

        if (!teacher) {
            return NextResponse.redirect(
                new URL(
                    "/head/teachers",
                    request.url
                )
            );
        }

        /*
         * ========================================================
         * CREATE RESPONSE
         * ========================================================
         *
         * The JWT remains HEAD.
         *
         * We only store the teacher ID in a separate cookie.
         */

        const response =
            NextResponse.redirect(
                new URL(
                    "/teacher",
                    request.url
                )
            );

        /*
         * ========================================================
         * SET TEACHER VIEW COOKIE
         * ========================================================
         */

        response.cookies.set({
            name:
                HEAD_VIEW_AS_TEACHER_COOKIE,

            value:
                teacher.id,

            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "strict",

            path: "/",
        });

        /*
         * ========================================================
         * CLEAR STUDENT VIEW COOKIE
         * ========================================================
         *
         * Only one portal-view context should be active.
         */

        response.cookies.set({
            name:
                HEAD_VIEW_AS_COOKIE,

            value: "",

            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite: "strict",

            path: "/",

            expires: new Date(0),
        });

        return response;
    } catch (error) {
        console.error(
            "START HEAD TEACHER VIEW ERROR:",
            error
        );

        return NextResponse.redirect(
            new URL(
                "/head/teachers",
                request.url
            )
        );
    }
}