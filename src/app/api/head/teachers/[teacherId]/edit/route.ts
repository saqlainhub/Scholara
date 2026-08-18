import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import cloudinary from "@/lib/cloudinary";

import { Role } from "@/generated/prisma/client";

type Params = {
    params: Promise<{
        teacherId: string;
    }>;
};

export async function PUT(
    request: NextRequest,
    { params }: Params
) {
    let uploadedPublicId: string | null =
        null;

    try {
        const { teacherId } =
            await params;

        // ======================================================
        // VALIDATE TEACHER ID
        // ======================================================

        if (!teacherId) {
            return NextResponse.json(
                {
                    message:
                        "Teacher ID is missing.",
                },
                {
                    status: 400,
                }
            );
        }

        // ======================================================
        // GET FORM DATA
        // ======================================================

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

        const confirmPassword =
            String(
                formData.get(
                    "confirmPassword"
                ) || ""
            );

        const profileImage =
            formData.get("profileImage");

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

        // ======================================================
        // PASSWORD VALIDATION
        // ======================================================

        const changingPassword =
            Boolean(
                password ||
                    confirmPassword
            );

        if (changingPassword) {
            if (!password) {
                return NextResponse.json(
                    {
                        message:
                            "New password is required.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (!confirmPassword) {
                return NextResponse.json(
                    {
                        message:
                            "Please confirm the new password.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                password !==
                confirmPassword
            ) {
                return NextResponse.json(
                    {
                        message:
                            "Passwords do not match.",
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        // ======================================================
        // FIND TEACHER
        // ======================================================

        const teacher =
            await prisma.user.findFirst({
                where: {
                    id: teacherId,
                    role: Role.TEACHER,
                },

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    profileImgPublicId: true,
                },
            });

        if (!teacher) {
            return NextResponse.json(
                {
                    message:
                        "Teacher not found.",
                },
                {
                    status: 404,
                }
            );
        }

        // ======================================================
        // USERNAME CHECK
        // ======================================================

        if (
            username !==
            teacher.username
        ) {
            const existingUser =
                await prisma.user.findFirst({
                    where: {
                        username,

                        NOT: {
                            id: teacherId,
                        },
                    },

                    select: {
                        id: true,
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
        }

        // ======================================================
        // CLOUDINARY IMAGE
        // ======================================================

        let newProfileImg:
            | string
            | null =
            teacher.profileImg;

        let newProfileImgPublicId:
            | string
            | null =
            teacher.profileImgPublicId;

        let newImageUploaded =
            false;

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
                                        "scholara/teachers",

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

                        uploadStream.end(
                            buffer
                        );
                    }
                );

            newProfileImg =
                uploadResult.secure_url;

            newProfileImgPublicId =
                uploadResult.public_id;

            uploadedPublicId =
                uploadResult.public_id;

            newImageUploaded =
                true;
        }

        // ======================================================
        // PASSWORD HASH
        // ======================================================

        let passwordHash:
            | string
            | undefined;

        if (changingPassword) {
            passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );
        }

        // ======================================================
        // UPDATE DATA
        // ======================================================

        const updateData: {
            name: string;
            username: string;
            profileImg: string | null;
            profileImgPublicId:
                | string
                | null;
            passwordHash?: string;
        } = {
            name,
            username,
            profileImg:
                newProfileImg,
            profileImgPublicId:
                newProfileImgPublicId,
        };

        if (passwordHash) {
            updateData.passwordHash =
                passwordHash;
        }

        // ======================================================
        // UPDATE TEACHER
        // ======================================================

        const updatedTeacher =
            await prisma.user.update({
                where: {
                    id: teacherId,
                },

                data: updateData,

                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    profileImgPublicId: true,
                    updatedAt: true,
                },
            });

        // ======================================================
        // DELETE OLD CLOUDINARY IMAGE
        // ======================================================

        if (
            newImageUploaded &&
            teacher.profileImgPublicId &&
            teacher.profileImgPublicId !==
                newProfileImgPublicId
        ) {
            try {
                await cloudinary.uploader.destroy(
                    teacher.profileImgPublicId
                );
            } catch (
                cloudinaryError
            ) {
                console.error(
                    "OLD CLOUDINARY IMAGE DELETE ERROR:",
                    cloudinaryError
                );
            }
        }

        // ======================================================
        // RESPONSE
        // ======================================================

        return NextResponse.json({
            message:
                "Teacher updated successfully.",

            teacher:
                updatedTeacher,
        });
    } catch (error) {
        console.error(
            "UPDATE TEACHER ERROR:",
            error
        );

        // ======================================================
        // CLEAN NEW CLOUDINARY IMAGE
        // ======================================================

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

        // ======================================================
        // PRISMA UNIQUE ERROR
        // ======================================================

        if (
            typeof error ===
                "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
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
                    "Something went wrong while updating the teacher.",
            },
            {
                status: 500,
            }
        );
    }
}