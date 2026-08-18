"use client";

import { usePathname } from "next/navigation";
import type { LeaderboardStudent } from "@/lib/leaderboard";

interface LeaderboardTableProps {
  students: LeaderboardStudent[];
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold-border)] bg-[var(--gold-500)]/10 font-mono text-sm font-bold text-[var(--gold-400)] sm:h-10 sm:w-10 sm:text-base">
        1
      </div>
    );
  }

  if (position === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-base">
        2
      </div>
    );
  }

  if (position === 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-900/40 bg-orange-900/10 font-mono text-sm font-bold text-orange-300 sm:h-10 sm:w-10 sm:text-base">
        3
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center font-mono text-xs text-[var(--text-secondary)] sm:h-10 sm:w-10 sm:text-sm">
      {position}
    </div>
  );
}

export default function LeaderboardTable({
  students,
}: LeaderboardTableProps) {
  const pathname = usePathname();

  const leaderboardType = pathname.split("/").pop();

  const leaderboardTitle =
    leaderboardType === "daily"
      ? "Daily Leaderboard"
      : leaderboardType === "weekly"
        ? "Weekly Leaderboard"
        : leaderboardType === "monthly"
          ? "Monthly Leaderboard"
          : "Overall Leaderboard";

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[var(--navy-900)] sm:rounded-[24px]">
      {/* Header */}
      <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5 sm:py-5 md:px-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-400)] sm:text-xs sm:tracking-[0.2em]">
          Current Rankings
        </p>

        <h2 className="mt-1 font-heading text-xl font-bold text-white sm:text-2xl">
          {leaderboardTitle}
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse sm:min-w-[600px]">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              <th className="w-20 px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:w-28 sm:px-5 sm:py-4 sm:text-xs md:px-7">
                Position
              </th>

              <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-5 sm:py-4 sm:text-xs">
                Student
              </th>

              <th className="w-32 px-3 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:w-40 sm:px-5 sm:py-4 sm:text-xs md:px-7">
                Score
              </th>
            </tr>
          </thead>

          <tbody>
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-xs text-[var(--text-secondary)] sm:px-7 sm:py-14 sm:text-sm"
                >
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.025]"
                >
                  {/* Position */}
                  <td className="px-3 py-3 sm:px-5 sm:py-4 md:px-7">
                    <PositionBadge position={student.position} />
                  </td>

                  {/* Student */}
                  <td className="px-3 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-2.5 sm:gap-4">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[var(--navy-800)] sm:h-11 sm:w-11">
                        {student.profileImg ? (
                          <img
                            src={student.profileImg}
                            alt={student.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-heading text-base font-bold text-[var(--gold-400)] sm:text-lg">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[150px] truncate text-sm font-semibold text-white sm:max-w-none">
                          {student.name}
                        </p>

                        <p className="max-w-[150px] truncate text-[10px] text-[var(--text-secondary)] sm:max-w-none sm:text-xs">
                          @{student.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-3 py-3 text-center sm:px-5 sm:py-4 md:px-7">
                    <span className="font-mono text-sm font-bold text-[var(--gold-400)] sm:text-base">
                      {student.score.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}