import LeaderboardPage from "@/app/components/leaderboard/LeaderboardPage";

export default function HeadLeaderboardPage() {
  return (
    <LeaderboardPage
      period="overall"
      basePath="/head/leaderboard"
      portalName="Head"
    />
  );
}