export default function ProgramsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-espresso/10" />
          <div className="mt-2 h-4 w-52 animate-pulse rounded bg-espresso/5" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-full bg-gold/50" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <div className="flex justify-between">
              <div className="h-5 w-36 animate-pulse rounded bg-espresso/10" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-espresso/10" />
            </div>
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-espresso/5" />
            <div className="mt-4 h-3 w-32 animate-pulse rounded bg-espresso/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
