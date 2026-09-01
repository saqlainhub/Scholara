import {
    NextRequest,
    NextResponse,
} from "next/server";

import { getSession } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

type UploadedMedia = {
    url: string;
    publicId: string;
    resourceType: string;
    format: string | null;
    bytes: number;
    fileName: string;
};

function isPdf(file: File) {
    return (
        file.type === "application/pdf" ||
        file.name
            .toLowerCase()
            .endsWith(".pdf")
    );
}

async function uploadToCloudinary(
    file: File
): Promise<UploadedMedia> {
    const buffer = Buffer.from(
        await file.arrayBuffer()
    );

    const pdf = isPdf(file);

    return new Promise<UploadedMedia>(
        (resolve, reject) => {
            const stream =
                cloudinary.uploader.upload_stream(
                    {
                        resource_type: pdf
                            ? "raw"
                            : "auto",

                        folder:
                            "scolara/task-submissions",

                        use_filename: true,

                        unique_filename: true,

                        overwrite: false,
                    },
                    (
                        error,
                        result
                    ) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        if (!result) {
                            reject(
                                new Error(
                                    "Cloudinary upload failed."
                                )
                            );
                            return;
                        }

                        resolve({
                            url:
                                result.secure_url,

                            publicId:
                                result.public_id,

                            resourceType:
                                result.resource_type,

                            format:
                                result.format ||
                                (pdf
                                    ? "pdf"
                                    : null),

                            bytes:
                                result.bytes ||
                                file.size,

                            fileName:
                                file.name,
                        });
                    }
                );

            stream.end(buffer);
        }
    );
}

export async function POST(
    request: NextRequest
) {
    try {
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

        if (
            session.role !==
            "STUDENT"
        ) {
            return NextResponse.json(
                {
                    message:
                        "Student access required.",
                },
                {
                    status: 403,
                }
            );
        }

        const formData =
            await request.formData();

        const fileValue =
            formData.get("file");

        if (
            !(
                fileValue instanceof
                File
            )
        ) {
            return NextResponse.json(
                {
                    message:
                        "No file was provided.",
                },
                {
                    status: 400,
                }
            );
        }

        if (fileValue.size <= 0) {
            return NextResponse.json(
                {
                    message:
                        "The selected file is empty.",
                },
                {
                    status: 400,
                }
            );
        }

        if (fileValue.type.startsWith("audio/")) {
            return NextResponse.json(
                {
                    message:
                        "Audio files must be uploaded through the voice-notes endpoint.",
                },
                {
                    status: 400,
                }
            );
        }

        const uploaded =
            await uploadToCloudinary(
                fileValue
            );

        return NextResponse.json({
            success: true,

            media: {
                url: uploaded.url,

                publicId:
                    uploaded.publicId,

                resourceType:
                    uploaded.resourceType,

                format:
                    uploaded.format,

                bytes:
                    uploaded.bytes,

                fileName:
                    uploaded.fileName,
            },
        });
    } catch (error) {
        console.error(
            "STUDENT MEDIA UPLOAD ERROR:",
            error
        );

        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to upload media.",
            },
            {
                status: 500,
            }
        );
    }
}