import Link from "next/link";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

interface LeaderboardTabsProps {
  basePath: string;
  activePeriod: LeaderboardPeriod;
}

const tabs: {
  label: string;
  period: LeaderboardPeriod;
  href: string;
}[] = [
  {
    label: "Overall",
    period: "overall",
    href: "",
  },
  {
    label: "Daily",
    period: "daily",
    href: "/daily",
  },
  {
    label: "Weekly",
    period: "weekly",
    href: "/weekly",
  },
  {
    label: "Monthly",
    period: "monthly",
    href: "/monthly",
  },
];

export default function LeaderboardTabs({
  basePath,
  activePeriod,
}: LeaderboardTabsProps) {
  return (
    <div className="mb-6 w-full overflow-x-auto pb-1 sm:mb-8">
      <div className="flex min-w-max gap-1.5 rounded-2xl border border-white/[0.08] bg-[var(--navy-900)] p-1.5 sm:gap-2 sm:p-2">
        {tabs.map((tab) => {
          const active = activePeriod === tab.period;

          return (
            <Link
              key={tab.period}
              href={`${basePath}${tab.href}`}
              className={`flex min-h-10 items-center justify-center rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all sm:min-h-11 sm:px-5 sm:py-3 sm:text-sm ${
                active
                  ? "bg-[var(--gold-500)] text-[var(--navy-950)] shadow-lg shadow-yellow-900/20"
                  : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}