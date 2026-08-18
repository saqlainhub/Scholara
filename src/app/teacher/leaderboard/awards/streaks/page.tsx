import AwardsPage from "@/app/components/leaderboard/AwardsPage";

export default function TeacherStreakAwardsPage() {
  return (
    <AwardsPage
      mode="streakAwards"
      basePath="/teacher/leaderboard"
      portalName="Teacher"
    />
  );
}