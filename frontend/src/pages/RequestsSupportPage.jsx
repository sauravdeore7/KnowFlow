
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'
import {
  fetchSupportRequests,
  createSupportRequest,
} from '../services/supportService'

const REQUEST_TYPES = [
  {
    value: 'document',
    label: 'Document Access',
    description: 'Request access to a project document.',
    icon: 'fileText',
  },
  {
    value: 'blocker',
    label: 'Report a Blocker',
    description: 'Report an issue preventing your progress.',
    icon: 'alert',
  },
  {
    value: 'clarification',
    label: 'Request Clarification',
    description: 'Ask for clarification about a task or decision.',
    icon: 'help-circle',
  },
]

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Review': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function MetricCard({ label, value, icon, color, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.Pending
      }`}
    >
      {status}
    </span>
  )
}

function RequestRow({ request }) {
  const type = REQUEST_TYPES.find((item) => item.value === request.type)

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 last:border-0 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon name={type?.icon || 'clipboard'} className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {request.title}
          </h3>
          <span className="text-xs text-slate-400">
            #{request.id}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{type?.label || 'General Request'}</span>
          <span>·</span>
          <span>{request.projectName || 'Project'}</span>
          <span>·</span>
          <span>{formatDate(request.createdAt)}</span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
          {request.description}
        </p>

        {request.response && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">
              Response
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              {request.response}
            </p>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <StatusBadge status={request.status} />
        <span className="text-xs text-slate-500">
          {request.priority} priority
        </span>
      </div>
    </div>
  )
}

export default function RequestsSupportPage() {
  const { user, projects = [] } = useApp()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedType, setSelectedType] = useState('document')
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || '')
  const [selectedDocument, setSelectedDocument] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('error')

  useEffect(() => {
    let active = true

    async function loadRequests() {
      setLoading(true)

      try {
        const data = await fetchSupportRequests(user?.accessToken)

        if (!active) return

        const enrichedRequests = data.map((request) => {
          const project = projects.find(
            (item) => item.id === request.projectId,
          )

          return {
            ...request,
            projectName: project?.name || 'Project',
          }
        })

        setRequests(enrichedRequests)
      } catch (error) {
        if (active) {
          setFeedback(error.message || 'Could not load your requests.')
          setFeedbackType('error')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRequests()

    return () => {
      active = false
    }
  }, [user?.accessToken, projects])

  const currentProject = projects.find(
    (project) => project.id === selectedProject,
  )

  const projectDocuments = currentProject?.documents || []

  const counts = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'Pending').length,
    inReview: requests.filter((request) => request.status === 'In Review').length,
    resolved: requests.filter((request) => request.status === 'Resolved').length,
  }), [requests])

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesStatus =
        activeFilter === 'All' || request.status === activeFilter

      const matchesSearch =
        !query ||
        [
          request.title,
          request.description,
          request.projectName,
          request.id,
          request.type,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        )

      return matchesStatus && matchesSearch
    }).sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [requests, activeFilter, search])

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback('')

    if (!selectedProject || !currentProject) {
      setFeedback('Please select a project.')
      setFeedbackType('error')
      return
    }

    if (!title.trim() || !description.trim()) {
      setFeedback('Please complete the title and description.')
      setFeedbackType('error')
      return
    }

    if (selectedType === 'document' && !selectedDocument) {
      setFeedback('Please select the document you need access to.')
      setFeedbackType('error')
      return
    }

    const documentName =
      selectedType === 'document'
        ? projectDocuments.find((doc) => doc.id === selectedDocument)?.name || ''
        : ''

    setSubmitting(true)

    try {
      const createdRequest = await createSupportRequest(
        user?.accessToken,
        {
          type: selectedType,
          title: title.trim(),
          description: description.trim(),
          projectId: currentProject.id,
          documentName,
          priority,
        },
      )

      setRequests((previous) => [
        {
          ...createdRequest,
          projectName: currentProject.name,
        },
        ...previous,
      ])

      setTitle('')
      setDescription('')
      setSelectedDocument('')
      setPriority('Medium')
      setFeedback('Your request has been submitted successfully.')
      setFeedbackType('success')
    } catch (error) {
      setFeedback(error.message || 'Could not submit your request.')
      setFeedbackType('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Icon name="clipboard" className="h-4 w-4" />
            Work & Collaboration
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Requests & Support
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Raise project-related requests and keep track of their progress.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700">
          <Icon name="lock" className="h-4 w-4" />
          Your project workspace
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Requests"
          value={counts.total}
          icon="clipboard"
          color="bg-blue-50 text-blue-600"
          description="Requests submitted"
        />
        <MetricCard
          label="Pending"
          value={counts.pending}
          icon="clock"
          color="bg-amber-50 text-amber-600"
          description="Awaiting review"
        />
        <MetricCard
          label="In Review"
          value={counts.inReview}
          icon="search"
          color="bg-violet-50 text-violet-600"
          description="Being reviewed"
        />
        <MetricCard
          label="Resolved"
          value={counts.resolved}
          icon="checkCircle"
          color="bg-emerald-50 text-emerald-600"
          description="Completed requests"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900">
              Submit a Request
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Tell your project manager what support you need.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Request Type
              </label>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                {REQUEST_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setSelectedType(type.value)
                      setFeedback('')
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      selectedType === type.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <Icon
                      name={type.icon}
                      className={`h-5 w-5 ${
                        selectedType === type.value
                          ? 'text-blue-600'
                          : 'text-slate-500'
                      }`}
                    />
                    <p className="mt-2 text-xs font-semibold text-slate-800">
                      {type.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Project
              </label>
              <select
                value={selectedProject}
                onChange={(event) => {
                  setSelectedProject(event.target.value)
                  setSelectedDocument('')
                }}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedType === 'document' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Document
                </label>
                <select
                  value={selectedDocument}
                  onChange={(event) => setSelectedDocument(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a document</option>
                  {projectDocuments.map((doc, index) => (
                    <option
                      key={doc.id || `${doc.name}-${index}`}
                      value={doc.id || ''}
                      disabled={!doc.id}
                    >
                      {doc.name || 'Untitled document'}
                    </option>
                  ))}
                </select>
                {projectDocuments.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No documents are currently listed for this project.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Request Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={
                  selectedType === 'blocker'
                    ? 'Briefly describe the blocker'
                    : selectedType === 'clarification'
                      ? 'What do you need clarified?'
                      : 'Enter a request title'
                }
                maxLength={100}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Provide the details your manager needs to understand your request..."
                rows={4}
                maxLength={1500}
                required
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {feedback && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  feedbackType === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={projects.length === 0 || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="plus" className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900">
              My Request History
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Follow the status of requests you have submitted.
            </p>
          </div>

          <div className="space-y-4 p-5">
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your requests..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Pending', 'In Review', 'Resolved'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    activeFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submitted Requests
            </p>
            <span className="text-xs font-medium text-slate-500">
              {loading ? 'Loading...' : `${filteredRequests.length} results`}
            </span>
          </div>

          {loading ? (
            <div className="px-5 py-14 text-center text-sm text-slate-500">
              Loading your requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Icon name="clipboard" className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                No requests found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Your submitted requests will appear here.
              </p>
            </div>
          ) : (
            <div>
              {filteredRequests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Icon name="lock" className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Request privacy
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Your requests are associated with your signed-in account and
              selected project. They are stored in the KnowFlow database and
              can be reviewed by your project manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
