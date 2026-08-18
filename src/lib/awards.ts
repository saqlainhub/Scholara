import {prisma} from "@/lib/prisma";

export async function getAwardLeaderboard() {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      profileImg: true,
      awardStats: {
        select: {
          dailyAwards: true,
          weeklyAwards: true,
          monthlyAwards: true,
          overallAwardDays: true,
        },
      },
    },
  });

  return students
    .map((student) => ({
      id: student.id,
      name: student.name,
      username: student.username,
      profileImg: student.profileImg,
      daily: student.awardStats?.dailyAwards ?? 0,
      weekly: student.awardStats?.weeklyAwards ?? 0,
      monthly: student.awardStats?.monthlyAwards ?? 0,
      overall: student.awardStats?.overallAwardDays ?? 0,
    }))
    .sort((a, b) => {
      const totalA =
        a.daily +
        a.weekly +
        a.monthly +
        a.overall;

      const totalB =
        b.daily +
        b.weekly +
        b.monthly +
        b.overall;

      return totalB - totalA;
    });
}

export async function getStreakAwardLeaderboard() {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      profileImg: true,
      awardStats: {
        select: {
          streak3DaysAwards: true,
          streak7DaysAwards: true,
          streak14DaysAwards: true,
          streak30DaysAwards: true,
        },
      },
    },
  });

  return students
    .map((student) => ({
      id: student.id,
      name: student.name,
      username: student.username,
      profileImg: student.profileImg,
      streak3:
        student.awardStats?.streak3DaysAwards ?? 0,
      streak7:
        student.awardStats?.streak7DaysAwards ?? 0,
      streak14:
        student.awardStats?.streak14DaysAwards ?? 0,
      streak30:
        student.awardStats?.streak30DaysAwards ?? 0,
    }))
    .sort((a, b) => {
      const totalA =
        a.streak3 +
        a.streak7 +
        a.streak14 +
        a.streak30;

      const totalB =
        b.streak3 +
        b.streak7 +
        b.streak14 +
        b.streak30;

      return totalB - totalA;
    });
}

export async function getCurrentStreakLeaderboard() {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      profileImg: true,
      awardStats: {
        select: {
          currentStreak: true,
          longestStreak: true,
        },
      },
    },
  });

  return students
    .map((student) => ({
      id: student.id,
      name: student.name,
      username: student.username,
      profileImg: student.profileImg,
      currentStreak:
        student.awardStats?.currentStreak ?? 0,
      longestStreak:
        student.awardStats?.longestStreak ?? 0,
    }))
    .sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }

      return b.longestStreak - a.longestStreak;
    })
    .map((student, index) => ({
      ...student,
      position: index + 1,
    }));
}