// Four-step tracker: documents -> extraction -> manager review -> approved.
import Icon from '../common/Icon'

const STEPS = ['Authorised documents', 'AI extraction', 'Manager review', 'Approved']

// Returns how many steps are finished for a project.
function completedSteps(project) {
  switch (project.handoverStatus) {
    case 'approved':
      return 4
    case 'awaiting_approval':
    case 'draft':
      return 2
    default:
      return project.documents.length > 0 ? 1 : 0
  }
}

export default function HandoverProgress({ project }) {
  const done = completedSteps(project)

  return (
    <ol className="space-y-4 p-6">
      {STEPS.map((step, index) => {
        const complete = index < done
        const current = index === done
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm
                font-semibold ${
                  complete
                    ? 'bg-emerald-100 text-emerald-700'
                    : current
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                }`}
            >
              {complete ? <Icon name="checkCircle" className="h-5 w-5" /> : index + 1}
            </span>
            <span
              className={`text-sm ${
                complete || current ? 'font-medium text-slate-900' : 'text-slate-400'
              }`}
            >
              {step}
              {current && <span className="ml-2 text-xs text-brand-600">In progress</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
