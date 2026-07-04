export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-espresso/10" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-espresso/5" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-full bg-espresso/10" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card">
            <div className="h-3 w-24 animate-pulse rounded bg-espresso/10" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-espresso/10" />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="h-6 w-48 animate-pulse rounded bg-espresso/10" />
        <div className="card mt-4 h-64 animate-pulse bg-espresso/5" />
      </div>
    </div>
  );
}
