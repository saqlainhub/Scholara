"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AwardTabsProps {
  basePath: string;
}

export default function AwardTabs({
  basePath,
}: AwardTabsProps) {
  const pathname = usePathname();

  const awardsActive =
    pathname === `${basePath}/awards`;

  const streakAwardsActive =
    pathname === `${basePath}/awards/streaks`;

  return (
    <div className="mb-5 w-full overflow-x-auto overscroll-x-contain sm:mb-8">
      <div className="flex w-max min-w-full gap-1.5 rounded-xl border border-white/[0.08] bg-[var(--navy-900)] p-1.5 sm:w-fit sm:min-w-0 sm:gap-2 sm:rounded-2xl sm:p-2">
        <Link
          href={`${basePath}/awards`}
          className={`flex min-h-10 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-semibold transition sm:min-h-0 sm:flex-none sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm ${
            awardsActive
              ? "bg-[var(--gold-500)] text-[var(--navy-950)]"
              : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          Awards
        </Link>

        <Link
          href={`${basePath}/awards/streaks`}
          className={`flex min-h-10 flex-1 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-semibold transition sm:min-h-0 sm:flex-none sm:rounded-xl sm:px-6 sm:py-3 sm:text-sm ${
            streakAwardsActive
              ? "bg-[var(--gold-500)] text-[var(--navy-950)]"
              : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          Streak Awards
        </Link>
      </div>
    </div>
  );
}