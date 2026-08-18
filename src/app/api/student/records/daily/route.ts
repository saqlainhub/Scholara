import {
    NextResponse,
} from "next/server";

import {
    getSession,
} from "@/lib/auth/session";

import {
    getYesterdayKey,
} from "@/lib/student-records/dates";

import {
    calculateRecordStats,
    calculateDayRecords,
} from "@/lib/student-records/calculations";

export async function GET() {
    try {
        const session =
            await getSession();

        if (
            !session ||
            session.role !==
                "STUDENT"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        const date =
            getYesterdayKey();

        const stats =
            await calculateRecordStats(
                session.id,
                date,
                date
            );

        const days =
            await calculateDayRecords(
                session.id,
                date,
                date
            );

        return NextResponse.json({
            date,
            stats,
            day:
                days[0] ?? null,
        });
    } catch (error) {
        console.error(
            "DAILY RECORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to load daily record.",
            },
            {
                status: 500,
            }
        );
    }
}