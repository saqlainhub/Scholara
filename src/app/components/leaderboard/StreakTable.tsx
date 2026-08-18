interface StreakAwardStudent {
  id: string;
  name: string;
  username: string;
  profileImg: string | null;
  streak3: number;
  streak7: number;
  streak14: number;
  streak30: number;
}

interface StreakTableProps {
  students: StreakAwardStudent[];
}

export default function StreakTable({
  students,
}: StreakTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[var(--navy-900)] sm:rounded-[24px]">
      {/* Header */}
      <div className="border-b border-white/[0.08] px-4 py-4 min-[400px]:px-5 sm:px-6 sm:py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-400)] sm:text-xs sm:tracking-[0.25em]">
          Consistency
        </p>

        <h2 className="mt-1 font-heading text-xl font-bold tracking-wide text-white min-[400px]:text-2xl">
          Streak Awards
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] sm:min-w-[760px]">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02]">
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-6 sm:py-4 sm:text-xs">
                Name
              </th>

              <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-5 sm:py-4 sm:text-xs">
                3 Days
              </th>

              <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-5 sm:py-4 sm:text-xs">
                7 Days
              </th>

              <th className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-5 sm:py-4 sm:text-xs">
                14 Days
              </th>

              <th className="px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] sm:px-6 sm:py-4 sm:text-xs">
                30 Days
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-white/[0.06] transition-colors last:border-b-0 hover:bg-white/[0.025]"
              >
                {/* Student */}
                <td className="px-4 py-3.5 sm:px-6 sm:py-4">
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[var(--navy-800)] min-[400px]:h-10 min-[400px]:w-10 sm:h-11 sm:w-11">
                      {student.profileImg ? (
                        <img
                          src={student.profileImg}
                          alt={student.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-heading text-base font-bold text-[var(--gold-400)] min-[400px]:text-lg">
                          {student.name
                            .charAt(0)
                            .toUpperCase()}
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

                {/* 3 Days */}
                <td className="px-3 py-3.5 text-center sm:px-5 sm:py-4">
                  <StreakAwardValue value={student.streak3} />
                </td>

                {/* 7 Days */}
                <td className="px-3 py-3.5 text-center sm:px-5 sm:py-4">
                  <StreakAwardValue value={student.streak7} />
                </td>

                {/* 14 Days */}
                <td className="px-3 py-3.5 text-center sm:px-5 sm:py-4">
                  <StreakAwardValue value={student.streak14} />
                </td>

                {/* 30 Days */}
                <td className="px-4 py-3.5 text-center sm:px-6 sm:py-4">
                  <StreakAwardValue
                    value={student.streak30}
                    highlighted
                  />
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-xs text-[var(--text-secondary)] sm:px-6 sm:py-14 sm:text-sm"
                >
                  No streak awards have been recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StreakAwardValue({
  value,
  highlighted = false,
}: {
  value: number;
  highlighted?: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-10 items-center justify-center rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold min-[400px]:min-w-11 sm:min-w-12 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm ${
        highlighted
          ? "border-[var(--gold-border)] bg-[var(--gold-500)]/10 text-[var(--gold-400)]"
          : "border-white/[0.07] bg-white/[0.025] text-white"
      }`}
    >
      {value}
    </span>
  );
}