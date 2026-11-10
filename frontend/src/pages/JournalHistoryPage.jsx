
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'

const FILTERS = ['All Entries', 'Completed', 'Blockers', 'Decisions']

function formatEntryDate(value) {
  if (!value) return 'Date not available'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatEntryTime(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getTaskCount(entries) {
  return entries.reduce((total, entry) => {
    const tasks = (entry.completedTasks || '')
      .split(/\n|;/)
      .map((task) => task.trim())
      .filter(Boolean)

    return total + tasks.length
  }, 0)
}

function MetricCard({ label, value, description, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-700">
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

function EntrySection({ title, content, color = 'slate' }) {
  if (!content?.trim()) return null

  const styles = {
    slate: 'bg-slate-50 border-slate-200',
    green: 'bg-green-50 border-green-100',
    amber: 'bg-amber-50 border-amber-100',
    blue: 'bg-blue-50 border-blue-100',
    red: 'bg-red-50 border-red-100',
    violet: 'bg-violet-50 border-violet-100',
  }

  return (
    <div className={`rounded-xl border p-3 ${styles[color]}`}>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
        {content}
      </p>
    </div>
  )
}

function JournalEntryCard({ entry, index }) {
  const hasBlocker = Boolean(entry.blockers?.trim())
  const hasDecision = Boolean(entry.decisions?.trim())
  const hasCompleted = Boolean(entry.completedTasks?.trim())

  return (
    <article className="relative ml-3 border-l-2 border-blue-100 pb-7 pl-7 last:border-l-transparent last:pb-0">
      <span className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-blue-500 bg-white" />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {formatEntryDate(entry.date || entry.createdAt)}
            </p>
            <h3 className="mt-1 text-base font-bold text-slate-900">
              Journal Entry {index + 1}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Recorded by {entry.createdBy || 'Unknown employee'}
              {entry.createdAt && ` · ${formatEntryTime(entry.createdAt)}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasCompleted && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Completed
              </span>
            )}
            {hasBlocker && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                Blocker
              </span>
            )}
            {hasDecision && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                Decision
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <EntrySection title="Work Summary" content={entry.workSummary} />
          <EntrySection title="Completed Tasks" content={entry.completedTasks} color="green" />
          <EntrySection title="Decisions Made" content={entry.decisions} color="violet" />
          <EntrySection title="Blockers" content={entry.blockers} color="red" />
          <EntrySection title="Dependencies" content={entry.dependencies} color="amber" />
          <EntrySection title="Pending Tasks" content={entry.pendingTasks} color="amber" />
          <EntrySection title="Next Steps" content={entry.nextSteps} color="blue" />
          <EntrySection title="Evidence / References" content={entry.evidence} />
        </div>
      </div>
    </article>
  )
}

export default function JournalHistoryPage() {
  const { projects, params, navigate } = useApp()

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || projects[0]?.id || '',
  )
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All Entries')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (params.projectId && projects.some((project) => project.id === params.projectId)) {
      setSelectedProjectId(params.projectId)
    } else if (!projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.id || '')
    }
  }, [params.projectId, projects, selectedProjectId])

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  )

  const entries = useMemo(() => {
    return [...(selectedProject?.journalEntries || [])].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime()
      const dateB = new Date(b.createdAt || b.date || 0).getTime()
      return dateB - dateA
    })
  }, [selectedProject])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const searchableText = [
        entry.workSummary,
        entry.completedTasks,
        entry.decisions,
        entry.blockers,
        entry.dependencies,
        entry.pendingTasks,
        entry.nextSteps,
        entry.evidence,
        entry.createdBy,
      ].join(' ').toLowerCase()

      const matchesSearch = searchableText.includes(search.toLowerCase())

      const matchesFilter =
        activeFilter === 'All Entries' ||
        (activeFilter === 'Completed' && Boolean(entry.completedTasks?.trim())) ||
        (activeFilter === 'Blockers' && Boolean(entry.blockers?.trim())) ||
        (activeFilter === 'Decisions' && Boolean(entry.decisions?.trim()))

      const entryDate = (entry.date || entry.createdAt || '').slice(0, 10)
      const matchesStart = !startDate || entryDate >= startDate
      const matchesEnd = !endDate || entryDate <= endDate

      return matchesSearch && matchesFilter && matchesStart && matchesEnd
    })
  }, [entries, search, activeFilter, startDate, endDate])

  const activeDays = new Set(
    entries.map((entry) => (entry.date || entry.createdAt || '').slice(0, 10)).filter(Boolean),
  ).size

  const handleProjectChange = (projectId) => {
    setSelectedProjectId(projectId)
    navigate('project-journal', { projectId })
  }

  return (
    <div className="space-y-7">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Project Knowledge Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Journal History
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              View daily work records, decisions, blockers and progress across your projects.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800">
            {projects.length} Projects Available
          </span>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-blue-300 bg-blue-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-lg text-white">
            ▦
          </span>
          <div>
            <label htmlFor="journal-project" className="block text-sm font-bold text-blue-950">
              Select Project
            </label>
            <p className="text-xs text-blue-800">
              Switch projects to view their complete journal history
            </p>
          </div>
        </div>

        <select
          id="journal-project"
          value={selectedProjectId}
          onChange={(event) => handleProjectChange(event.target.value)}
          className="mt-4 w-full rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {selectedProject && (
          <p className="mt-3 text-xs text-blue-800">
            Currently viewing: <strong>{selectedProject.name}</strong>
          </p>
        )}
      </section>

      {!projects.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-slate-900">No projects available</h2>
          <p className="mt-2 text-sm text-slate-500">
            Projects available to your account will appear here.
          </p>
        </div>
      ) : selectedProject ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              label="Total Entries"
              value={entries.length}
              description="Daily work records"
              icon="▤"
            />
            <MetricCard
              label="Tasks Done"
              value={getTaskCount(entries)}
              description="Recorded completed tasks"
              icon="✓"
            />
            <MetricCard
              label="Active Days"
              value={activeDays}
              description="Days with journal activity"
              icon="◷"
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">All Journal Entries</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search, filter and review recorded project activity.
                </p>
              </div>

              <div className="mt-5">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search work, tasks, decisions, blockers..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeFilter === filter
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  From
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  To
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700"
                  />
                </label>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">
                  {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} found
                </p>
                {(search || activeFilter !== 'All Entries' || startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setActiveFilter('All Entries')
                      setStartDate('')
                      setEndDate('')
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {filteredEntries.length ? (
                <div>
                  {filteredEntries.map((entry, index) => (
                    <JournalEntryCard
                      key={entry.id || `${entry.createdAt}-${index}`}
                      entry={entry}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <p className="text-base font-semibold text-slate-800">
                    {entries.length ? 'No matching entries found' : 'No journal entries yet'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {entries.length
                      ? 'Try changing your search or filters.'
                      : 'Daily work records will appear here when employees save their journals.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-xl text-white">
                ✦
              </span>
              <div>
                <h2 className="text-base font-bold text-blue-950">
                  Cumulative Project Knowledge
                </h2>
                <p className="mt-1 text-sm leading-6 text-blue-900">
                  Daily journal entries contribute to the project's evolving knowledge.
                  When a handover is initiated, the captured activity can be consolidated
                  into one handover report for review and approval.
                </p>
              </div>
            </div>

            {selectedProject.knowledge?.summary && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Current Knowledge Summary
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {selectedProject.knowledge.summary}
                </p>
              </div>
            )}

            {selectedProject.knowledge?.items?.length > 0 && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {selectedProject.knowledge.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-blue-100 bg-white/80 p-3"
                  >
                    <p className="text-xs font-bold uppercase text-blue-700">
                      {item.type}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{item.text}</p>
                    {item.source && (
                      <p className="mt-2 text-xs text-slate-400">
                        Source: {item.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 border-t border-blue-200 pt-3 text-xs leading-5 text-blue-800">
              Daily journal entries are not individually submitted for manager approval.
              The consolidated handover follows the review and approval workflow.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
