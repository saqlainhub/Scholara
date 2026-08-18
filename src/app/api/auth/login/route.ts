import {
    NextRequest,
    NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import {
    createSession,
} from "@/lib/auth";

type LoginRole =
    | "HEAD"
    | "TEACHER"
    | "STUDENT";

export async function POST(
    request: NextRequest
) {
    try {
        const body =
            await request.json();

        const username =
            typeof body?.username ===
            "string"
                ? body.username.trim()
                : "";

        const password =
            typeof body?.password ===
            "string"
                ? body.password
                : "";

        const role =
            typeof body?.role ===
            "string"
                ? body.role
                      .trim()
                      .toUpperCase()
                : "";

        if (
            !username ||
            !password ||
            !role
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Username, password and role are required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            ![
                "HEAD",
                "TEACHER",
                "STUDENT",
            ].includes(role)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid role.",
                },
                {
                    status: 400,
                }
            );
        }

        const user =
            await prisma.user.findFirst({
                where: {
                    username,
                    role:
                        role as LoginRole,
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    role: true,
                    passwordHash: true,
                    isActive: true,
                },
            });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid username, password or role.",
                },
                {
                    status: 401,
                }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This account is inactive. Please contact the head.",
                },
                {
                    status: 403,
                }
            );
        }

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.passwordHash
            );

        if (!passwordMatches) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Invalid username, password or role.",
                },
                {
                    status: 401,
                }
            );
        }

        /*
         * CREATE AUTHENTICATED SESSION
         */
        await createSession({
            id: user.id,
            username:
                user.username,
            name: user.name,
            role:
                user.role as LoginRole,
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username:
                    user.username,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(
            "LOGIN API ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Login failed.",
            },
            {
                status: 500,
            }
        );
    }
}