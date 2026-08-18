import type {
    DayRecord,
} from "@/lib/student-records/types";

type Props = {
    day: DayRecord;
};

export default function DayStatusDot({
    day,
}: Props) {
    const dotClass =
        "block h-2.5 w-2.5 shrink-0 rounded-full";

    if (day.dayType === "OFF") {
        return (
            <span
                title="Off day"
                className={`${dotClass} bg-slate-500`}
            />
        );
    }

    if (day.stats.totalTasks === 0) {
        return (
            <span
                title="No tasks"
                className={`${dotClass} border border-(--text-secondary)`}
            />
        );
    }

    if (
        day.stats.unsubmitted > 0 ||
        day.stats.delayed > 0
    ) {
        return (
            <span
                title="Needs attention"
                className={`${dotClass} bg-red-400`}
            />
        );
    }

    if (
        day.stats.totalTasks > 0 &&
        day.stats.checked ===
            day.stats.totalTasks
    ) {
        return (
            <span
                title="Completed"
                className={`${dotClass} bg-emerald-400`}
            />
        );
    }

    return (
        <span
            title="Active"
            className={`${dotClass} bg-(--gold-400)`}
        />
    );
}