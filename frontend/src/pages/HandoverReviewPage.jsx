
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import {
  approveHandover,
  requestHandoverChanges,
  shareHandover,
  revokeHandoverAccess,
} from '../services/handoverService'

const DEFAULT_WISHES =
  'Thank you for your contributions to this project. We appreciate your hard work and dedication. Wishing you every success in your future endeavours!'

const DEFAULT_PERMISSIONS = {
  viewReport: true,
  viewDocuments: true,
  viewSources: true,
  downloadDocuments: false,
}

function getLines(value) {
  if (!value) return []

  const values = Array.isArray(value) ? value : [value]

  return values.flatMap((entry) => {
    if (typeof entry === 'string') {
      return entry
        .split('\n')
        .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
        .filter(Boolean)
    }

    if (entry && typeof entry === 'object') {
      const text = entry.text || entry.title || entry.description || ''
      return text ? [String(text).trim()] : []
    }

    return []
  }).filter(Boolean)
}

function formatDate(value) {
  if (!value) return 'Date not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getMemberName(member) {
  return member?.name || member?.email || 'Unknown employee'
}

function SectionHeading({ number, title, description, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white">
          {number}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

function StatusPill({ status }) {
  const styles = {
    awaiting_approval: 'bg-amber-50 text-amber-700 ring-amber-200',
    changes_requested: 'bg-orange-50 text-orange-700 ring-orange-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    shared: 'bg-blue-50 text-blue-700 ring-blue-200',
    not_started: 'bg-slate-100 text-slate-600 ring-slate-200',
  }

  const labels = {
    awaiting_approval: 'Pending Review',
    changes_requested: 'Changes Requested',
    approved: 'Approved',
    shared: 'Shared with Incoming Employee',
    not_started: 'Not Started',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.not_started}`}>
      {labels[status] || status || 'Not Started'}
    </span>
  )
}

function getCategoryData(journals) {
  const categories = [
    {
      id: 'completed',
      title: 'Completed Work',
      description: 'Work and tasks completed by the outgoing employee.',
      icon: '✓',
      field: 'completedTasks',
    },
    {
      id: 'decisions',
      title: 'Key Decisions',
      description: 'Technical and project decisions recorded during the work.',
      icon: '◇',
      field: 'decisions',
    },
    {
      id: 'pending',
      title: 'Pending Tasks',
      description: 'Tasks that still need attention or completion.',
      icon: '◷',
      field: 'pendingTasks',
    },
    {
      id: 'dependencies',
      title: 'Dependencies',
      description: 'External requirements and dependencies affecting progress.',
      icon: '↗',
      field: 'dependencies',
    },
    {
      id: 'risks',
      title: 'Risks & Blockers',
      description: 'Problems, blockers and risks recorded in the journals.',
      icon: '!',
      field: 'blockers',
    },
    {
      id: 'next',
      title: 'Recommended Next Actions',
      description: 'Suggested follow-up work recorded by the employee.',
      icon: '→',
      field: 'nextSteps',
    },
  ]

  return categories.map((category) => {
    const items = journals.flatMap((journal, journalIndex) => {
      let values = getLines(journal[category.field])

      if (category.id === 'completed' && values.length === 0) {
        values = getLines(journal.workSummary)
      }

      return values.map((text, itemIndex) => ({
        id: `${category.id}-${journal.id || journalIndex}-${itemIndex}`,
        text,
        date: journal.date || journal.createdAt,
        evidence: journal.evidence,
        journalId: journal.id,
      }))
    })

    return { ...category, items }
  })
}

export default function HandoverReviewPage() {
  const {
    projects,
    params,
    user,
    loadProjects,
    showToast,
  } = useApp()

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || '',
  )
  const [selectedOutgoingId, setSelectedOutgoingId] = useState('')
  const [selectedIncomingId, setSelectedIncomingId] = useState('')
  const [expandedCategory, setExpandedCategory] = useState('completed')
  const [goodWishes, setGoodWishes] = useState(DEFAULT_WISHES)
  const [managerFeedback, setManagerFeedback] = useState('')
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const project = useMemo(
    () => projects.find((item) => item.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  )

  const members = project?.members || []

  const outgoingMembers = useMemo(
    () => members.filter((member) => member.departing),
    [members],
  )

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(params.projectId || projects[0].id)
    }
  }, [projects, selectedProjectId, params.projectId])

  useEffect(() => {
    setSelectedOutgoingId(outgoingMembers[0]?.id || '')
    setSelectedIncomingId('')
    setExpandedCategory('completed')
    setError('')
  }, [selectedProjectId])

  const outgoingEmployee = useMemo(
    () =>
      outgoingMembers.find((member) => member.id === selectedOutgoingId) ||
      outgoingMembers[0] ||
      null,
    [outgoingMembers, selectedOutgoingId],
  )

  const incomingMembers = useMemo(
    () =>
      members.filter((member) => {
        const role = String(member.role || '').toLowerCase()

        return (
          !member.departing &&
          member.id !== outgoingEmployee?.id &&
          !role.includes('manager') &&
          member.email !== user?.email
        )
      }),
    [members, outgoingEmployee, user?.email],
  )

  const journals = useMemo(() => {
    if (!project || !outgoingEmployee) return []

    return (project.journalEntries || [])
      .filter((entry) => {
        const author = String(entry.createdBy || '').toLowerCase()

        return (
          author === String(outgoingEmployee.name || '').toLowerCase() ||
          author === String(outgoingEmployee.email || '').toLowerCase() ||
          author === String(outgoingEmployee.id || '').toLowerCase()
        )
      })
      .sort(
        (a, b) =>
          new Date(a.date || a.createdAt || 0) -
          new Date(b.date || b.createdAt || 0),
      )
  }, [project, outgoingEmployee])

  const categories = useMemo(() => getCategoryData(journals), [journals])

  const totalKnowledgeItems = categories.reduce(
    (total, category) => total + category.items.length,
    0,
  )

  const attentionCount =
    (categories.find((category) => category.id === 'pending')?.items.length || 0) +
    (categories.find((category) => category.id === 'risks')?.items.length || 0)

  const documents = project?.documents || []
  const review = project?.handoverReview || {}
  const handoverId = review.id || review.handoverId

  const access = review.access || {}
  const employeeConfirmation = review.employeeConfirmation || {}

  const isEmployeeConfirmed = Boolean(
    employeeConfirmation.confirmedAt ||
    employeeConfirmation.status === 'confirmed',
  )

  const isApproved = Boolean(
    review.approvedAt ||
    project?.handoverStatus === 'approved',
  )

  const isShared = Boolean(
    review.sharedAt &&
    access.status === 'active' &&
    !access.revokedAt,
  )

  const currentStatus = isShared
    ? 'shared'
    : project?.handoverStatus || 'not_started'

  useEffect(() => {
    setGoodWishes(review.goodWishes || DEFAULT_WISHES)
    setManagerFeedback(review.managerFeedback || '')
    setPermissions({
      ...DEFAULT_PERMISSIONS,
      ...(review.permissions || {}),
    })
    setSelectedIncomingId(review.incomingEmployeeId || '')
  }, [selectedProjectId])

  const refreshProject = async () => {
    await loadProjects(user?.accessToken)
  }

  const performAction = async (action, successMessage) => {
    if (!handoverId) {
      setError('Handover record ID is missing. Please refresh the page.')
      return false
    }

    setBusy(true)
    setError('')

    try {
      await action()
      await refreshProject()

      showToast?.(successMessage, 'success')
      return true
    } catch (actionError) {
      const message =
        actionError?.message ||
        'The handover action could not be completed.'

      setError(message)
      showToast?.(message, 'error')
      return false
    } finally {
      setBusy(false)
    }
  }

  const handleAccept = async () => {
    if (!isEmployeeConfirmed) {
      setError('The outgoing employee must confirm the handover first.')
      return
    }

    if (!journals.length) {
      setError('No journal entries were found for the outgoing employee.')
      return
    }

    if (!goodWishes.trim()) {
      setError('Please enter a good-wishes message before approving.')
      return
    }

    const success = await performAction(
      () =>
        approveHandover(
          user?.accessToken,
          handoverId,
          goodWishes.trim(),
        ),
      'Handover approved successfully.',
    )

    if (success) {
      setManagerFeedback('')
    }
  }

  const handleRequestChanges = async () => {
    if (!managerFeedback.trim()) {
      setError('Please describe the changes required.')
      return
    }

    const success = await performAction(
      () =>
        requestHandoverChanges(
          user?.accessToken,
          handoverId,
          managerFeedback.trim(),
        ),
      'Handover returned to the employee for corrections.',
    )

    if (success) {
      setSelectedIncomingId('')
    }
  }

  const handleShare = async () => {
    const incomingEmployee = incomingMembers.find(
      (member) => member.id === selectedIncomingId,
    )

    if (!isApproved) {
      setError('Approve the handover before sharing it.')
      return
    }

    if (!incomingEmployee) {
      setError('Please select an incoming employee.')
      return
    }

    if (!permissions.viewReport) {
      setError('Report access must be enabled before sharing.')
      return
    }

    await performAction(
      () =>
        shareHandover(
          user?.accessToken,
          handoverId,
          incomingEmployee.id,
          permissions,
        ),
      `Approved handover shared with ${getMemberName(incomingEmployee)}.`,
    )
  }

  const handleRevoke = async () => {
    await performAction(
      () => revokeHandoverAccess(user?.accessToken, handoverId),
      'Incoming employee access has been revoked.',
    )
  }

  const togglePermission = (key) => {
    setPermissions((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">
          No projects available
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Projects assigned to your manager account will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              Manager Workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Handover Review
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Review project knowledge, provide feedback, approve the handover
              and manage incoming employee access.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium text-blue-100">
            Project Knowledge Transfer
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <label
          className="mb-2 block text-sm font-bold text-slate-800"
          htmlFor="handover-project"
        >
          Select Project
        </label>
        <select
          id="handover-project"
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Choose a project...</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </section>

      {project && (
        <>
          {/* Overview */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Handover Overview
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {project.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review the submitted knowledge transfer for this project.
                </p>
              </div>
              <StatusPill status={currentStatus} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Outgoing Employee</p>
                <p className="mt-2 font-bold text-slate-900">
                  {outgoingEmployee ? getMemberName(outgoingEmployee) : 'Not assigned'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {outgoingEmployee?.role || 'No departing member marked'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Journal Entries</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{journals.length}</p>
                <p className="mt-1 text-xs text-slate-500">From outgoing employee</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Knowledge Items</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{totalKnowledgeItems}</p>
                <p className="mt-1 text-xs text-slate-500">Organised from journals</p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Items Needing Attention</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">{attentionCount}</p>
                <p className="mt-1 text-xs text-slate-500">Pending tasks and blockers</p>
              </div>
            </div>

            {outgoingMembers.length > 1 && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="outgoing-employee">
                  Select outgoing employee
                </label>
                <select
                  id="outgoing-employee"
                  value={outgoingEmployee?.id || ''}
                  onChange={(event) => setSelectedOutgoingId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800"
                >
                  {outgoingMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getMemberName(member)} — {member.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {project.handoverStatus === 'changes_requested' && review.managerFeedback && (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-bold text-orange-800">Previous Manager Feedback</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-orange-900">
                  {review.managerFeedback}
                </p>
                <p className="mt-2 text-xs text-orange-700">
                  Waiting for the outgoing employee to correct and resubmit the handover.
                </p>
              </div>
            )}

            {!outgoingEmployee && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No project member is currently marked as departing.
              </div>
            )}

            {!handoverId && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                The handover record ID is missing. Refresh the project data before taking action.
              </div>
            )}
          </section>

          {/* Handover report */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              number="1"
              title="Handover Report"
              description="Inspect the outgoing employee's recorded work and knowledge."
              right={
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Journal-based details
                </span>
              }
            />

            {!outgoingEmployee || journals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="font-semibold text-slate-700">No outgoing employee journal details found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Journal entries belonging to the departing employee will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => {
                  const isExpanded = expandedCategory === category.id

                  return (
                    <div
                      key={category.id}
                      className={`overflow-hidden rounded-xl border transition ${
                        isExpanded ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? '' : category.id)}
                        className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-700">
                            {category.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900">{category.title}</p>
                            <p className="mt-1 text-xs text-slate-500">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                          </span>
                          <span className="text-lg text-slate-500">{isExpanded ? '−' : '+'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-white p-4">
                          {category.items.length === 0 ? (
                            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                              No entries in this category were recorded.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {category.items.map((item, index) => (
                                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                  <div className="flex items-start gap-3">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                      {index + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm leading-6 text-slate-800">{item.text}</p>
                                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <span className="rounded-md bg-slate-100 px-2 py-1">Journal entry</span>
                                        <span>{formatDate(item.date)}</span>
                                      </div>
                                      {item.evidence && (
                                        <p className="mt-2 text-xs text-slate-500">
                                          <strong>Evidence noted:</strong> {item.evidence}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              These details are organised from the outgoing employee's journal entries. They are not independently verified AI findings. Review the supporting information before making a decision.
            </div>
          </section>

          {/* Supporting documents */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              number="2"
              title="Supporting Documents"
              description="Project documents registered in Document Centre."
              right={
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {documents.length} documents
                </span>
              }
            />

            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                No project documents are currently registered.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {documents.map((document) => (
                  <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700">
                        {String(document.type || 'FILE').slice(0, 4).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-semibold text-slate-800">{document.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Uploaded by {document.uploadedBy || 'Unknown'} · {document.sizeKb || '—'} KB
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      Stored in Document Centre
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">
              Document records are displayed here. Document download permissions are managed separately through the document service.
            </div>
          </section>

          {/* Manager decision */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeading
              number="3"
              title="Manager Review & Decision"
              description="Approve the submitted handover or return it with correction instructions."
            />

            <div className={`mb-5 rounded-xl border p-4 ${
              isEmployeeConfirmed
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isEmployeeConfirmed ? '✓' : '◷'}</span>
                <p className={`text-sm font-bold ${
                  isEmployeeConfirmed ? 'text-emerald-900' : 'text-amber-900'
                }`}>
                  {isEmployeeConfirmed
                    ? 'Employee Confirmation Received'
                    : 'Waiting for Employee Confirmation'}
                </p>
              </div>

              {isEmployeeConfirmed ? (
                <>
                  <p className="mt-2 text-xs text-emerald-800">
                    Confirmed by {employeeConfirmation.confirmedBy || 'Outgoing Employee'}
                    {' · '}
                    {formatDate(employeeConfirmation.confirmedAt)}
                  </p>

                  {employeeConfirmation.employeeResponse && (
                    <div className="mt-3 rounded-lg bg-white p-3">
                      <p className="text-xs font-semibold text-slate-600">Employee Response</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {employeeConfirmation.employeeResponse}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-amber-800">
                  The outgoing employee must confirm the handover before manager approval becomes available.
                </p>
              )}
            </div>

            {isApproved ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">✓</span>
                  <div>
                    <p className="font-bold text-emerald-900">Handover Approved</p>
                    <p className="text-xs text-emerald-700">
                      Approved by {review.approvedBy || 'Manager'}
                      {review.approvedAt ? ` · ${formatDate(review.approvedAt)}` : ''}
                    </p>
                  </div>
                </div>

                {review.goodWishes && (
                  <div className="mt-4 rounded-lg bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Good Wishes Sent</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {review.goodWishes}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-emerald-800">
                  The handover is approved. Manage incoming employee access below.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-lg font-bold text-emerald-700">✓</span>
                    <div>
                      <h3 className="font-bold text-slate-900">Accept Handover</h3>
                      <p className="text-xs text-slate-500">Approve the submitted knowledge transfer.</p>
                    </div>
                  </div>

                  <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700" htmlFor="good-wishes">
                    Good-wishes message
                  </label>
                  <textarea
                    id="good-wishes"
                    rows={5}
                    value={goodWishes}
                    onChange={(event) => setGoodWishes(event.target.value)}
                    className="w-full resize-y rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={
                      busy ||
                      !handoverId ||
                      !outgoingEmployee ||
                      journals.length === 0 ||
                      !isEmployeeConfirmed ||
                      !goodWishes.trim()
                    }
                    className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Processing...' : 'Accept Handover'}
                  </button>

                  {!isEmployeeConfirmed && (
                    <p className="mt-3 text-xs leading-5 text-amber-700">
                      Approval becomes available after employee confirmation.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-lg font-bold text-orange-700">↩</span>
                    <div>
                      <h3 className="font-bold text-slate-900">Request Corrections</h3>
                      <p className="text-xs text-slate-500">Return the handover with specific feedback.</p>
                    </div>
                  </div>

                  <label className="mb-2 mt-5 block text-sm font-semibold text-slate-700" htmlFor="manager-feedback">
                    Feedback for outgoing employee <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="manager-feedback"
                    rows={5}
                    value={managerFeedback}
                    onChange={(event) => setManagerFeedback(event.target.value)}
                    placeholder="Explain what is missing, unclear or needs correction..."
                    className="w-full resize-y rounded-xl border border-orange-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />

                  <button
                    type="button"
                    onClick={handleRequestChanges}
                    disabled={busy || !handoverId || !managerFeedback.trim()}
                    className="mt-4 w-full rounded-xl border border-orange-300 bg-white px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? 'Processing...' : 'Send Back for Corrections'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Access and sharing */}
          <section className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
            <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 sm:p-6">
              <SectionHeading
                number="4"
                title="Handover Access & Permissions"
                description="Choose who receives the approved handover and what they can access."
                right={
                  isApproved ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Approval Complete</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Available After Approval</span>
                  )
                }
              />
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {!isApproved ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="font-semibold text-slate-700">Sharing is not available yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Approve the handover before selecting an incoming employee.
                  </p>
                </div>
              ) : (
                <>
                  {isShared && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="font-bold text-blue-900">Handover Shared</p>
                      <p className="mt-1 text-sm text-blue-800">
                        Shared with {review.incomingEmployeeName || 'the selected incoming employee'}
                        {review.sharedAt ? ` on ${formatDate(review.sharedAt)}` : ''}.
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                        Active Access
                      </span>
                    </div>
                  )}

                  {access.revokedAt && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="font-bold text-rose-900">Access Revoked</p>
                      <p className="mt-1 text-sm text-rose-800">
                        Access was revoked on {formatDate(access.revokedAt)}.
                      </p>
                    </div>
                  )}

                  <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Recipient Assignment</p>
                      <h3 className="text-base font-bold text-slate-900">Select Incoming Employee</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Choose the team member who will receive this approved handover.
                      </p>
                    </div>

                    <select
                      id="incoming-employee"
                      value={selectedIncomingId}
                      onChange={(event) => setSelectedIncomingId(event.target.value)}
                      disabled={isShared}
                      className="w-full rounded-xl border-2 border-blue-400 bg-white px-4 py-3.5 text-sm font-semibold text-blue-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-100"
                    >
                      <option value="">Choose an incoming employee...</option>
                      {incomingMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {getMemberName(member)} — {member.role}
                        </option>
                      ))}
                    </select>

                    {incomingMembers.length === 0 && (
                      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        No eligible incoming employee is available in this project's member list.
                      </p>
                    )}

                    {isShared && (
                      <p className="mt-3 text-xs text-blue-700">
                        Revoke access before assigning a different employee.
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Access Permissions</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Choose which handover resources the incoming employee can access.
                    </p>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          key: 'viewReport',
                          title: 'View Handover Report',
                          description: 'Read the approved project handover summary.',
                        },
                        {
                          key: 'viewDocuments',
                          title: 'View Supporting Documents',
                          description: 'Access project documents included as handover references.',
                        },
                        {
                          key: 'viewSources',
                          title: 'View Knowledge Sources',
                          description: 'See the journal dates and source references behind report items.',
                        },
                        {
                          key: 'downloadDocuments',
                          title: 'Download Shared Documents',
                          description: 'Allow downloads of documents made available to the employee.',
                        },
                      ].map((permission) => (
                        <label
                          key={permission.key}
                          className={`flex gap-3 rounded-xl border p-4 transition ${
                            permissions[permission.key] ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-white'
                          } ${isShared ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(permissions[permission.key])}
                            onChange={() => togglePermission(permission.key)}
                            disabled={isShared}
                            className="mt-1 h-4 w-4 accent-blue-600"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{permission.title}</span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">{permission.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-bold text-slate-800">Restricted Actions</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        'Edit or modify the approved handover',
                        'Delete handover records',
                        'Change project permissions',
                        'Access private employee journals',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700">×</span>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-bold text-blue-900">Access Summary</p>
                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      The incoming employee receives access to the approved handover according to the permissions selected above. Access can be revoked by the manager.
                    </p>
                  </div>

                  {!isShared ? (
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={
                        busy ||
                        !handoverId ||
                        !selectedIncomingId ||
                        !permissions.viewReport
                      }
                      className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? 'Sharing...' : 'Share Approved Handover'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRevoke}
                      disabled={busy || !handoverId}
                      className="w-full rounded-xl border border-rose-300 bg-white px-5 py-3.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busy ? 'Revoking...' : 'Revoke Incoming Employee Access'}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}
