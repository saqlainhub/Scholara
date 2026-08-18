import { notFound } from "next/navigation";
import LeaderboardPage from "@/app/components/leaderboard/LeaderboardPage";
import type { LeaderboardPeriod } from "@/lib/leaderboard";

interface PageProps {
  params: Promise<{
    period: string;
  }>;
}

const validPeriods: LeaderboardPeriod[] = [
  "daily",
  "weekly",
  "monthly",
];

export default async function HeadLeaderboardPeriodPage({
  params,
}: PageProps) {
  const { period } = await params;

  if (!validPeriods.includes(period as LeaderboardPeriod)) {
    notFound();
  }

  return (
    <LeaderboardPage
      period={period as LeaderboardPeriod}
      basePath="/head/leaderboard"
      portalName="Head"
    />
  );
}