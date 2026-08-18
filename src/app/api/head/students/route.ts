import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import {prisma} from "@/lib/prisma";

import cloudinary from "@/lib/cloudinary";

import { Role } from "@/generated/prisma/client";


// ==========================================================
// GET STUDENTS
// ==========================================================

export async function GET() {
    try {
        const students =
            await prisma.user.findMany({
                where: {
                    role: Role.STUDENT,
                },

                orderBy: {
                    createdAt: "desc",
                },

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    profileImgPublicId: true,
                    createdAt: true,

                    assignedTasks: {
                        select: {
                            score: true,
                        },
                    },
                },
            });

        const formattedStudents =
            students.map((student) => {
                const totalScore =
                    student.assignedTasks.reduce(
                        (total, task) =>
                            total +
                            Number(
                                task.score || 0
                            ),
                        0
                    );

                return {
                    id: student.id,
                    name: student.name,
                    profileImage:
                        student.profileImg,
                    profileImagePublicId:
                        student.profileImgPublicId,
                    totalScore,
                    createdAt:
                        student.createdAt.toISOString(),

                    user: {
                        username:
                            student.username,
                    },
                };
            });

        return NextResponse.json(
            formattedStudents
        );
    } catch (error) {
        console.error(
            "GET STUDENTS ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load students.",
            },
            {
                status: 500,
            }
        );
    }
}


// ==========================================================
// CREATE STUDENT
// ==========================================================

export async function POST(
    request: NextRequest
) {
    let uploadedPublicId:
        | string
        | null = null;

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
            formData.get("profileImage");


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!name) {
            return NextResponse.json(
                {
                    message:
                        "Student name is required.",
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


        // ==================================================
        // USERNAME CHECK
        // ==================================================

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
                        "This username is already in use.",
                },
                {
                    status: 409,
                }
            );
        }


        // ==================================================
        // PASSWORD HASH
        // ==================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        // ==================================================
        // CLOUDINARY UPLOAD
        // ==================================================

        let profileImg:
            | string
            | null = null;

        let profileImgPublicId:
            | string
            | null = null;


        if (
            profileImage &&
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
                        const uploadStream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "scholara/students",

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

                                    resolve(
                                        {
                                            secure_url:
                                                result.secure_url,

                                            public_id:
                                                result.public_id,
                                        }
                                    );
                                }
                            );

                        uploadStream.end(
                            buffer
                        );
                    }
                );


            profileImg =
                uploadResult.secure_url;

            profileImgPublicId =
                uploadResult.public_id;

            uploadedPublicId =
                uploadResult.public_id;
        }


        // ==================================================
        // CREATE USER
        // ==================================================

        const student =
            await prisma.user.create({
                data: {
                    username,
                    passwordHash,
                    role: Role.STUDENT,
                    name,
                    profileImg,
                    profileImgPublicId,
                },

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    profileImgPublicId: true,
                    createdAt: true,
                    role: true,
                },
            });


        // ==================================================
        // CREATE AWARD STATS
        // ==================================================

        await prisma.studentAwardStats.create({
            data: {
                studentId:
                    student.id,
            },
        });


        // ==================================================
        // RESPONSE
        // ==================================================

        return NextResponse.json(
            {
                message:
                    "Student created successfully.",

                student,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "CREATE STUDENT ERROR:",
            error
        );


        // ==================================================
        // CLEAN CLOUDINARY IMAGE IF DATABASE CREATION
        // FAILS
        // ==================================================

        if (uploadedPublicId) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedPublicId
                );
            } catch (
                cloudinaryError
            ) {
                console.error(
                    "CLOUDINARY CLEANUP ERROR:",
                    cloudinaryError
                );
            }
        }


        // ==================================================
        // PRISMA UNIQUE ERROR
        // ==================================================

        if (
            typeof error ===
                "object" &&
            error !== null &&
            "code" in error &&
            error.code ===
                "P2002"
        ) {
            return NextResponse.json(
                {
                    message:
                        "This username is already in use.",
                },
                {
                    status: 409,
                }
            );
        }


        return NextResponse.json(
            {
                message:
                    "Something went wrong while creating the student.",
            },
            {
                status: 500,
            }
        );
    }
}