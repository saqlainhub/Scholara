import AwardsPage from "@/app/components/leaderboard/AwardsPage";

export default function HeadStreakAwardsPage() {
  return (
    <AwardsPage
      mode="streakAwards"
      basePath="/head/leaderboard"
      portalName="Head"
    />
  );
}