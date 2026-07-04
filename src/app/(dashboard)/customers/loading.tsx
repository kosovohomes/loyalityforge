export default function CustomersLoading() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 animate-pulse rounded bg-espresso/10" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-espresso/5" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-full bg-espresso/10" />
          <div className="h-9 w-32 animate-pulse rounded-full bg-espresso/10" />
        </div>
      </div>

      <div className="mt-6">
        <div className="h-10 w-full animate-pulse rounded-lg bg-espresso/5" />
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-espresso/10">
        <div className="space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 flex-1 animate-pulse rounded bg-espresso/5" />
              <div className="h-4 w-32 animate-pulse rounded bg-espresso/5" />
              <div className="h-4 w-40 animate-pulse rounded bg-espresso/5" />
              <div className="h-4 w-20 animate-pulse rounded bg-espresso/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
