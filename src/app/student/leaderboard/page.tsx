import LeaderboardPage from "@/app/components/leaderboard/LeaderboardPage";

export default function StudentLeaderboardPage() {
  return (
    <LeaderboardPage
      period="overall"
      basePath="/student/leaderboard"
      portalName="Student"
    />
  );
}