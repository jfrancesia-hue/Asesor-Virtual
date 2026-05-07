export default function DashboardLoading() {
  return (
    <div className="px-6 md:px-8 py-10 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <header className="mb-10">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-9 w-72 rounded mt-3" />
        <div className="skeleton h-4 w-96 rounded mt-3" />
      </header>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
          >
            <div className="skeleton w-12 h-12 rounded-xl mb-4" />
            <div className="skeleton h-5 w-3/4 rounded mb-2" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded mt-1.5" />
          </div>
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <div className="skeleton h-4 w-1/2 rounded mb-2" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
