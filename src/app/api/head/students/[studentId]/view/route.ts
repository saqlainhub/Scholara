import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getSession,
    HEAD_VIEW_AS_COOKIE,
} from "@/lib/auth";

import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    {
        params,
    }: {
        params: Promise<{
            studentId: string;
        }>;
    }
) {
    try {
        const session =
            await getSession();

        if (!session) {
            return NextResponse.redirect(
                new URL(
                    "/login",
                    request.url
                )
            );
        }

        if (session.role !== "HEAD") {
            return NextResponse.redirect(
                new URL(
                    "/student",
                    request.url
                )
            );
        }

        const {
            studentId,
        } = await params;

        const student =
            await prisma.user.findFirst({
                where: {
                    id: studentId,
                    role: "STUDENT",
                },
                select: {
                    id: true,
                },
            });

        if (!student) {
            return NextResponse.redirect(
                new URL(
                    "/head/students",
                    request.url
                )
            );
        }

        const response =
            NextResponse.redirect(
                new URL(
                    "/student",
                    request.url
                )
            );

        response.cookies.set({
            name:
                HEAD_VIEW_AS_COOKIE,
            value: student.id,
            httpOnly: true,
            secure:
                process.env.NODE_ENV ===
                "production",
            sameSite: "strict",
            path: "/",
        });

        return response;
    } catch (error) {
        console.error(
            "START HEAD STUDENT VIEW ERROR:",
            error
        );

        return NextResponse.redirect(
            new URL(
                "/head/students",
                request.url
            )
        );
    }
}