import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

import {
    calculateTeacherActivity,
} from "@/lib/utils/teacher-performance";

export async function GET() {
    try {
        // ======================================================
        // LOAD TEACHERS
        // ======================================================

        const teachers =
            await prisma.user.findMany({
                where: {
                    role: "TEACHER",
                },

                orderBy: {
                    createdAt: "desc",
                },

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    isActive: true,
                    createdAt: true,
                },
            });

        // ======================================================
        // LOAD REAL TASK STATISTICS
        // ======================================================
        //
        // IMPORTANT:
        //
        // We intentionally DO NOT use:
        //
        // teacher.totalTasks
        // teacher.checkedTasks
        //
        // from the User table.
        //
        // The teacher portal considers a task part of the
        // assignment/checking system only when that task has
        // at least one student submission.
        //
        // Therefore we use the exact same baseWhere logic as:
        //
        // /api/teachers/assignments
        //
        // ======================================================

        const teachersWithStats =
            await Promise.all(
                teachers.map(
                    async (teacher) => {
                        const baseWhere = {
                            teacherId:
                                teacher.id,

                            submissions: {
                                some: {},
                            },
                        };

                        // ==========================================
                        // REAL TASK COUNTS
                        // ==========================================

                        const [
                            totalTasks,
                            checkedTasks,
                            uncheckedTasks,
                            activity,
                        ] =
                            await Promise.all([
                                prisma.task.count({
                                    where: baseWhere,
                                }),

                                prisma.task.count({
                                    where: {
                                        ...baseWhere,

                                        isChecked:
                                            true,
                                    },
                                }),

                                prisma.task.count({
                                    where: {
                                        ...baseWhere,

                                        isChecked:
                                            false,
                                    },
                                }),

                                calculateTeacherActivity(
                                    prisma,
                                    teacher.id
                                ),
                            ]);

                        // ==========================================
                        // CHECKED PERCENTAGE
                        // ==========================================
                        //
                        // This is calculated from the same real
                        // task data rather than User fields.
                        //
                        // ==========================================

                        const checkedPercentage =
                            totalTasks > 0
                                ? Number(
                                      (
                                          (checkedTasks /
                                              totalTasks) *
                                          100
                                      ).toFixed(1)
                                  )
                                : 0;

                        // ==========================================
                        // PERFORMANCE
                        // ==========================================
                        //
                        // Prefer the performance calculation from
                        // calculateTeacherActivity().
                        //
                        // The fallback keeps the response safe if
                        // the utility ever returns an incomplete
                        // value.
                        //
                        // ==========================================

                        const performance =
                            activity?.performance ===
                                "DILIGENT" ||
                            activity?.performance ===
                                "LAZY"
                                ? activity.performance
                                : checkedPercentage >=
                                    90
                                  ? "DILIGENT"
                                  : "LAZY";

                        return {
                            id: teacher.id,
                            username:
                                teacher.username,
                            name: teacher.name,
                            profileImg:
                                teacher.profileImg,

                            isActive:
                                teacher.isActive,

                            // ==================================
                            // REAL TASK DATA
                            // ==================================

                            totalTasks,
                            checkedTasks,
                            uncheckedTasks,

                            checkedPercentage,

                            // ==================================
                            // RECENT ACTIVITY
                            // ==================================
                            //
                            // These values are useful for the
                            // performance display and keep the API
                            // compatible with the activity utility.
                            //
                            // ==================================

                            recentTasks:
                                Number(
                                    activity?.totalRecentTasks ??
                                        0
                                ),

                            recentCheckedTasks:
                                Number(
                                    activity?.checkedRecentTasks ??
                                        0
                                ),

                            recentUncheckedTasks:
                                Number(
                                    activity?.uncheckedRecentTasks ??
                                        0
                                ),

                            recentCheckedPercentage:
                                Number(
                                    activity?.checkedPercentage ??
                                        0
                                ),

                            performance,

                            createdAt:
                                teacher.createdAt,
                        };
                    }
                )
            );

        return NextResponse.json(
            teachersWithStats
        );
    } catch (error) {
        console.error(
            "GET TEACHERS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load teachers.",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================================
// CREATE TEACHER
// ==========================================================

export async function POST(
    request: Request
) {
    try {
        const formData =
            await request.formData();

        const name =
            String(
                formData.get("name") || ""
            ).trim();

        const username =
            String(
                formData.get("username") || ""
            ).trim();

        const password =
            String(
                formData.get("password") || ""
            );

        const profileImage =
            formData.get(
                "profileImage"
            );

        // ======================================================
        // VALIDATION
        // ======================================================

        if (!name) {
            return NextResponse.json(
                {
                    message:
                        "Teacher name is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!username) {
            return NextResponse.json(
                {
                    message:
                        "Username is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!password) {
            return NextResponse.json(
                {
                    message:
                        "Password is required.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // CHECK USERNAME
        // ======================================================

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    username,
                },
            });

        if (existingUser) {
            return NextResponse.json(
                {
                    message:
                        "Username already exists.",
                },
                {
                    status: 409,
                }
            );
        }

        // ======================================================
        // PROFILE IMAGE
        // ======================================================

        let profileImg:
            | string
            | null = null;

        let profileImgPublicId:
            | string
            | null = null;

        if (
            profileImage instanceof File &&
            profileImage.size > 0
        ) {
            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
            ];

            if (
                !allowedTypes.includes(
                    profileImage.type
                )
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Only JPG, PNG, WEBP or GIF images are allowed.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                profileImage.size >
                2 * 1024 * 1024
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Profile image must be 2 MB or smaller.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const bytes =
                await profileImage.arrayBuffer();

            const buffer =
                Buffer.from(bytes);

            const uploadResult =
                await new Promise<{
                    secure_url: string;
                    public_id: string;
                }>(
                    (
                        resolve,
                        reject
                    ) => {
                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "scolara/teachers",
                                    resource_type:
                                        "image",
                                },
                                (
                                    error,
                                    result
                                ) => {
                                    if (
                                        error ||
                                        !result
                                    ) {
                                        reject(
                                            error ||
                                                new Error(
                                                    "Cloudinary upload failed."
                                                )
                                        );

                                        return;
                                    }

                                    resolve({
                                        secure_url:
                                            result.secure_url,
                                        public_id:
                                            result.public_id,
                                    });
                                }
                            );

                        stream.end(buffer);
                    }
                );

            profileImg =
                uploadResult.secure_url;

            profileImgPublicId =
                uploadResult.public_id;
        }

        // ======================================================
        // HASH PASSWORD
        // ======================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        // ======================================================
        // CREATE TEACHER
        // ======================================================

        const teacher =
            await prisma.user.create({
                data: {
                    username,
                    passwordHash,
                    role: "TEACHER",
                    name,
                    profileImg,
                    profileImgPublicId,

                    // These fields can remain for backward
                    // compatibility, but they are NOT used for
                    // teacher statistics anymore.
                    totalTasks: 0,
                    checkedTasks: 0,
                },

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    isActive: true,
                    createdAt: true,
                },
            });

        return NextResponse.json(
            teacher,
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "CREATE TEACHER ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Something went wrong while creating the teacher.",
            },
            {
                status: 500,
            }
        );
    }
}