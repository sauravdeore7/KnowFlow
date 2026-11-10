
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'
import {
  fetchSupportRequests,
  updateSupportRequest,
} from '../services/supportService'

const REQUEST_TYPES = [
  { value: 'document', label: 'Document Access', icon: 'fileText' },
  { value: 'blocker', label: 'Report a Blocker', icon: 'alert' },
  { value: 'clarification', label: 'Request Clarification', icon: 'clipboard' },
]

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Review': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const PRIORITY_STYLES = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function normalizePriority(value) {
  const priority = String(value || 'Medium').toLowerCase()

  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function enrichRequest(request, projects) {
  const project = projects.find(
    (item) => item.id === request.projectId
  )

  const member = project?.members?.find(
    (item) => item.id === request.submittedById
  )

  return {
    ...request,
    recordKey: request.id,
    projectName: project?.name || 'Unknown project',
    submittedBy: member?.email || request.submittedById || 'Unknown employee',
    submittedByName: member?.name || 'Unknown employee',
    priority: normalizePriority(request.priority),
  }
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

function RequestTypeLabel({ type }) {
  const requestType = REQUEST_TYPES.find((item) => item.value === type)

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      <Icon name={requestType?.icon || 'clipboard'} className="h-4 w-4" />
      {requestType?.label || 'General Request'}
    </span>
  )
}

export default function ManagerRequestsSupportPage() {
  const { projects = [], user } = useApp()

  const [requests, setRequests] = useState([])
  const [selectedKey, setSelectedKey] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [projectFilter, setProjectFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [employeeFilter, setEmployeeFilter] = useState('All')
  const [responseDraft, setResponseDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState('Pending')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  const refreshRequests = useCallback(async () => {
    if (!user?.accessToken) {
      setRequests([])
      setLoading(false)
      setLoadError('Authentication token is missing. Please log in again.')
      return
    }

    setLoading(true)
    setLoadError('')

    try {
      const data = await fetchSupportRequests(user.accessToken)

      const enriched = data
        .map((request) => enrichRequest(request, projects))
        .sort(
          (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )

      setRequests(enriched)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [user?.accessToken, projects])

  useEffect(() => {
    refreshRequests()
  }, [refreshRequests])

  const counts = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((item) => item.status === 'Pending').length,
    inReview: requests.filter((item) => item.status === 'In Review').length,
    resolved: requests.filter((item) => item.status === 'Resolved').length,
  }), [requests])

  const employees = useMemo(() => {
    return [...new Set(
      requests.map((item) => item.submittedBy).filter(Boolean)
    )].sort()
  }, [requests])

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesSearch =
        !query ||
        [
          request.title,
          request.description,
          request.projectName,
          request.submittedBy,
          request.submittedByName,
          request.id,
          request.documentName,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        )

      const matchesStatus =
        statusFilter === 'All' || request.status === statusFilter

      const matchesProject =
        projectFilter === 'All' || request.projectId === projectFilter

      const matchesType =
        typeFilter === 'All' || request.type === typeFilter

      const matchesPriority =
        priorityFilter === 'All' || request.priority === priorityFilter

      const matchesEmployee =
        employeeFilter === 'All' || request.submittedBy === employeeFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject &&
        matchesType &&
        matchesPriority &&
        matchesEmployee
      )
    })
  }, [
    requests,
    search,
    statusFilter,
    projectFilter,
    typeFilter,
    priorityFilter,
    employeeFilter,
  ])

  const selectedRequest = filteredRequests.find(
    (request) => request.recordKey === selectedKey
  )

  useEffect(() => {
    if (selectedRequest) {
      setResponseDraft(selectedRequest.response || '')
      setStatusDraft(selectedRequest.status || 'Pending')
      setFeedback('')
    }
  }, [selectedKey, requests])

  async function saveChanges() {
    if (!selectedRequest || saving) return

    setSaving(true)
    setFeedback('')

    try {
      const updated = await updateSupportRequest(
        user?.accessToken,
        selectedRequest.id,
        {
          response: responseDraft.trim(),
          status: statusDraft,
        },
      )

      const savedRequest = enrichRequest(
        updated || {
          ...selectedRequest,
          response: responseDraft.trim(),
          status: statusDraft,
          updatedAt: new Date().toISOString(),
        },
        projects,
      )

      setRequests((current) =>
        current.map((request) =>
          request.id === selectedRequest.id
            ? savedRequest
            : request
        )
      )

      setFeedback('Request updated successfully.')
    } catch (error) {
      setFeedback(error.message || 'Unable to update this request.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Icon name="clipboard" className="h-4 w-4" />
            Manager Workspace
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Requests & Support
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review employee requests, respond to concerns and manage their progress.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshRequests}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Icon name="search" className="h-4 w-4" />
          {loading ? 'Refreshing...' : 'Refresh Requests'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Requests"
          value={counts.total}
          icon="clipboard"
          color="bg-blue-50 text-blue-600"
          description="Received from employees"
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
          description="Currently being reviewed"
        />
        <MetricCard
          label="Resolved"
          value={counts.resolved}
          icon="checkCircle"
          color="bg-emerald-50 text-emerald-600"
          description="Requests completed"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Employee Request Inbox
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Find and filter requests submitted across your projects.
          </p>
        </div>

        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="relative sm:col-span-2 xl:col-span-3">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, employee, project or request ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="All">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="All">All Employees</option>
            {employees.map((employee) => (
              <option key={employee} value={employee}>
                {employee}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="All">All Request Types</option>
            {REQUEST_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {loadError && (
          <div className="m-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        <div className="grid min-h-[440px] xl:grid-cols-[1fr_1fr]">
          <div className="border-b border-slate-200 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Requests
              </p>
              <span className="text-xs font-medium text-slate-500">
                {filteredRequests.length} results
              </span>
            </div>

            {loading ? (
              <div className="px-5 py-16 text-center text-sm text-slate-500">
                Loading employee requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <Icon
                  name="clipboard"
                  className="mx-auto h-9 w-9 text-slate-300"
                />
                <h3 className="mt-3 font-semibold text-slate-900">
                  No requests found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Employee requests will appear here when available.
                </p>
              </div>
            ) : (
              <div className="max-h-[650px] overflow-y-auto">
                {filteredRequests.map((request) => {
                  const active = selectedKey === request.recordKey

                  return (
                    <button
                      key={request.recordKey}
                      type="button"
                      onClick={() => setSelectedKey(request.recordKey)}
                      className={`w-full border-b border-slate-100 p-5 text-left transition last:border-0 ${
                        active
                          ? 'bg-blue-50/80'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {request.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {request.submittedByName} · {request.submittedBy}
                          </p>
                        </div>

                        <StatusBadge status={request.status} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <RequestTypeLabel type={request.type} />
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-500">
                          {request.projectName}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          PRIORITY_STYLES[request.priority] || PRIORITY_STYLES.Medium
                        }`}>
                          {request.priority} Priority
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-5">
            {!selectedRequest ? (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Icon name="fileText" className="h-7 w-7" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">
                  Request Details
                </h3>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  Select a request from the inbox to review its details and respond.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      {selectedRequest.id}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      {selectedRequest.title}
                    </h3>
                  </div>
                  <StatusBadge status={selectedRequest.status} />
                </div>

                <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Submitted by</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {selectedRequest.submittedByName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedRequest.submittedBy}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Project</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedRequest.projectName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Request type</p>
                    <div className="mt-1">
                      <RequestTypeLabel type={selectedRequest.type} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Priority</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedRequest.priority}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500">Submitted on</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>

                {selectedRequest.documentName && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700">
                      Requested document
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-900">
                      {selectedRequest.documentName}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Employee Message
                  </h4>
                  <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                    {selectedRequest.description}
                  </p>
                </div>

                {selectedRequest.response && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold text-emerald-700">
                      Previous Manager Response
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-900">
                      {selectedRequest.response}
                    </p>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-200 pt-5">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Manager Response & Status
                  </h4>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Update Status
                    </label>
                    <select
                      value={statusDraft}
                      onChange={(event) => setStatusDraft(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Response to Employee
                    </label>
                    <textarea
                      value={responseDraft}
                      onChange={(event) => setResponseDraft(event.target.value)}
                      rows={4}
                      maxLength={1500}
                      placeholder="Write a response or update for the employee..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {feedback && (
                    <p className={`rounded-lg px-3 py-2 text-sm ${
                      feedback.includes('successfully')
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {feedback}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Icon name="checkCircle" className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Response & Status'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Icon name="lock" className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Secure Project Support
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Employee requests, manager responses and status updates are
              stored in the KnowFlow database and retrieved through the
              authenticated backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
