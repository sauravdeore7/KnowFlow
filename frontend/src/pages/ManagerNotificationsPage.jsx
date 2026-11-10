
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'
import { fetchSupportRequests } from '../services/supportService'

const READ_STORAGE_KEY = 'knowflow-manager-notification-reads'

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

function timeAgo(value) {
  if (!value) return 'Recently'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Recently'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return formatDate(value)
}

function getReadIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function getRequestType(type) {
  const labels = {
    document: 'Document access request',
    blocker: 'Blocker reported',
    clarification: 'Clarification requested',
  }

  return labels[type] || 'Employee support request'
}

function getPriorityStyle(priority) {
  const value = String(priority || '').toLowerCase()

  if (value === 'high' || value === 'urgent') {
    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (value === 'medium') {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }

  if (value === 'low') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }

  return 'bg-slate-50 text-slate-600 border-slate-200'
}

function createNotifications(projects, requests, readIds) {
  const notifications = []

  projects.forEach((project) => {
    const review = project.handoverReview || {}
    const employeeConfirmation = review.employeeConfirmation || {}

    if (
      project.handoverStatus === 'awaiting_approval' &&
      employeeConfirmation.confirmedAt
    ) {
      notifications.push({
        id: `handover-${project.id}-${employeeConfirmation.confirmedAt}`,
        type: 'handover',
        category: 'handovers',
        title: 'Handover awaiting your review',
        message: `${employeeConfirmation.confirmedBy || 'An employee'} has confirmed the handover for ${project.name}. Review it before approving or requesting changes.`,
        employee: employeeConfirmation.confirmedBy || 'Employee',
        project,
        timestamp: employeeConfirmation.confirmedAt,
        actionLabel: 'Review Handover',
        actionPage: 'review',
      })
    }
  })

  requests
    .filter((request) => request.status === 'Pending')
    .forEach((request) => {
      const project = projects.find(
        (item) => item.id === request.projectId
      )

      if (!project) return

      const member = project.members?.find(
        (item) => item.id === request.submittedById
      )

      const employee = member?.email || request.submittedById || 'Employee'

      notifications.push({
        id: `request-${request.id}`,
        type: 'request',
        category: 'requests',
        title: getRequestType(request.type),
        message: `${employee} submitted "${request.title || 'a support request'}" for ${project.name}.`,
        employee,
        description: request.description || '',
        priority: request.priority || '',
        documentName: request.documentName || '',
        requestType: request.type,
        project,
        timestamp: request.createdAt,
        actionLabel: 'View Request',
        actionPage: 'manager-requests-support',
      })
    })

  return notifications
    .map((notification) => ({
      ...notification,
      read: readIds.includes(notification.id),
    }))
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    )
}

function getNotificationIcon(type) {
  if (type === 'handover') return 'clipboard'
  if (type === 'request') return 'alert'
  return 'bell'
}

function getNotificationStyle(type) {
  if (type === 'handover') return 'bg-violet-50 text-violet-700'
  if (type === 'request') return 'bg-blue-50 text-blue-700'
  return 'bg-slate-100 text-slate-700'
}

function MetricCard({ label, value, description, icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>

        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  )
}

function NotificationCard({ notification, onRead, onOpen }) {
  const isHandover = notification.type === 'handover'

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 transition hover:shadow-md ${
        notification.read
          ? 'border-slate-200 bg-white'
          : 'border-blue-200 bg-blue-50/40'
      }`}
    >
      {!notification.read && (
        <span className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600" />
      )}

      <div className="flex items-start gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getNotificationStyle(notification.type)}`}
        >
          <Icon
            name={getNotificationIcon(notification.type)}
            className="h-5 w-5"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {notification.title}
                </h3>

                {!notification.read && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    Unread
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {notification.message}
              </p>
            </div>

            {notification.priority && (
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getPriorityStyle(notification.priority)}`}>
                {notification.priority} priority
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              <Icon name="user" className="h-3.5 w-3.5 text-slate-400" />
              {notification.employee}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              <Icon name="folder" className="h-3.5 w-3.5 text-slate-400" />
              {notification.project.name}
            </span>

            {notification.documentName && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200">
                <Icon name="file" className="h-3.5 w-3.5 text-slate-400" />
                {notification.documentName}
              </span>
            )}

            <span className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              isHandover
                ? 'bg-violet-50 text-violet-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              {isHandover ? 'Handover' : 'Employee Request'}
            </span>
          </div>

          {notification.description && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Request Details
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {notification.description}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <span>{timeAgo(notification.timestamp)}</span>

            {notification.timestamp && (
              <>
                <span>·</span>
                <span>{formatDate(notification.timestamp)}</span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200/70 pt-4">
            <button
              type="button"
              onClick={() => onOpen(notification)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800"
            >
              {notification.actionLabel}
              <Icon name="arrowLeft" className="h-3.5 w-3.5 rotate-180" />
            </button>

            {!notification.read && (
              <button
                type="button"
                onClick={() => onRead(notification.id)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function ManagerNotificationsPage() {
  const { projects = [], navigate, showToast, user } = useApp()

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [readIds, setReadIds] = useState(getReadIds)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')

  const refreshNotifications = useCallback(async (showMessage = false) => {
    if (!user?.accessToken) {
      setRequests([])
      setLoadError('Authentication token is missing. Please log in again.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')

    try {
      const data = await fetchSupportRequests(user.accessToken)
      setRequests(data)
      setReadIds(getReadIds())
      setRefreshKey((current) => current + 1)

      if (showMessage) {
        showToast('Notifications refreshed.', 'success')
      }
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [user?.accessToken, showToast])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  const notifications = useMemo(
    () => createNotifications(projects, requests, readIds),
    [projects, requests, readIds, refreshKey]
  )

  const unreadCount = notifications.filter((item) => !item.read).length
  const handoverCount = notifications.filter((item) => item.category === 'handovers').length
  const requestCount = notifications.filter((item) => item.category === 'requests').length

  const filterCounts = {
    all: notifications.length,
    unread: unreadCount,
    handovers: handoverCount,
    requests: requestCount,
  }

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase()

    return notifications.filter((notification) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'unread' && !notification.read) ||
        notification.category === activeFilter

      const searchableText = [
        notification.title,
        notification.message,
        notification.project.name,
        notification.employee,
        notification.description,
        notification.documentName,
      ]
        .join(' ')
        .toLowerCase()

      return matchesFilter && searchableText.includes(query)
    })
  }, [notifications, activeFilter, search])

  function markAsRead(id) {
    setReadIds((current) => {
      const updated = current.includes(id) ? current : [...current, id]

      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Keep current session state if storage is unavailable.
      }

      return updated
    })
  }

  function markAllAsRead() {
    const allIds = notifications.map((item) => item.id)

    setReadIds((current) => {
      const updated = [...new Set([...current, ...allIds])]

      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Keep current session state if storage is unavailable.
      }

      return updated
    })

    showToast('All notifications marked as read.', 'success')
  }

  function openNotification(notification) {
    markAsRead(notification.id)

    if (notification.actionPage === 'review') {
      navigate('review', {
        projectId: notification.project.id,
      })
      return
    }

    navigate('manager-requests-support')
  }

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'handovers', label: 'Handovers' },
    { id: 'requests', label: 'Employee Requests' },
  ]

  return (
    <div className="space-y-7">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Manager Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Stay informed about employee requests and handovers that need your attention.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refreshNotifications(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          >
            <Icon name="refresh-cw" className="h-4 w-4" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="All Notifications"
          value={notifications.length}
          description="Items requiring manager attention"
          icon="bell"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <MetricCard
          label="Unread"
          value={unreadCount}
          description="Waiting for your attention"
          icon="alert"
          iconStyle="bg-amber-50 text-amber-700"
        />

        <MetricCard
          label="Handover Alerts"
          value={handoverCount}
          description="Employee-confirmed handovers"
          icon="clipboard"
          iconStyle="bg-violet-50 text-violet-700"
        />

        <MetricCard
          label="Employee Requests"
          value={requestCount}
          description="New requests submitted"
          icon="folder"
          iconStyle="bg-emerald-50 text-emerald-700"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Manager Activity Feed
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review incoming requests and employee-confirmed handovers.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark all as read
            </button>
          </div>

          <div className="relative mt-5">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by employee, project, request or details..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition ${
                  activeFilter === filter.id
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {filter.label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    activeFilter === filter.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {filterCounts[filter.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loadError && (
            <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          )}

          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {filteredNotifications.length}{' '}
                {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {activeFilter === 'all'
                  ? 'Showing all activity'
                  : `Filtered by ${filters.find((item) => item.id === activeFilter)?.label}`}
              </p>
            </div>

            <span className="text-xs text-slate-400">
              Newest first
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center text-sm text-slate-500">
              Loading notifications...
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onOpen={openNotification}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon name="bell" className="h-7 w-7" />
              </span>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                {notifications.length === 0
                  ? 'You’re all caught up'
                  : 'No matching notifications'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {notifications.length === 0
                  ? 'New employee requests and confirmed handovers will appear here when they need your attention.'
                  : 'Try another filter or search term to find the notification you need.'}
              </p>

              {(search || activeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveFilter('all')
                  }}
                  className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 hover:text-blue-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
            <Icon name="lock" className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              Workspace Notifications
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Employee requests are retrieved from the KnowFlow database
              through the authenticated backend. Handover alerts use project
              handover activity. Notification read states are stored locally.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
