// Grey placeholder cards shown while projects are loading.
export default function ProjectListSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
