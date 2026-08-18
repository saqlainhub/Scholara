interface StreakBannerProps {
  student: {
    name: string;
    username: string;
    profileImg: string | null;
    currentStreak: number;
    longestStreak: number;
    position: number;
  } | null;
}

export default function StreakBanner({
  student,
}: StreakBannerProps) {
  if (!student) {
    return (
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--gold-border)] bg-[var(--navy-900)] p-5 sm:mb-8 sm:rounded-[28px] sm:p-8">
        <div className="relative z-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-400)] sm:text-xs sm:tracking-[0.25em]">
            Streaks
          </p>

          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            No results yet
          </h2>

          <p className="mt-2 max-w-lg text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
            No active streaks have been recorded yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--gold-border)] bg-[var(--navy-900)] sm:mb-8 sm:rounded-[28px]">
      {/* Background glow */}
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--gold-500)]/10 blur-3xl sm:h-72 sm:w-72" />

      <div className="absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-yellow-500/5 blur-3xl sm:h-72 sm:w-72" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 py-7 min-[400px]:px-5 sm:gap-8 sm:px-8 sm:py-10 md:flex-row md:px-10 md:py-12">
        {/* Profile */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--gold-400)] bg-[var(--navy-800)] shadow-[0_0_40px_rgba(230,160,0,0.18)] min-[400px]:h-28 min-[400px]:w-28 sm:h-32 sm:w-32 md:h-36 md:w-36">
            {student.profileImg ? (
              <img
                src={student.profileImg}
                alt={student.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="font-heading text-4xl font-bold text-[var(--gold-400)] min-[400px]:text-5xl">
                {student.name.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Fire badge */}
            <div className="absolute -bottom-2 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[var(--gold-400)] bg-[var(--navy-950)] text-lg min-[400px]:-bottom-3 min-[400px]:h-10 min-[400px]:w-10 min-[400px]:text-xl">
              🔥
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 text-center md:text-left">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--gold-400)] sm:text-xs sm:tracking-[0.3em]">
            Congratulations
          </p>

          <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-white min-[400px]:text-3xl sm:text-4xl md:text-5xl">
            {student.name}
          </h1>

          <p className="mt-2 text-xs text-[var(--text-secondary)] sm:text-sm">
            Highest current streak
          </p>

          {/* Stats */}
          <div className="mt-5 grid w-full grid-cols-2 gap-2.5 min-[400px]:gap-3 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center md:justify-start">
            {/* Current Streak */}
            <div className="min-w-0 rounded-xl border border-[var(--gold-border)] bg-black/20 px-3 py-2.5 sm:rounded-2xl sm:px-5 sm:py-3">
              <p className="truncate text-[8px] font-bold uppercase tracking-wider text-[var(--text-secondary)] min-[400px]:text-[9px] sm:text-[10px]">
                Current Streak
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-[var(--gold-400)] min-[400px]:text-2xl">
                {student.currentStreak}
                <span className="ml-1 text-xs sm:text-sm">
                  days
                </span>
              </p>
            </div>

            {/* Position */}
            <div className="min-w-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 sm:rounded-2xl sm:px-5 sm:py-3">
              <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-secondary)] min-[400px]:text-[9px] sm:text-[10px]">
                Position
              </p>

              <p className="mt-1 font-mono text-xl font-bold text-white min-[400px]:text-2xl">
                #{student.position}
              </p>
            </div>
          </div>
        </div>

        {/* Fire decoration */}
        <div className="hidden shrink-0 text-[80px] leading-none opacity-80 lg:block xl:text-[100px]">
          🔥
        </div>
      </div>
    </section>
  );
}