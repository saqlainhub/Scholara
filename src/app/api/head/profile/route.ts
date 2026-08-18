import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {prisma} from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

// ==========================================================
// GET HEAD PROFILE
// ==========================================================

export async function GET() {
    try {
        const head = await prisma.user.findFirst({
            where: {
                role: "HEAD",
            },
            select: {
                id: true,
                username: true,
                name: true,
                profileImg: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            exists: Boolean(head),
            head,
        });
    } catch (error) {
        console.error(
            "GET HEAD PROFILE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to load head profile.",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================================
// CREATE FIRST HEAD
// ==========================================================

export async function POST(
    request: NextRequest
) {
    try {
        const existingHead =
            await prisma.user.findFirst({
                where: {
                    role: "HEAD",
                },
                select: {
                    id: true,
                },
            });

        if (existingHead) {
            return NextResponse.json(
                {
                    message:
                        "A head account already exists.",
                },
                {
                    status: 409,
                }
            );
        }

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

        if (!name) {
            return NextResponse.json(
                {
                    message:
                        "Name is required.",
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

        const existingUsername =
            await prisma.user.findUnique({
                where: {
                    username,
                },
                select: {
                    id: true,
                },
            });

        if (existingUsername) {
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

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        let profileImg:
            | string
            | null = null;

        let profileImgPublicId:
            | string
            | null = null;

        // ==================================================
        // CLOUDINARY
        // ==================================================

        if (
            profileImage instanceof File &&
            profileImage.size > 0
        ) {
            const bytes =
                await profileImage.arrayBuffer();

            const buffer =
                Buffer.from(bytes);

            const uploadResult =
                await new Promise<any>(
                    (
                        resolve,
                        reject
                    ) => {
                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "scolara/head",
                                    resource_type:
                                        "image",
                                },
                                (
                                    error,
                                    result
                                ) => {
                                    if (error) {
                                        reject(
                                            error
                                        );
                                    } else {
                                        resolve(
                                            result
                                        );
                                    }
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

        const head =
            await prisma.user.create({
                data: {
                    name,
                    username,
                    passwordHash,
                    role: "HEAD",
                    profileImg,
                    profileImgPublicId,
                },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return NextResponse.json(
            {
                message:
                    "Head profile created successfully.",
                head,
            },
            {
                status: 201,
            }
        );
    } catch (error: any) {
        console.error(
            "CREATE HEAD PROFILE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to create head profile.",
            },
            {
                status: 500,
            }
        );
    }
}

// ==========================================================
// UPDATE HEAD PROFILE
// ==========================================================

export async function PUT(
    request: NextRequest
) {
    try {
        const head =
            await prisma.user.findFirst({
                where: {
                    role: "HEAD",
                },
            });

        if (!head) {
            return NextResponse.json(
                {
                    message:
                        "No head profile exists yet.",
                },
                {
                    status: 404,
                }
            );
        }

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

        if (!name) {
            return NextResponse.json(
                {
                    message:
                        "Name is required.",
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

        const duplicateUsername =
            await prisma.user.findFirst({
                where: {
                    username,
                    id: {
                        not: head.id,
                    },
                },
                select: {
                    id: true,
                },
            });

        if (duplicateUsername) {
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

        const data: {
            name: string;
            username: string;
            passwordHash?: string;
            profileImg?: string | null;
            profileImgPublicId?: string | null;
        } = {
            name,
            username,
        };

        // ==================================================
        // PASSWORD
        // ==================================================

        if (password) {
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

            data.passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );
        }

        // ==================================================
        // PROFILE IMAGE
        // ==================================================

        if (
            profileImage instanceof File &&
            profileImage.size > 0
        ) {
            const bytes =
                await profileImage.arrayBuffer();

            const buffer =
                Buffer.from(bytes);

            const uploadResult =
                await new Promise<any>(
                    (
                        resolve,
                        reject
                    ) => {
                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "scolara/head",
                                    resource_type:
                                        "image",
                                },
                                (
                                    error,
                                    result
                                ) => {
                                    if (error) {
                                        reject(
                                            error
                                        );
                                    } else {
                                        resolve(
                                            result
                                        );
                                    }
                                }
                            );

                        stream.end(buffer);
                    }
                );

            // Delete old Cloudinary image
            if (
                head.profileImgPublicId
            ) {
                try {
                    await cloudinary.uploader.destroy(
                        head.profileImgPublicId
                    );
                } catch (
                    deleteError
                ) {
                    console.error(
                        "OLD HEAD IMAGE DELETE ERROR:",
                        deleteError
                    );
                }
            }

            data.profileImg =
                uploadResult.secure_url;

            data.profileImgPublicId =
                uploadResult.public_id;
        }

        const updatedHead =
            await prisma.user.update({
                where: {
                    id: head.id,
                },
                data,
                select: {
                    id: true,
                    username: true,
                    name: true,
                    profileImg: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

        return NextResponse.json({
            message:
                "Head profile updated successfully.",
            head: updatedHead,
        });
    } catch (error: any) {
        console.error(
            "UPDATE HEAD PROFILE ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    "Failed to update head profile.",
            },
            {
                status: 500,
            }
        );
    }
}