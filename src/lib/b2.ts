import "server-only";

import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ==========================================================
// ENVIRONMENT VARIABLES
// ==========================================================

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APPLICATION_KEY =
    process.env.B2_APPLICATION_KEY;
const B2_BUCKET_NAME =
    process.env.B2_BUCKET_NAME;
const B2_ENDPOINT =
    process.env.B2_ENDPOINT;
const B2_REGION =
    process.env.B2_REGION;

// ==========================================================
// VALIDATE ENVIRONMENT
// ==========================================================

if (
    !B2_KEY_ID ||
    !B2_APPLICATION_KEY ||
    !B2_BUCKET_NAME ||
    !B2_ENDPOINT ||
    !B2_REGION
) {
    throw new Error(
        "Missing Backblaze B2 environment variables"
    );
}

// ==========================================================
// NORMALIZE ENDPOINT
// ==========================================================
//
// Backblaze endpoint should normally be:
//
// https://s3.us-east-005.backblazeb2.com
//
// This also makes the code tolerant if .env contains:
//
// s3.us-east-005.backblazeb2.com
//
// ==========================================================

const normalizedEndpoint =
    B2_ENDPOINT.startsWith("http://") ||
    B2_ENDPOINT.startsWith("https://")
        ? B2_ENDPOINT
        : `https://${B2_ENDPOINT}`;

// ==========================================================
// B2 S3 CLIENT
// ==========================================================

const b2 = new S3Client({
    endpoint: normalizedEndpoint,

    region: B2_REGION,

    credentials: {
        accessKeyId: B2_KEY_ID,
        secretAccessKey:
            B2_APPLICATION_KEY,
    },
});

// ==========================================================
// UPLOAD VOICE NOTE
// ==========================================================

export async function uploadVoiceNoteToB2({
    key,
    body,
    contentType,
    contentLength,
}: {
    key: string;
    body: Buffer;
    contentType: string;
    contentLength?: number;
}) {
    console.log(
        "===== B2 UPLOAD START ====="
    );

    console.log({
        bucket: B2_BUCKET_NAME,
        endpoint: normalizedEndpoint,
        region: B2_REGION,
        key,
        contentType,
        contentLength,
        bodySize: body.length,
    });

    try {
        await b2.send(
            new PutObjectCommand({
                Bucket:
                    B2_BUCKET_NAME,

                Key: key,

                Body: body,

                ContentType:
                    contentType,

                ...(contentLength !==
                undefined
                    ? {
                          ContentLength:
                              contentLength,
                      }
                    : {}),
            })
        );

        console.log(
            "===== B2 UPLOAD SUCCESS ====="
        );

        return {
            key,
            bucket:
                B2_BUCKET_NAME,
        };
    } catch (error) {
        console.error(
            "===== B2 UPLOAD FAILED ====="
        );

        console.error(error);

        throw error;
    }
}

// ==========================================================
// DELETE VOICE NOTE
// ==========================================================

export async function deleteVoiceNoteFromB2(
    key: string
) {
    await b2.send(
        new DeleteObjectCommand({
            Bucket:
                B2_BUCKET_NAME,

            Key: key,
        })
    );
}

// ==========================================================
// GET VOICE NOTE OBJECT
// ==========================================================
//
// Useful if you later want to stream/proxy
// B2 files through your own API.
// ==========================================================

export async function getVoiceNoteFromB2(
    key: string
) {
    return b2.send(
        new GetObjectCommand({
            Bucket:
                B2_BUCKET_NAME,

            Key: key,
        })
    );
}

// ==========================================================
// GET SIGNED VOICE NOTE URL
// ==========================================================
//
// The bucket can remain private.
//
// The browser receives a temporary signed URL
// which allows it to play the audio directly
// from B2.
// ==========================================================

export async function getVoiceNoteSignedUrl(
    key: string
): Promise<string> {
    if (!key) {
        throw new Error(
            "Voice note storage key is required."
        );
    }

    const command =
        new GetObjectCommand({
            Bucket:
                B2_BUCKET_NAME,

            Key: key,
        });

    const signedUrl =
        await getSignedUrl(
            b2,
            command,
            {
                // 1 hour
                expiresIn:
                    60 * 60,
            }
        );

    return signedUrl;
}