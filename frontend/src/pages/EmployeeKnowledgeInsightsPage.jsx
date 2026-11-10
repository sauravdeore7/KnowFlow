
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'

const STATUS_LABELS = {
  completed: 'Completed',
  pending: 'Pending',
  blocker: 'Blockers',
  decision: 'Decisions',
  question: 'Questions',
}

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  blocker: 'bg-rose-50 text-rose-700 border-rose-100',
  decision: 'bg-blue-50 text-blue-700 border-blue-100',
  question: 'bg-violet-50 text-violet-700 border-violet-100',
}

function getText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function matchesEmployee(record, user) {
  if (!record || !user) return false

  const email = getText(user.email).toLowerCase()
  const userId = user.id || user.userId

  const recordEmails = [
    record.authorEmail,
    record.userEmail,
    record.employeeEmail,
    record.createdByEmail,
    record.email,
  ]
    .map((value) => getText(value).toLowerCase())
    .filter(Boolean)

  const recordIds = [
    record.authorId,
    record.userId,
    record.employeeId,
    record.createdById,
  ].filter((value) => value !== undefined && value !== null)

  const emailMatch = email && recordEmails.includes(email)

  const idMatch =
    userId !== undefined &&
    userId !== null &&
    recordIds.some((id) => String(id) === String(userId))

  return Boolean(emailMatch || idMatch)
}

function getKnowledgeItems(project) {
  return project?.knowledge?.items || []
}

function getItemStatus(item) {
  const status = getText(item.status).toLowerCase()
  const type = getText(item.type).toLowerCase()
  const category = getText(item.category).toLowerCase()

  if (status === 'completed' || status === 'complete') return 'completed'
  if (status === 'pending' || status === 'in progress') return 'pending'
  if (status === 'blocker' || status === 'blocked') return 'blocker'
  if (status === 'decision') return 'decision'
  if (status === 'question' || status === 'unresolved question') return 'question'

  if (type === 'blocker' || category === 'blocker') return 'blocker'
  if (type === 'decision' || category === 'decision') return 'decision'
  if (type === 'question' || category === 'question') return 'question'

  return 'pending'
}

function MetricCard({ label, value, icon, color, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function SectionHeading({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function DistributionRow({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">
          {value}
          <span className="ml-1 text-xs font-normal text-slate-400">
            ({percentage}%)
          </span>
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function EmployeeKnowledgeInsightsPage() {
  const { projects = [], user, projectsStatus } = useApp()

  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProject('')
      return
    }

    const exists = projects.some(
      (project) => String(project.id) === String(selectedProject)
    )

    if (!exists) {
      setSelectedProject(String(projects[0].id))
    }
  }, [projects, selectedProject])

  const project = projects.find(
    (item) => String(item.id) === String(selectedProject)
  )

  const insights = useMemo(() => {
    if (!project) return null

    const journals = project.journalEntries || []
    const knowledge = getKnowledgeItems(project)
    const documents = project.documents || []

    const ownJournals = journals.filter((entry) =>
      matchesEmployee(entry, user)
    )

    const ownKnowledge = knowledge.filter((item) =>
      matchesEmployee(item, user)
    )

    const statusCounts = {
      completed: 0,
      pending: 0,
      blocker: 0,
      decision: 0,
      question: 0,
    }

    knowledge.forEach((item) => {
      statusCounts[getItemStatus(item)] += 1
    })

    const missingSources = knowledge.filter((item) => {
      const sourceId = item.sourceId || item.documentId
      const source = getText(item.source)

      if (!sourceId && !source) return true

      if (sourceId) {
        return !documents.some(
          (document) => String(document.id) === String(sourceId)
        )
      }

      return false
    })

    const journalBlockers = journals.filter((entry) =>
      getText(entry.blockers)
    )

    const journalPending = journals.filter((entry) =>
      getText(entry.pendingTasks)
    )

    const ownJournalBlockers = ownJournals.filter((entry) =>
      getText(entry.blockers)
    )

    const ownJournalPending = ownJournals.filter((entry) =>
      getText(entry.pendingTasks)
    )

    const sourceCoverage =
      knowledge.length > 0
        ? Math.round(
            ((knowledge.length - missingSources.length) / knowledge.length) *
              100
          )
        : 0

    const observations = []

    if (statusCounts.blocker > 0 || journalBlockers.length > 0) {
      observations.push({
        type: 'blocker',
        title: 'Blockers need attention',
        description: `${statusCounts.blocker} recorded blocker findings and ${journalBlockers.length} journal entries mention blockers.`,
        icon: 'alert',
      })
    }

    if (statusCounts.pending > 0 || journalPending.length > 0) {
      observations.push({
        type: 'pending',
        title: 'Pending work remains',
        description: `${statusCounts.pending} knowledge items are pending and ${journalPending.length} journal entries mention pending tasks.`,
        icon: 'clock',
      })
    }

    if (statusCounts.question > 0) {
      observations.push({
        type: 'question',
        title: 'Unresolved questions recorded',
        description: `${statusCounts.question} knowledge items are classified as questions.`,
        icon: 'search',
      })
    }

    if (missingSources.length > 0) {
      observations.push({
        type: 'source',
        title: 'Source references need review',
        description: `${missingSources.length} knowledge items have missing or unavailable document references.`,
        icon: 'fileText',
      })
    }

    if (observations.length === 0) {
      observations.push({
        type: 'positive',
        title: 'No recorded knowledge gaps detected',
        description: 'No blockers, pending items, unresolved questions or missing source references were identified in the available records.',
        icon: 'checkCircle',
      })
    }

    return {
      journals,
      knowledge,
      documents,
      ownJournals,
      ownKnowledge,
      statusCounts,
      missingSources,
      journalBlockers,
      journalPending,
      ownJournalBlockers,
      ownJournalPending,
      sourceCoverage,
      observations,
    }
  }, [project, user])

  const totalFindings = insights?.knowledge.length || 0

  const metrics = [
    {
      label: 'Knowledge Findings',
      value: totalFindings,
      icon: 'brain',
      color: 'bg-blue-50 text-blue-600',
      description: 'Recorded project knowledge',
    },
    {
      label: 'Completed',
      value: insights?.statusCounts.completed || 0,
      icon: 'checkCircle',
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Completed knowledge items',
    },
    {
      label: 'Pending',
      value: insights?.statusCounts.pending || 0,
      icon: 'clock',
      color: 'bg-amber-50 text-amber-600',
      description: 'Items awaiting progress',
    },
    {
      label: 'Open Issues',
      value:
        (insights?.statusCounts.blocker || 0) +
        (insights?.statusCounts.question || 0),
      icon: 'alert',
      color: 'bg-rose-50 text-rose-600',
      description: 'Blockers and questions',
    },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Icon name="brain" className="h-4 w-4" />
            Knowledge & Intelligence
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Knowledge Insights
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Understand project knowledge, track your contributions and identify
            pending work across your assigned projects.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
          <Icon name="eye" className="h-4 w-4" />
          Employee View
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Project Workspace
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select an assigned project to explore its knowledge insights.
            </p>
          </div>

          <select
            value={selectedProject}
            onChange={(event) => setSelectedProject(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-72"
          >
            {projects.length === 0 && (
              <option value="">No projects available</option>
            )}

            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!project ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="folder" className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            {projectsStatus === 'loading'
              ? 'Loading projects'
              : 'No project available'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Assigned project insights will appear here when available.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <Icon name="folder" className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                    Current project
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    {project.name}
                  </h3>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-white/80 px-4 py-2.5">
                <p className="text-xs text-slate-500">Source coverage</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                  {insights.sourceCoverage}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeading
                icon="chart"
                title="Knowledge Distribution"
                description="Breakdown of the project's recorded knowledge findings."
              />

              <div className="mt-6 space-y-5">
                <DistributionRow
                  label="Completed"
                  value={insights.statusCounts.completed}
                  total={totalFindings}
                  color="bg-emerald-500"
                />
                <DistributionRow
                  label="Pending"
                  value={insights.statusCounts.pending}
                  total={totalFindings}
                  color="bg-amber-500"
                />
                <DistributionRow
                  label="Blockers"
                  value={insights.statusCounts.blocker}
                  total={totalFindings}
                  color="bg-rose-500"
                />
                <DistributionRow
                  label="Decisions"
                  value={insights.statusCounts.decision}
                  total={totalFindings}
                  color="bg-blue-500"
                />
                <DistributionRow
                  label="Questions"
                  value={insights.statusCounts.question}
                  total={totalFindings}
                  color="bg-violet-500"
                />
              </div>

              {totalFindings === 0 && (
                <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  No knowledge findings have been recorded for this project yet.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeading
                icon="users"
                title="My Contributions"
                description="Records attributed to your signed-in account."
              />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs font-medium text-blue-600">
                    My Journals
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.ownJournals.length}
                  </p>
                </div>

                <div className="rounded-xl bg-violet-50 p-4">
                  <p className="text-xs font-medium text-violet-600">
                    My Knowledge Items
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.ownKnowledge.length}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50 p-4">
                  <p className="text-xs font-medium text-rose-600">
                    My Journal Blockers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.ownJournalBlockers.length}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-600">
                    My Pending Tasks
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.ownJournalPending.length}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-400">
                Contributions are counted only when a journal or knowledge
                record contains an author email or user ID matching your
                account. Unattributed records are not counted as yours.
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon="fileText"
              title="Project Knowledge Coverage"
              description="Overview of the available project records and their source references."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Journal Entries
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {insights.journals.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Project Documents
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {insights.documents.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Missing Sources
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-600">
                  {insights.missingSources.length}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                  Knowledge source coverage
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {insights.sourceCoverage}%
                </span>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${insights.sourceCoverage}%` }}
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Based on whether recorded knowledge findings have an available
                source reference in the current project data.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon="activity"
              title="Knowledge Health Observations"
              description="Items that may need attention based on the currently recorded project data."
            />

            <div className="mt-5 space-y-3">
              {insights.observations.map((item, index) => {
                const styles = {
                  blocker: 'border-rose-100 bg-rose-50 text-rose-600',
                  pending: 'border-amber-100 bg-amber-50 text-amber-600',
                  question: 'border-violet-100 bg-violet-50 text-violet-600',
                  source: 'border-blue-100 bg-blue-50 text-blue-600',
                  positive: 'border-emerald-100 bg-emerald-50 text-emerald-600',
                }

                return (
                  <div
                    key={`${item.type}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles[item.type] || 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeading
              icon="listChecks"
              title="Recorded Knowledge Findings"
              description="Review the knowledge items currently available in this project."
            />

            {insights.knowledge.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <Icon
                  name="brain"
                  className="mx-auto h-8 w-8 text-slate-300"
                />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No knowledge findings yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Recorded findings will appear here when available.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {insights.knowledge.map((item, index) => {
                  const status = getItemStatus(item)
                  const title =
                    getText(item.title) ||
                    getText(item.name) ||
                    `Knowledge item ${index + 1}`

                  return (
                    <div
                      key={item.id || index}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <h4 className="break-words text-sm font-semibold text-slate-800">
                          {title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {getText(item.category) ||
                            getText(item.type) ||
                            'Project knowledge'}
                        </p>
                      </div>

                      <span className={`self-start rounded-lg border px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <Icon name="info" className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  About These Insights
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  These insights are calculated from the project records
                  currently available in KnowFlow. They are a read-only
                  overview, not live AI-generated analysis. Employee
                  contributions are counted only when their records contain
                  matching account identifiers. Actual project-level access
                  must be enforced by the backend.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
