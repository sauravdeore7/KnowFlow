import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'

const CATEGORY_META = {
  completed: {
    label: 'Completed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  decision: {
    label: 'Decisions',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  blocker: {
    label: 'Blockers',
    color: 'bg-red-50 text-red-700 border-red-200',
  },
  question: {
    label: 'Open Questions',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
}

function MetricCard({ label, value, description, icon, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${color}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}

export default function KnowledgeInsightsPage() {
  const { projects, params } = useApp()

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || '',
  )

  const project = useMemo(
    () => projects.find((item) => item.id === selectedProjectId),
    [projects, selectedProjectId],
  )

  const entries = project?.journalEntries || []
  const documents = project?.documents || []
  const members = project?.members || []
  const knowledgeItems = project?.knowledge?.items || []

  const counts = useMemo(() => {
    const result = {
      completed: 0,
      pending: 0,
      decision: 0,
      blocker: 0,
      question: 0,
    }

    knowledgeItems.forEach((item) => {
      if (result[item.type] !== undefined) result[item.type] += 1
    })

    return result
  }, [knowledgeItems])

  const observations = useMemo(() => {
    if (!project) return []

    const findings = []

    const blockers = knowledgeItems.filter((item) => item.type === 'blocker')
    const pending = knowledgeItems.filter((item) => item.type === 'pending')
    const questions = knowledgeItems.filter((item) => item.type === 'question')
    const decisions = knowledgeItems.filter((item) => item.type === 'decision')

    if (blockers.length) {
      findings.push({
        type: 'Attention required',
        title: `${blockers.length} recorded blocker${blockers.length > 1 ? 's' : ''}`,
        description: blockers.map((item) => item.text).join(' '),
        color: 'border-red-200 bg-red-50',
        textColor: 'text-red-800',
      })
    }

    if (pending.length) {
      findings.push({
        type: 'Pending work',
        title: `${pending.length} pending knowledge item${pending.length > 1 ? 's' : ''}`,
        description: pending.map((item) => item.text).join(' '),
        color: 'border-amber-200 bg-amber-50',
        textColor: 'text-amber-800',
      })
    }

    if (questions.length) {
      findings.push({
        type: 'Knowledge gap',
        title: `${questions.length} open question${questions.length > 1 ? 's' : ''}`,
        description: questions.map((item) => item.text).join(' '),
        color: 'border-purple-200 bg-purple-50',
        textColor: 'text-purple-800',
      })
    }

    if (decisions.length) {
      findings.push({
        type: 'Recorded decisions',
        title: `${decisions.length} documented decision${decisions.length > 1 ? 's' : ''}`,
        description: decisions.map((item) => item.text).join(' '),
        color: 'border-blue-200 bg-blue-50',
        textColor: 'text-blue-800',
      })
    }

    if (!findings.length) {
      findings.push({
        type: 'Knowledge overview',
        title: 'No structured findings recorded',
        description: 'More project knowledge needs to be recorded before useful insights can be displayed.',
        color: 'border-slate-200 bg-slate-50',
        textColor: 'text-slate-700',
      })
    }

    return findings
  }, [project, knowledgeItems])

  if (!projects.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">No projects available</p>
        <p className="mt-1 text-sm text-slate-500">
          Create a project before viewing Knowledge Insights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Knowledge Insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Understand the knowledge coverage, progress and outstanding gaps in each project.
          </p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          Manager Workspace
        </span>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="font-bold text-blue-950">Select Project</h3>
          <p className="mt-1 text-sm text-blue-800">
            Insights are calculated separately for each selected project.
          </p>
        </div>

        <select
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Choose a project...</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </section>

      {!project ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <span className="text-3xl">📊</span>
          <h3 className="mt-3 font-semibold text-slate-800">
            Select a project to view its insights
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Each project has its own knowledge profile and findings.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Selected Project
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {project.name}
                </h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                  {project.description}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                {project.status.replace('_', ' ')}
              </span>
            </div>

            {project.knowledge?.summary && (
              <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Knowledge Summary
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-900">
                  {project.knowledge.summary}
                </p>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Knowledge Findings"
              value={knowledgeItems.length}
              description="Structured project findings"
              icon="🧠"
              color="bg-blue-50"
            />
            <MetricCard
              label="Journal Entries"
              value={entries.length}
              description="Recorded employee updates"
              icon="📘"
              color="bg-violet-50"
            />
            <MetricCard
              label="Project Documents"
              value={documents.length}
              description="Available project files"
              icon="📄"
              color="bg-cyan-50"
            />
            <MetricCard
              label="Team Members"
              value={members.length}
              description="Members assigned to this project"
              icon="👥"
              color="bg-emerald-50"
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-bold text-slate-900">
                Knowledge Distribution
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Breakdown of this project's recorded knowledge findings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Object.entries(CATEGORY_META).map(([type, meta]) => (
                <div key={type} className="rounded-xl border border-slate-200 p-4">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                    {meta.label}
                  </span>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {counts[type]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Findings</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h3 className="font-bold text-slate-900">
                Project Knowledge Observations
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Important points identified from this project's recorded knowledge.
              </p>
            </div>

            <div className="space-y-3">
              {observations.map((item, index) => (
                <article
                  key={`${item.type}-${index}`}
                  className={`rounded-xl border p-4 ${item.color}`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wide ${item.textColor}`}>
                    {item.type}
                  </p>
                  <h4 className={`mt-1 text-sm font-bold ${item.textColor}`}>
                    {item.title}
                  </h4>
                  <p className={`mt-2 text-sm leading-6 ${item.textColor}`}>
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900">Project Knowledge Sources</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sources currently available for this project.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {entries.length > 0 && (
                <div className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Employee Journals</p>
                    <p className="text-xs text-slate-500">Daily work and progress records</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{entries.length}</span>
                </div>
              )}
              {documents.length > 0 && (
                <div className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Project Documents</p>
                    <p className="text-xs text-slate-500">Uploaded knowledge sources</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{documents.length}</span>
                </div>
              )}
              {members.length > 0 && (
                <div className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Project Team</p>
                    <p className="text-xs text-slate-500">Assigned project members</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{members.length}</span>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Prototype Information
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          These insights are calculated from preloaded sample project records.
          Live AI analysis, document understanding and automatic knowledge updates
          will be connected during backend integration.
        </p>
      </div>
    </div>
  )
}