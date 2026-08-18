interface AwardStudent {
  id: string;
  name: string;
  username: string;
  profileImg: string | null;
  daily: number;
  weekly: number;
  monthly: number;
  overall: number;
}

interface AwardsTableProps {
  students: AwardStudent[];
}

export default function AwardsTable({
  students,
}: AwardsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/8 bg-(--navy-900) sm:rounded-3xl">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-4 sm:px-6 sm:py-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-(--gold-400) sm:text-xs sm:tracking-[0.25em]">
          Recognition
        </p>

        <h2 className="mt-1 font-heading text-xl font-bold text-white sm:text-2xl">
          Awards
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-190">
          <thead>
            <tr className="border-b border-white/8 bg-white/2">
              <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-(--text-secondary) sm:px-6 sm:py-4 sm:text-xs">
                Name
              </th>

              <th className="whitespace-nowrap px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-(--text-secondary) sm:px-5 sm:py-4 sm:text-xs">
                Daily
              </th>

              <th className="whitespace-nowrap px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-(--text-secondary) sm:px-5 sm:py-4 sm:text-xs">
                Weekly
              </th>

              <th className="whitespace-nowrap px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-(--text-secondary) sm:px-5 sm:py-4 sm:text-xs">
                Monthly
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-(--text-secondary) sm:px-6 sm:py-4 sm:text-xs">
                Overall
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-white/6 last:border-b-0 transition-colors hover:bg-white/2.5"
              >
                {/* Student */}
                <td className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-2.5 sm:gap-4">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-(--navy-800) sm:h-11 sm:w-11">
                      {student.profileImg ? (
                        <img
                          src={student.profileImg}
                          alt={student.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-heading text-base font-bold text-(--gold-400) sm:text-lg">
                          {student.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 max-w-32 sm:max-w-none">
                      <p className="truncate text-sm font-semibold text-white sm:text-base">
                        {student.name}
                      </p>

                      <p className="truncate text-[10px] text-(--text-secondary) sm:text-xs">
                        @{student.username}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Daily */}
                <td className="px-3 py-3 text-center sm:px-5 sm:py-4">
                  <AwardValue value={student.daily} />
                </td>

                {/* Weekly */}
                <td className="px-3 py-3 text-center sm:px-5 sm:py-4">
                  <AwardValue value={student.weekly} />
                </td>

                {/* Monthly */}
                <td className="px-3 py-3 text-center sm:px-5 sm:py-4">
                  <AwardValue value={student.monthly} />
                </td>

                {/* Overall */}
                <td className="px-4 py-3 text-center sm:px-6 sm:py-4">
                  <AwardValue
                    value={student.overall}
                    highlighted
                  />
                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center sm:px-6 sm:py-14"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/3 sm:h-12 sm:w-12">
                      <span className="text-lg text-(--gold-400) sm:text-xl">
                        —
                      </span>
                    </div>

                    <p className="text-sm font-medium text-white">
                      No awards recorded
                    </p>

                    <p className="mt-1 max-w-xs text-[10px] leading-4 text-(--text-secondary) sm:max-w-none sm:text-xs">
                      Award statistics will appear here once students
                      start earning awards.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AwardValue({
  value,
  highlighted = false,
}: {
  value: number;
  highlighted?: boolean;
}) {
  return (
    <span
      className={`inline-flex min-w-10 items-center justify-center rounded-lg border px-2 py-1.5 font-mono text-xs font-bold sm:min-w-12 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm ${
        highlighted
          ? "border-(--gold-border) bg-(--gold-500)/10 text-(--gold-400)"
          : "border-white/[0.07] bg-white/2.5 text-white"
      }`}
    >
      {value}
    </span>
  );
}