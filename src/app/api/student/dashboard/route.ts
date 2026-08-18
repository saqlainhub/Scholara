import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getSession,
} from "@/lib/auth/session";

const DAY_ORDER = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
] as const;

type DayOfWeek =
    (typeof DAY_ORDER)[number];

export async function GET(
    request: NextRequest
) {
    try {
        /*
         * ============================================================
         * AUTHENTICATION
         * ============================================================
         *
         * STUDENT:
         *     Can see their own routine.
         *
         * HEAD:
         *     Can see a student's routine using ?viewAs=studentId.
         */
        const session =
            await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    message:
                        "Authentication required.",
                },
                {
                    status: 401,
                }
            );
        }

        /*
         * ============================================================
         * DETERMINE STUDENT
         * ============================================================
         */

        let studentId: string;

        if (
            session.role ===
            "STUDENT"
        ) {
            studentId =
                session.id;
        } else if (
            session.role ===
            "HEAD"
        ) {
            const viewAs =
                request.nextUrl.searchParams.get(
                    "viewAs"
                );

            if (!viewAs) {
                return NextResponse.json(
                    {
                        message:
                            "Student ID is required.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            studentId =
                viewAs;
        } else {
            return NextResponse.json(
                {
                    message:
                        "Forbidden.",
                },
                {
                    status: 403,
                }
            );
        }

        /*
         * ============================================================
         * LOAD STUDENT
         * ============================================================
         *
         * Only actual STUDENT accounts can be displayed.
         */
        const student =
            await prisma.user.findFirst({
                where: {
                    id: studentId,
                    role: "STUDENT",
                    isActive: true,
                },

                select: {
                    id: true,
                    name: true,
                    username: true,
                    profileImg: true,
                },
            });

        if (!student) {
            return NextResponse.json(
                {
                    message:
                        "Student account not found.",
                },
                {
                    status: 404,
                }
            );
        }

        /*
         * ============================================================
         * LOAD WEEKLY ROUTINE ASSIGNMENTS
         * ============================================================
         *
         * IMPORTANT:
         *
         * The EXISTENCE of the weekly assignment determines whether
         * the day is working or off.
         *
         * assignment exists
         *     -> WORKING DAY
         *
         * assignment does not exist
         *     -> OFF DAY
         *
         * assignment exists + routineTemplate is null
         *     -> WORKING DAY WITH NO ROUTINE
         *
         * assignment exists + routineTemplate exists
         *     -> WORKING DAY WITH ROUTINE
         *
         * We DO NOT use getStudentDayStatus() here.
         */
        const assignments =
            await prisma.studentWeeklyTemplateAssignment.findMany(
                {
                    where: {
                        studentId:
                            student.id,
                    },

                    include: {
                        routineTemplate: {
                            select: {
                                id: true,
                                name: true,

                                items: {
                                    orderBy: {
                                        sortOrder:
                                            "asc",
                                    },

                                    select: {
                                        id: true,
                                        title: true,
                                        description:
                                            true,
                                        startTime:
                                            true,
                                        endTime:
                                            true,
                                        durationMin:
                                            true,
                                        sortOrder:
                                            true,
                                    },
                                },
                            },
                        },
                    },
                }
            );

        /*
         * ============================================================
         * BUILD ALL SEVEN DAYS
         * ============================================================
         */

        const weeklyRoutine =
            DAY_ORDER.map(
                (day) => {
                    const assignment =
                        assignments.find(
                            (
                                item
                            ) =>
                                item.dayOfWeek ===
                                day
                        );

                    /*
                     * =================================================
                     * OFF DAY
                     * =================================================
                     *
                     * No assignment means this weekday is not assigned
                     * to the student.
                     */
                    if (!assignment) {
                        return {
                            dayOfWeek:
                                day,

                            assignmentId:
                                null,

                            routineTemplate:
                                null,

                            isWorking:
                                false,

                            dayType:
                                "OFF" as const,
                        };
                    }

                    /*
                     * =================================================
                     * WORKING DAY
                     * =================================================
                     *
                     * Assignment exists.
                     *
                     * Even if routineTemplate is null, this is STILL
                     * a working day.
                     */
                    return {
                        dayOfWeek:
                            day,

                        assignmentId:
                            assignment.id,

                        routineTemplate:
                            assignment.routineTemplate ??
                            null,

                        isWorking:
                            true,

                        dayType:
                            "WORKING" as const,
                    };
                }
            );

        /*
         * ============================================================
         * RESPONSE
         * ============================================================
         */

        return NextResponse.json({
            student,

            weeklyRoutine,
        });
    } catch (error) {
        console.error(
            "GET STUDENT ROUTINE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load student routine.",
            },
            {
                status: 500,
            }
        );
    }
}