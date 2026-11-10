
import { useApp } from '../hooks/useApp'

const PLANNED_FEATURES = {
  'audit-history': {
    title: 'Audit & Version History',
    subtitle: 'A complete history of project knowledge changes and approvals.',
    icon: '🛡️',
    features: [
      { title: 'Knowledge Change Tracking', description: 'Track updates to project knowledge, decisions and records.' },
      { title: 'Version Comparison', description: 'Compare previous and current versions of handover information.' },
      { title: 'Activity Audit Trail', description: 'Review who made changes, when they happened and what was updated.' },
      { title: 'Approval History', description: 'Maintain a record of employee confirmations and manager approvals.' },
    ],
  },

  'reports-analytics': {
    title: 'Reports & Analytics',
    subtitle: 'Understand project knowledge health and handover performance.',
    icon: '📊',
    features: [
      { title: 'Project Knowledge Reports', description: 'Generate structured reports about project knowledge coverage.' },
      { title: 'Handover Performance', description: 'Review handover progress, review status and completion trends.' },
      { title: 'Knowledge Gap Analysis', description: 'Identify missing information and unresolved project dependencies.' },
      { title: 'Exportable Reports', description: 'Prepare project reports for sharing and record keeping.' },
    ],
  },

  'employee-ai-assistant': {
    title: 'AI Knowledge Assistant',
    subtitle: 'Get intelligent answers from your authorised project knowledge.',
    icon: '🤖',
    features: [
      { title: 'Project Knowledge Chat', description: 'Ask questions about assigned projects and receive contextual answers.' },
      { title: 'Source-Based Answers', description: 'Explore the documents, journals and records supporting each answer.' },
      { title: 'Contextual Assistance', description: 'Understand project decisions, tasks, dependencies and technical information.' },
      { title: 'Permission-Aware Access', description: 'Receive answers only from information you are authorised to access.' },
    ],
  },

  'employee-ai-podcast': {
    title: 'AI Knowledge Podcast',
    subtitle: 'Turn project knowledge into easy-to-understand audio summaries.',
    icon: '🎧',
    features: [
      { title: 'AI Audio Summaries', description: 'Convert important project information into audio content.' },
      { title: 'Project Briefings', description: 'Listen to summaries of project progress, decisions and updates.' },
      { title: 'Knowledge Discussions', description: 'Generate conversational audio explanations of complex topics.' },
      { title: 'Flexible Listening', description: 'Access project knowledge through convenient audio experiences.' },
    ],
  },

  'contribution-analytics': {
    title: 'Contribution Analytics',
    subtitle: 'Understand your contributions to project knowledge and collaboration.',
    icon: '📈',
    features: [
      { title: 'Contribution Overview', description: 'Track your journals, documents, tasks and knowledge contributions.' },
      { title: 'Project Participation', description: 'Understand your involvement across assigned projects.' },
      { title: 'Knowledge Sharing Trends', description: 'Explore how your knowledge contributions develop over time.' },
      { title: 'Personal Performance Insights', description: 'View meaningful insights into your project participation.' },
    ],
  },

  'knowledge-portfolio': {
    title: 'Knowledge Portfolio',
    subtitle: 'Build a structured record of your work, skills and project knowledge.',
    icon: '🏆',
    features: [
      { title: 'Knowledge Contributions', description: 'Showcase important work and knowledge contributed to projects.' },
      { title: 'Skills & Expertise', description: 'Organise skills and areas of technical expertise demonstrated through work.' },
      { title: 'Project Experience', description: 'Maintain a record of project involvement and responsibilities.' },
      { title: 'Verified Achievements', description: 'Highlight reviewed and verified knowledge contributions.' },
    ],
  },

  'employee-reports-analytics': {
    title: 'Reports & Analytics',
    subtitle: 'Explore personal contribution reports and authorised project insights.',
    icon: '📊',
    features: [
      { title: 'Personal Contribution Reports', description: 'Review your journals, tasks and knowledge contributions.' },
      { title: 'Project Progress Insights', description: 'Understand progress across your assigned projects.' },
      { title: 'Knowledge Activity Reports', description: 'Explore patterns in project participation and knowledge sharing.' },
      { title: 'Report Generation', description: 'Generate structured reports for personal and project-level review.' },
    ],
  },
}

export default function PlannedFeaturePage() {
  const { page } = useApp()
  const feature = PLANNED_FEATURES[page]

  if (!feature) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">
          Planned feature not found
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {feature.title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {feature.subtitle}
          </p>
        </div>

        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          Coming in Round 3
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-slate-950 px-6 py-9 text-white sm:px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
            {feature.icon}
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-blue-300">
            KnowFlow · Planned Development
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            This feature is planned for Round 3
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            This section is visible as part of the KnowFlow roadmap.
            Its complete functionality will be developed during Round 3.
            No unfinished functionality is being presented as operational.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900">
            Planned Capabilities
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            The following capabilities are planned for this section.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {feature.features.map((item, index) => (
              <article
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-700">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <h4 className="mt-3 text-sm font-bold text-slate-900">
                  {item.title}
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          KnowFlow Development Roadmap
        </p>
        <p className="mt-1 text-sm leading-6 text-blue-800">
          This capability is part of the planned Round 3 development roadmap.
          Its complete implementation will be introduced in a future phase.
        </p>
      </div>
    </div>
  )
}
