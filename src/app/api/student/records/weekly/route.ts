import {
    NextResponse,
} from "next/server";

import {
    getSession,
} from "@/lib/auth/session";

import {
    getPreviousWeek,
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

        const {
            startDate,
            endDate,
        } =
            getPreviousWeek();

        const stats =
            await calculateRecordStats(
                session.id,
                startDate,
                endDate
            );

        const days =
            await calculateDayRecords(
                session.id,
                startDate,
                endDate
            );

        return NextResponse.json({
            startDate,
            endDate,
            stats,
            days,
        });
    } catch (error) {
        console.error(
            "WEEKLY RECORD ERROR:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Failed to load weekly record.",
            },
            {
                status: 500,
            }
        );
    }
}