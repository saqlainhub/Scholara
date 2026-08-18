import AwardsPage from "@/app/components/leaderboard/AwardsPage";

export default function TeacherAwardsPage() {
  return (
    <AwardsPage
      mode="awards"
      basePath="/teacher/leaderboard"
      portalName="Teacher"
    />
  );
}