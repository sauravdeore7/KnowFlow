// Coloured pill. StatusBadge picks the label and colour from data/statusConfig.js.
import { HANDOVER_STATUS, PROJECT_STATUS } from '../../data/statusConfig'

const TONES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
}

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs
        font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

// type is "project" or "handover"; value is the status key, e.g. "under_review".
export function StatusBadge({ type = 'project', value }) {
  const config = type === 'project' ? PROJECT_STATUS : HANDOVER_STATUS
  const entry = config[value] ?? { label: value, tone: 'neutral' }
  return <Badge tone={entry.tone}>{entry.label}</Badge>
}
