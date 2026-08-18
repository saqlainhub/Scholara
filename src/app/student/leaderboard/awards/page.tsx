import AwardsPage from "@/app/components/leaderboard/AwardsPage";

export default function StudentAwardsPage() {
  return (
    <AwardsPage
      mode="awards"
      basePath="/student/leaderboard"
      portalName="Student"
    />
  );
}