export default function RecordsLoading() {
    return (
        <div className="space-y-4 sm:space-y-5">
            {/* Stats skeletons */}
            <div
                className="
                    grid
                    grid-cols-2
                    gap-2.5
                    min-[400px]:gap-3
                    sm:grid-cols-3
                    lg:grid-cols-4
                    xl:grid-cols-5
                    2xl:grid-cols-6
                "
            >
                {Array.from({
                    length: 13,
                }).map((_, index) => (
                    <div
                        key={index}
                        className="
                            h-28
                            min-[400px]:h-30
                            animate-pulse
                            rounded-xl
                            border
                            border-(--border)
                            bg-(--navy-900)
                            sm:h-32
                        "
                    />
                ))}
            </div>

            {/* Main content skeleton */}
            <div
                className="
                    h-52
                    animate-pulse
                    rounded-xl
                    border
                    border-(--border)
                    bg-(--navy-900)
                    sm:h-64
                "
            />
        </div>
    );
}