import type { LeaderboardPeriod } from "@/lib/leaderboard";
import { getLeaderboard } from "@/lib/leaderboard";
import LeaderboardBanner from "./LeaderboardBanner";
import LeaderboardTable from "./LeaderboardTable";
import LeaderboardTabs from "./LeaderboardTabs";

interface LeaderboardPageProps {
  period: LeaderboardPeriod;
  basePath: string;
  portalName: string;
}

export default async function LeaderboardPage({
  period,
  basePath,
  portalName,
}: LeaderboardPageProps) {
  const leaderboard = await getLeaderboard(period);

  return (
    <main className="min-h-screen bg-[--navy-950]">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Header */}
        <header className="mb-5 sm:mb-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-5">
            <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-(--gold-400) sm:mb-2 sm:text-xs sm:tracking-[0.3em]">
                {portalName} Portal
              </p>

              <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                Leaderboard
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-(--text-secondary) sm:mt-3 sm:text-sm sm:leading-6">
                Students ranking based on their scores
              </p>
            </div>

            {/* Students count */}
            <div className="flex w-full items-center justify-between rounded-xl border border-white/8 bg-[--navy-900] px-4 py-2.5 sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-(--text-secondary) sm:text-[10px]">
                Students Ranked
              </p>

              <p className="ml-4 font-mono text-lg font-bold text-white sm:mt-1 sm:text-xl">
                {leaderboard.students.length}
              </p>
            </div>
          </div>
        </header>

        {/* Period tabs */}
        <LeaderboardTabs
          basePath={basePath}
          activePeriod={period}
        />

        {/* Winner banner */}
        <LeaderboardBanner
          winner={leaderboard.winner}
          subtitle={leaderboard.subtitle}
        />

        {/* Rankings */}
        <LeaderboardTable
          students={leaderboard.students}
        />
      </div>
    </main>
  );
}