import { processAwards } from "@/lib/award-processor";
import {
  getAwardLeaderboard,
  getStreakAwardLeaderboard,
} from "@/lib/awards";
import AwardTabs from "./AwardTabs";
import AwardsTable from "./AwardsTable";
import StreakTable from "./StreakTable";

interface AwardsPageProps {
  mode: "awards" | "streakAwards";
  basePath: string;
  portalName: string;
}

export default async function AwardsPage({
  mode,
  basePath,
  portalName,
}: AwardsPageProps) {
  await processAwards();

  if (mode === "awards") {
    const students = await getAwardLeaderboard();

    return (
      <main className="min-h-screen bg-(--navy-950)">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <header className="mb-5 sm:mb-8">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-(--gold-400) sm:mb-2 sm:text-xs sm:tracking-[0.3em]">
              {portalName} Portal
            </p>

            <h1 className="font-heading text-2xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              Leaderboard
            </h1>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-(--text-secondary) sm:mt-3 sm:text-sm sm:leading-6">
              Recognizing students who consistently achieve outstanding
              results.
            </p>
          </header>

          <div className="mb-4 sm:mb-6">
            <AwardTabs basePath={basePath} />
          </div>

          <AwardsTable students={students} />
        </div>
      </main>
    );
  }

  const students = await getStreakAwardLeaderboard();

  return (
    <main className="min-h-screen bg-(--navy-950)">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="mb-5 sm:mb-8">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-(--gold-400) sm:mb-2 sm:text-xs sm:tracking-[0.3em]">
            {portalName} Portal
          </p>

          <h1 className="font-heading text-2xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Leaderboard
          </h1>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-(--text-secondary) sm:mt-3 sm:text-sm sm:leading-6">
            Recognizing students who have earned consistency streak awards.
          </p>
        </header>

        <div className="mb-4 sm:mb-6">
          <AwardTabs basePath={basePath} />
        </div>

        <StreakTable students={students} />
      </div>
    </main>
  );
}