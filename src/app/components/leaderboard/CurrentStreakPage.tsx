import { processAwards } from "@/lib/award-processor";
import { getCurrentStreakLeaderboard } from "@/lib/awards";
import CurrentStreakTable from "./CurrentStreakTable";
import StreakBanner from "./StreakBanner";

interface CurrentStreakPageProps {
  basePath: string;
  portalName: string;
}

export default async function CurrentStreakPage({
  basePath,
  portalName,
}: CurrentStreakPageProps) {
  await processAwards();

  const students =
    await getCurrentStreakLeaderboard();

  const winner = students[0] ?? null;

  return (
    <main className="min-h-screen bg-[var(--navy-950)]">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="mb-5 sm:mb-8">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gold-400)] sm:mb-2 sm:text-xs sm:tracking-[0.3em]">
            {portalName} Portal
          </p>

          <h1 className="font-heading text-2xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Leaderboard
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--text-secondary)] sm:mt-3 sm:text-sm sm:leading-6">
            The longest active streaks among all students.
          </p>
        </header>

        <div className="space-y-4 sm:space-y-6">
          <StreakBanner student={winner} />

          <CurrentStreakTable students={students} />
        </div>
      </div>
    </main>
  );
}