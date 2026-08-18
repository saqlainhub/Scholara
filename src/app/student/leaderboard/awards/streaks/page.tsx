import AwardsPage from "@/app/components/leaderboard/AwardsPage";

export default function StudentStreakAwardsPage() {
  return (
    <AwardsPage
      mode="streakAwards"
      basePath="/student/leaderboard"
      portalName="Student"
    />
  );
}