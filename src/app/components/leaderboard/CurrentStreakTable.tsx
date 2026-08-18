interface CurrentStreakStudent {
  id: string;
  name: string;
  username: string;
  profileImg: string | null;
  currentStreak: number;
  longestStreak: number;
  position: number;
}

interface CurrentStreakTableProps {
  students: CurrentStreakStudent[];
}

export default function CurrentStreakTable({
  students,
}: CurrentStreakTableProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[var(--navy-900)]">
      {/* Header */}
      <div className="border-b border-white/[0.08] px-4 py-5 sm:px-6 sm:py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-400)] sm:text-xs sm:tracking-[0.25em]">
          Current Rankings
        </p>

        <h2 className="mt-1 font-heading text-xl font-bold tracking-wide text-white sm:text-2xl">
          Streak Leaderboard
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] sm:min-w-[650px]">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              <th className="w-24 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:w-32 sm:px-6 sm:py-4 sm:text-xs">
                Position
              </th>

              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-6 sm:py-4 sm:text-xs">
                Name
              </th>

              <th className="w-44 px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:w-52 sm:px-6 sm:py-4 sm:text-xs">
                Current Streak
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-white/[0.06] last:border-b-0 transition-colors hover:bg-white/[0.025]"
              >
                {/* Position */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <Position position={student.position} />
                </td>

                {/* Student */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-3 sm:gap-4">
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

                {/* Current streak */}
                <td className="px-4 py-3 text-right sm:px-6 sm:py-4">
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gold-border)] bg-[var(--gold-500)]/10 px-2.5 py-1.5 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2">
                    <span className="text-sm sm:text-lg">
                      🔥
                    </span>

                    <span className="font-mono text-sm font-bold text-[var(--gold-400)] sm:text-base">
                      {student.currentStreak}
                    </span>

                    <span className="text-[10px] text-[var(--text-secondary)] sm:text-xs">
                      days
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-sm text-[var(--text-secondary)] sm:px-6 sm:py-14"
                >
                  No streak data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Position({
  position,
}: {
  position: number;
}) {
  if (position === 1) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--gold-border)] bg-[var(--gold-500)]/10 font-mono text-sm font-bold text-[var(--gold-400)] sm:h-10 sm:w-10 sm:text-base">
        1
      </div>
    );
  }

  if (position === 2) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] font-mono text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-base">
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