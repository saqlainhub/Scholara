const TIME_ZONE = "Asia/Karachi";

export function formatDateKey(
    date: Date
): string {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }
    ).format(date);
}

export function parseDateKey(
    dateKey: string
): Date {
    const [
        year,
        month,
        day,
    ] = dateKey
        .split("-")
        .map(Number);

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            12,
            0,
            0
        )
    );
}

export function addDays(
    dateKey: string,
    amount: number
): string {
    const date =
        parseDateKey(dateKey);

    date.setUTCDate(
        date.getUTCDate() + amount
    );

    return date
        .toISOString()
        .slice(0, 10);
}

export function getYesterdayKey(): string {
    const today =
        formatDateKey(new Date());

    return addDays(today, -1);
}

export function getDayOfWeek(
    dateKey: string
): number {
    return parseDateKey(
        dateKey
    ).getUTCDay();
}

/*
 * JS:
 *
 * Sunday = 0
 * Monday = 1
 * ...
 * Saturday = 6
 */
export function getMonday(
    dateKey: string
): string {
    const day =
        getDayOfWeek(dateKey);

    const difference =
        day === 0
            ? -6
            : 1 - day;

    return addDays(
        dateKey,
        difference
    );
}

export function getSunday(
    dateKey: string
): string {
    return addDays(
        getMonday(dateKey),
        6
    );
}

export function getPreviousWeek(): {
    startDate: string;
    endDate: string;
} {
    const yesterday =
        getYesterdayKey();

    const currentMonday =
        getMonday(yesterday);

    return {
        startDate: addDays(
            currentMonday,
            -7
        ),
        endDate: addDays(
            currentMonday,
            -1
        ),
    };
}

export function getFirstDayOfMonth(
    year: number,
    month: number
): string {
    return `${year}-${String(
        month
    ).padStart(2, "0")}-01`;
}

export function getLastDayOfMonth(
    year: number,
    month: number
): string {
    const date =
        new Date(
            Date.UTC(
                year,
                month,
                0
            )
        );

    return date
        .toISOString()
        .slice(0, 10);
}

export function getPreviousMonth(): {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
} {
    const yesterday =
        parseDateKey(
            getYesterdayKey()
        );

    const year =
        yesterday.getUTCFullYear();

    const month =
        yesterday.getUTCMonth();

    const previousMonth =
        month === 0
            ? 12
            : month;

    const previousYear =
        month === 0
            ? year - 1
            : year;

    return {
        year: previousYear,
        month: previousMonth,
        startDate:
            getFirstDayOfMonth(
                previousYear,
                previousMonth
            ),
        endDate:
            getLastDayOfMonth(
                previousYear,
                previousMonth
            ),
    };
}

export function getDaysBetween(
    startDate: string,
    endDate: string
): string[] {
    const dates: string[] = [];

    let current = startDate;

    while (
        current <= endDate
    ) {
        dates.push(current);

        current =
            addDays(current, 1);
    }

    return dates;
}

export function countDays(
    startDate: string,
    endDate: string
): number {
    return getDaysBetween(
        startDate,
        endDate
    ).length;
}

export function formatLongDate(
    dateKey: string
): string {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "UTC",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }
    ).format(
        parseDateKey(dateKey)
    );
}

export function formatMonthYear(
    year: number,
    month: number
): string {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        }
    ).format(
        new Date(
            Date.UTC(
                year,
                month - 1,
                1
            )
        )
    );
}

export function getMonthDays(
    year: number,
    month: number
): string[] {
    const last =
        getLastDayOfMonth(
            year,
            month
        );

    return getDaysBetween(
        getFirstDayOfMonth(
            year,
            month
        ),
        last
    );
}