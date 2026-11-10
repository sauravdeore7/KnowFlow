
import Card from './Card'

export default function StatCard({
  label,
  value,
  hint,
  loading = false,
  onClick,
}) {
  const content = (
    <>
      <p className="text-sm font-semibold text-slate-500">{label}</p>

      {loading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-slate-200" />
      ) : (
        <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          {String(value).padStart(2, '0')}
        </p>
      )}

      <p className="mt-2 text-sm text-slate-400">{hint}</p>

      {onClick && (
        <p className="mt-4 text-xs font-semibold text-brand-600">
          View details →
        </p>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left
          shadow-sm transition-all duration-200
          hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-brand-500 focus-visible:ring-offset-2
          disabled:cursor-not-allowed"
      >
        {content}
      </button>
    )
  }

  return <Card className="p-6">{content}</Card>
}
