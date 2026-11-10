// Inline message box. tone: error | success | info | warning.
import Icon from './Icon'

const TONES = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

export default function Alert({ tone = 'info', children, action, className = '' }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${TONES[tone]}
        ${className}`}
    >
      <Icon name={tone === 'success' ? 'checkCircle' : 'alert'} className="mt-0.5 h-5 w-5
        shrink-0" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  )
}
