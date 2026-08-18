import LeaderboardPage from "@/app/components/leaderboard/LeaderboardPage";

export default function TeacherLeaderboardPage() {
  return (
    <LeaderboardPage
      period="overall"
      basePath="/teacher/leaderboard"
      portalName="Teacher"
    />
  );
}