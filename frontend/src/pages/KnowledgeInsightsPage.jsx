
import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import { extractProjectKnowledge } from '../services/knowledgeService'

const STATUS_STYLES = {
  completed: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  blocker: 'bg-red-100 text-red-700',
  decision: 'bg-blue-100 text-blue-700',
  question: 'bg-violet-100 text-violet-700',
  dependency: 'bg-orange-100 text-orange-700',
  next_step: 'bg-indigo-100 text-indigo-700',
  document: 'bg-slate-100 text-slate-700',
}

const STATUS_LABELS = {
  completed: 'Completed',
  pending: 'Pending',
  blocker: 'Blocker',
  decision: 'Decision',
  question: 'Open Question',
  dependency: 'Dependency',
  next_step: 'Next Step',
  document: 'Document',
}

function getInsights(project) {
  const findings = project.knowledge?.items || []
  const journals = project.journalEntries || []
  const documents = project.documents || []
  const members = project.members || []

  const count = (type) => findings.filter((item) => item.type === type).length

  const blockers = findings.filter((item) => item.type === 'blocker')
  const pending = findings.filter((item) => item.type === 'pending')
  const questions = findings.filter((item) => item.type === 'question')

  const journalBlockers = journals.filter((entry) =>
    String(entry.blockers || '').trim(),
  )

  const journalPending = journals.filter((entry) =>
    String(entry.pendingTasks || '').trim(),
  )

  const sourceMissing = findings.filter((item) => !item.source)

  const departingMembers = members.filter((member) => member.departing)

  const observations = []

  if (blockers.length > 0) {
    observations.push({
      level: 'high',
      title: `${blockers.length} recorded blocker${blockers.length > 1 ? 's' : ''}`,
      description: blockers[0].text,
    })
  }

  if (pending.length > 0) {
    observations.push({
      level: 'medium',
      title: `${pending.length} pending knowledge item${pending.length > 1 ? 's' : ''}`,
      description: pending[0].text,
    })
  }

  if (questions.length > 0) {
    observations.push({
      level: 'medium',
      title: `${questions.length} unresolved question${questions.length > 1 ? 's' : ''}`,
      description: questions[0].text,
    })
  }

  if (sourceMissing.length > 0) {
    observations.push({
      level: 'medium',
      title: `${sourceMissing.length} findings without a recorded source`,
      description:
        'Some knowledge findings have no recorded source information.',
    })
  }

  if (observations.length === 0) {
    observations.push({
      level: 'good',
      title: 'No recorded knowledge gaps in the current findings',
      description:
        'The available knowledge records contain no blockers, pending items or open questions.',
    })
  }

  return {
    findings,
    journals,
    documents,
    members,
    completed: count('completed'),
    pending: count('pending'),
    blockers: count('blocker'),
    decisions: count('decision'),
    questions: count('question'),
    journalBlockers: journalBlockers.length,
    journalPending: journalPending.length,
    sourceMissing: sourceMissing.length,
    departingMembers,
    observations,
  }
}

function MetricCard({ label, value, description, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${color}`}
      >
        {value}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  )
}

function getSourceLabel(source) {
  if (!source) return 'No source recorded'

  if (source.source_type === 'journal') {
    return `Journal: ${source.entry_date || 'Unknown date'}`
  }

  if (source.source_type === 'document') {
    return `Document: ${source.document_name || 'Project document'}`
  }

  return 'Project source'
}

export default function KnowledgeInsightsPage() {
  const { projects, params, user, loadProjects } = useApp()

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || '',
  )

  const [extracting, setExtracting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [extractionStats, setExtractionStats] = useState(null)

  const project = projects.find((item) => item.id === selectedProjectId)

  const insights = useMemo(
    () => (project ? getInsights(project) : null),
    [project],
  )

  async function handleExtraction() {
    if (!project || !user?.accessToken) {
      setErrorMessage('Please log in again and select a project.')
      return
    }

    setExtracting(true)
    setSuccessMessage('')
    setErrorMessage('')
    setExtractionStats(null)

    try {
      const result = await extractProjectKnowledge(
        user.accessToken,
        project.id,
      )

      await loadProjects(user.accessToken)

      setExtractionStats({
        journals: result.journals_processed,
        documents: result.documents_processed,
        findings: result.findings_created,
      })

      setSuccessMessage(result.message || 'Knowledge extraction completed.')
    } catch (error) {
      setErrorMessage(error.message || 'Knowledge extraction failed.')
    } finally {
      setExtracting(false)
    }
  }

  if (!projects.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h3 className="font-semibold text-slate-800">No projects available</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create a project to view its knowledge insights.
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
            Understand project knowledge, unresolved work and documentation coverage.
          </p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          Manager Workspace
        </span>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <h3 className="font-bold text-blue-950">Select Project</h3>
        <p className="mt-1 text-sm text-blue-800">
          Insights are calculated separately from each project's available records.
        </p>

        <select
          value={selectedProjectId}
          onChange={(event) => {
            setSelectedProjectId(event.target.value)
            setSuccessMessage('')
            setErrorMessage('')
            setExtractionStats(null)
          }}
          className="mt-4 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Choose a project...</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleExtraction}
          disabled={!project || extracting}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {extracting ? 'Extracting Knowledge...' : 'Extract Knowledge'}
        </button>

        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              {successMessage}
            </p>

            {extractionStats && (
              <p className="mt-1 text-sm text-emerald-700">
                Journals processed: {extractionStats.journals} · Documents processed: {extractionStats.documents} · New findings created: {extractionStats.findings}
              </p>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}
      </section>

      {!project ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <div className="text-4xl">📊</div>
          <h3 className="mt-3 font-semibold text-slate-800">
            Select a project to view insights
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Its knowledge findings, journal activity and documentation will be analysed.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Project Knowledge Overview
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {project.name}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {project.knowledge?.summary || project.description}
            </p>
          </section>

          <section>
            <div className="mb-3">
              <h3 className="font-bold text-slate-900">Knowledge Summary</h3>
              <p className="mt-1 text-sm text-slate-500">
                Counts based on the project's recorded knowledge findings.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Completed"
                value={insights.completed}
                description="Completed findings"
                color="bg-emerald-100 text-emerald-700"
              />
              <MetricCard
                label="Pending"
                value={insights.pending}
                description="Open work items"
                color="bg-amber-100 text-amber-700"
              />
              <MetricCard
                label="Blockers"
                value={insights.blockers}
                description="Recorded obstacles"
                color="bg-red-100 text-red-700"
              />
              <MetricCard
                label="Decisions"
                value={insights.decisions}
                description="Recorded decisions"
                color="bg-blue-100 text-blue-700"
              />
              <MetricCard
                label="Questions"
                value={insights.questions}
                description="Unresolved questions"
                color="bg-violet-100 text-violet-700"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Journal Entries', value: insights.journals.length },
              { label: 'Project Documents', value: insights.documents.length },
              { label: 'Team Members', value: insights.members.length },
              { label: 'Departing Members', value: insights.departingMembers.length },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
              </div>
            ))}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900">Knowledge Health Observations</h3>
              <p className="mt-1 text-sm text-slate-500">
                Areas that may need manager attention based on available records.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {insights.observations.map((observation, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    observation.level === 'high'
                      ? 'border-red-200 bg-red-50'
                      : observation.level === 'medium'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {observation.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {observation.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">Recorded Knowledge Findings</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review the knowledge currently available for this project.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {insights.findings.length} findings
              </span>
            </div>

            {insights.findings.length === 0 ? (
              <p className="mt-5 rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                No knowledge findings are available for this project.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {insights.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[finding.type] ||
                          'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_LABELS[finding.type] || finding.type}
                      </span>

                      <span className="text-xs text-slate-500">
                        {getSourceLabel(finding.source)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {finding.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900">Journal Activity Overview</h3>
            <p className="mt-1 text-sm text-slate-500">
              Summary of issues and pending work mentioned in journal entries.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                <p className="text-2xl font-bold text-red-700">
                  {insights.journalBlockers}
                </p>
                <p className="mt-1 text-sm font-semibold text-red-900">
                  Journals mentioning blockers
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-2xl font-bold text-amber-700">
                  {insights.journalPending}
                </p>
                <p className="mt-1 text-sm font-semibold text-amber-900">
                  Journals mentioning pending tasks
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          Prototype Information
        </p>
        <p className="mt-1 text-sm leading-6 text-amber-800">
          Knowledge findings are extracted from recorded journals and supported project documents using rule-based processing. Advanced AI analysis and semantic extraction can be added in a later integration.
        </p>
      </div>
    </div>
  )
}
