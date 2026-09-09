const TIME_ZONE =
    "Asia/Karachi";

export function getPreviousDayKey(): string {
    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    TIME_ZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",
            }
        );

    const today =
        formatter.format(
            new Date()
        );

    const [
        year,
        month,
        day,
    ] =
        today
            .split("-")
            .map(Number);

    const pakistanDate =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    pakistanDate.setUTCDate(
        pakistanDate.getUTCDate() -
            1
    );

    return pakistanDate
        .toISOString()
        .slice(0, 10);
}


export function getDateBounds(
    date: string
) {
    return {
        start:
            new Date(
                `${date}T00:00:00.000Z`
            ),

        end:
            new Date(
                `${date}T23:59:59.999Z`
            ),
    };
}


export function formatReportDate(
    date: Date
) {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday:
                "long",

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric",

            timeZone:
                TIME_ZONE,
        }
    ).format(date);
}


export function formatSubmissionTime(
    date: Date | null
) {
    if (!date) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            hour:
                "numeric",

            minute:
                "2-digit",

            hour12:
                true,

            timeZone:
                TIME_ZONE,
        }
    ).format(date);
}