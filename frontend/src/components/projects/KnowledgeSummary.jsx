// Shows extracted knowledge for a project: counts plus evidence-linked items.
import { KNOWLEDGE_TYPES } from '../../data/statusConfig'
import Badge from '../common/Badge'

const TONES = {
  completed: 'success',
  pending: 'warning',
  decision: 'info',
  blocker: 'danger',
  question: 'neutral',
}

export default function KnowledgeSummary({ knowledge }) {
  const counts = Object.keys(KNOWLEDGE_TYPES).map((type) => ({
    type,
    label: KNOWLEDGE_TYPES[type],
    count: knowledge.items.filter((item) => item.type === type).length,
  }))

  return (
    <div className="space-y-5 p-6">
      <p className="text-sm text-slate-600">{knowledge.summary}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map((entry) => (
          <div key={entry.type} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{entry.count}</p>
            <p className="text-xs text-slate-500">{entry.label}</p>
          </div>
        ))}
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {knowledge.items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
            <Badge tone={TONES[item.type]}>{KNOWLEDGE_TYPES[item.type]}</Badge>
            <p className="min-w-0 flex-1 text-sm text-slate-700">{item.text}</p>
            {item.source ? (
              <span
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold
                  text-slate-600"
              >
                [{item.source}]
              </span>
            ) : (
              <span
                className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold
                  text-amber-700"
              >
                No source
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">
        Sample (synthetic) extraction. Real AI extraction with source links arrives in Part 2.
      </p>
    </div>
  )
}
