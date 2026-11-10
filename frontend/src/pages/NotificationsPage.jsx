
import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'

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

function getNotificationIcon(type) {
  const icons = {
    document: 'fileText',
    journal: 'bookOpen',
    knowledge: 'sparkles',
    handover: 'clipboard',
    project: 'folder',
  }

  return icons[type] || 'alert'
}

function getNotificationStyle(type) {
  const styles = {
    document: 'bg-blue-50 text-blue-700',
    journal: 'bg-emerald-50 text-emerald-700',
    knowledge: 'bg-violet-50 text-violet-700',
    handover: 'bg-amber-50 text-amber-700',
    project: 'bg-slate-100 text-slate-700',
  }

  return styles[type] || 'bg-slate-100 text-slate-700'
}

function createNotifications(projects, user) {
  const notifications = []

  projects.forEach((project) => {
    const currentMember = project.members?.find(
      (member) => member.email === user?.email
    )

    if (!currentMember) return

    // Documents uploaded by other team members.
    ;(project.documents || []).forEach((document) => {
      if (document.uploadedBy === currentMember.name) return

      notifications.push({
        id: `document-${project.id}-${document.id}`,
        type: 'document',
        category: 'projects',
        title: 'Project document available',
        message: `${document.uploadedBy} shared "${document.name}" with the project.`,
        project,
        source: document.name,
        timestamp: document.uploadedAt,
        actionLabel: 'View Project',
        read: false,
      })
    })

    // Journal submissions from other team members.
    ;(project.journalEntries || []).forEach((journal) => {
      if (journal.createdBy === currentMember.name) return

      notifications.push({
        id: `journal-${project.id}-${journal.id}`,
        type: 'journal',
        category: 'journal',
        title: 'Team journal submitted',
        message: `${journal.createdBy} submitted a work journal: ${journal.workSummary || 'New work activity recorded.'}`,
        project,
        source: journal.id,
        timestamp: journal.createdAt || journal.date,
        actionLabel: 'View Project',
        read: false,
      })
    })

    // Knowledge records are included as project-level updates.
    ;(project.knowledge?.items || []).forEach((knowledge) => {
      notifications.push({
        id: `knowledge-${project.id}-${knowledge.id}`,
        type: 'knowledge',
        category: 'projects',
        title: 'Project knowledge recorded',
        message: knowledge.text,
        project,
        source: knowledge.source,
        timestamp: project.updatedAt,
        actionLabel: 'View Project',
        read: false,
      })
    })

    // Handover status notification when an approval state is recorded.
    if (project.handoverStatus === 'approved') {
      notifications.push({
        id: `handover-${project.id}`,
        type: 'handover',
        category: 'projects',
        title: 'Project handover approved',
        message: `The handover for ${project.name} has been marked as approved.`,
        project,
        timestamp: project.updatedAt,
        actionLabel: 'View Project',
        read: false,
      })
    }
  })

  return notifications.sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  )
}

function MetricCard({ label, value, description, icon, iconStyle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
  const { project } = notification

  return (
    <article
      className={`rounded-2xl border p-5 transition hover:shadow-md ${
        notification.read
          ? 'border-slate-200 bg-white'
          : 'border-blue-200 bg-blue-50/40'
      }`}
    >
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
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {notification.title}
                </h3>

                {!notification.read && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {notification.message}
              </p>
            </div>

            {!notification.read && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                Unread
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
              <Icon name="folder" className="h-3.5 w-3.5" />
              {project.name}
            </span>

            <span>·</span>

            <span>{timeAgo(notification.timestamp)}</span>

            {notification.timestamp && (
              <>
                <span>·</span>
                <span>{formatDate(notification.timestamp)}</span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => onOpen(notification)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-800"
            >
              {notification.actionLabel}
              <Icon name="arrowLeft" className="h-3.5 w-3.5 rotate-180" />
            </button>

            {!notification.read && (
              <button
                type="button"
                onClick={() => onRead(notification.id)}
                className="text-xs font-semibold text-slate-600 transition hover:text-blue-700"
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

export default function NotificationsPage() {
  const { projects, user, navigate, showToast } = useApp()

  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [notifications, setNotifications] = useState(() =>
    createNotifications(projects, user)
  )

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  const projectUpdateCount = notifications.filter(
    (notification) => notification.category === 'projects'
  ).length

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'unread' && !notification.read) ||
        notification.category === activeFilter

      const searchableText = [
        notification.title,
        notification.message,
        notification.project.name,
      ]
        .join(' ')
        .toLowerCase()

      return matchesFilter && searchableText.includes(search.toLowerCase())
    })
  }, [notifications, activeFilter, search])

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    )

    showToast('All notifications marked as read.', 'success')
  }

  const openNotification = (notification) => {
    markAsRead(notification.id)

    navigate('project-details', {
      projectId: notification.project.id,
    })
  }

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'projects', label: 'Projects' },
    { id: 'journal', label: 'Journal' },
  ]

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
              Employee Workspace
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Stay informed about project activity, shared knowledge and team updates.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2">
            <Icon name="lock" className="h-3.5 w-3.5 text-blue-700" />
            <span className="text-xs font-semibold text-blue-800">
              Personal Workspace
            </span>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="All Notifications"
          value={notifications.length}
          description="Updates across your assigned projects"
          icon="bell"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <MetricCard
          label="Unread"
          value={unreadCount}
          description="Notifications waiting for your attention"
          icon="alert"
          iconStyle="bg-amber-50 text-amber-700"
        />

        <MetricCard
          label="Project Updates"
          value={projectUpdateCount}
          description="Documents and knowledge updates"
          icon="folder"
          iconStyle="bg-violet-50 text-violet-700"
        />
      </section>

      {/* Notification List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Your Notifications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Updates from the projects you're part of.
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

          {/* Search */}
          <div className="relative mt-5">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications or projects..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          {/* Filters */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  activeFilter === filter.id
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {filter.label}
                {filter.id === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {filteredNotifications.length}{' '}
              {filteredNotifications.length === 1
                ? 'notification'
                : 'notifications'}
            </p>

            <span className="text-xs text-slate-400">
              Newest first
            </span>
          </div>

          {filteredNotifications.length > 0 ? (
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
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-14 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon name="bell" className="h-7 w-7" />
              </span>

              <h3 className="mt-4 text-base font-bold text-slate-800">
                {notifications.length === 0
                  ? 'No notifications yet'
                  : 'No matching notifications'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {notifications.length === 0
                  ? 'Project updates and team activity will appear here when available.'
                  : 'Try another filter or search term to find your notifications.'}
              </p>

              {(search || activeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveFilter('all')
                  }}
                  className="mt-4 text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer Information */}
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
            <Icon name="sparkles" className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-base font-bold text-blue-950">
              Stay Connected With Your Project
            </h2>

            <p className="mt-1 text-sm leading-6 text-blue-900">
              Keep track of shared documents, team journal activity and
              recorded project knowledge in one place. Notifications help
              you stay informed without interrupting your daily workflow.
            </p>
          </div>
        </div>

        <p className="mt-4 border-t border-blue-200 pt-3 text-xs leading-5 text-blue-800">
          You only receive project information from workspaces you are
          authorised to access.
        </p>
      </section>
    </div>
  )
}
