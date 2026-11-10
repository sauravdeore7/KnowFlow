
import { timeAgo } from '../../utils/helpers'
import { StatusBadge } from '../common/Badge'
import Avatar from '../common/Avatar'
import Button from '../common/Button'

const MAX_AVATARS = 4

export default function ProjectCard({
  project,
  onOpen,
  onEdit,
  onManageMembers,
  isManager,
  currentUserEmail,
}) {
  const members = project.members ?? []
  const documents = project.documents ?? []
  const knowledgeItems = project.knowledge?.items ?? []

  const completedCount = knowledgeItems.filter(
    (item) => item.type === 'completed'
  ).length

  const unresolvedCount = knowledgeItems.filter((item) =>
    ['pending', 'blocker', 'question'].includes(item.type)
  ).length

  const shown = members.slice(0, MAX_AVATARS)
  const extra = members.length - shown.length

  const currentMember = members.find(
    (member) => member.email === currentUserEmail
  )

  const manager = members.find((member) =>
    member.role?.toLowerCase().includes('manager')
  )

  const myJournalEntries = (project.journalEntries ?? []).filter(
    (entry) => entry.createdBy === currentMember?.name
  )

  const myPendingTasks = myJournalEntries.reduce((total, entry) => {
    return (
      total +
      (entry.pendingTasks ?? '')
        .split('\n')
        .filter((task) => task.trim()).length
    )
  }, 0)

  // Employee-specific project card.
  if (!isManager) {
    return (
      <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-brand-700">
              {project.name}
            </h3>
          </div>

          <StatusBadge type="project" value={project.status} />
        </div>

        <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-slate-500">
          {project.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
            <span className="text-sm font-bold">
              {(currentMember?.name ?? 'U')
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Your assigned role
            </p>
            <p className="truncate text-sm font-bold text-slate-900">
              {currentMember?.role ?? 'Team Member'}
            </p>
          </div>

          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-sm">
            Assigned
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 px-2 py-3 text-center">
            <p className="text-xl font-bold text-slate-900">
              {members.length}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Team Members
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50/70 px-2 py-3 text-center">
            <p className="text-xl font-bold text-emerald-700">
              {myJournalEntries.length}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700">
              My Entries
            </p>
          </div>

          <div className="rounded-xl bg-amber-50/70 px-2 py-3 text-center">
            <p className="text-xl font-bold text-amber-700">
              {myPendingTasks}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700">
              Pending Tasks
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex min-w-0 items-center">
            {shown.map((member) => (
              <Avatar
                key={member.id}
                name={member.name}
                size="sm"
                className="-ml-2 ring-2 ring-white first:ml-0"
              />
            ))}

            {extra > 0 && (
              <span className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-2 ring-white">
                +{extra}
              </span>
            )}

            <span className="ml-3 truncate text-xs font-medium text-slate-500">
              {members.length} members
            </span>
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            Updated {timeAgo(project.updatedAt)}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Project Manager
            </span>
            <span className="text-xs font-semibold text-slate-800">
              {manager?.name ?? 'Not assigned'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">
              Shared Documents
            </span>
            <span className="text-xs font-bold text-slate-800">
              {documents.length}
            </span>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <Button
            onClick={() => onOpen(project.id)}
            className="w-full"
          >
            View Project
          </Button>
        </div>
      </div>
    )
  }

  // Existing Manager project card — preserved.
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-brand-700">
            {project.name}
          </h3>
        </div>

        <StatusBadge type="project" value={project.status} />
      </div>

      <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-slate-500">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Handover status
        </span>
        <StatusBadge type="handover" value={project.handoverStatus} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 px-2 py-3 text-center">
          <p className="text-xl font-bold text-slate-900">
            {documents.length}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Documents
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50/70 px-2 py-3 text-center">
          <p className="text-xl font-bold text-emerald-700">
            {completedCount}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">
            Completed
          </p>
        </div>

        <div className="rounded-xl bg-amber-50/70 px-2 py-3 text-center">
          <p className="text-xl font-bold text-amber-700">
            {unresolvedCount}
          </p>
          <p className="mt-1 text-xs font-medium text-amber-700">
            Unresolved
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex min-w-0 items-center">
          {shown.map((member) => (
            <Avatar
              key={member.id}
              name={member.name}
              size="sm"
              className="-ml-2 ring-2 ring-white first:ml-0"
            />
          ))}

          {extra > 0 && (
            <span className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-2 ring-white">
              +{extra}
            </span>
          )}

          <span className="ml-3 truncate text-xs font-medium text-slate-500">
            {members.length} members
          </span>
        </div>

        <span className="shrink-0 text-xs text-slate-400">
          Updated {timeAgo(project.updatedAt)}
        </span>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onOpen(project.id)}
            className="flex-1"
          >
            View Project
          </Button>

          {isManager && (
            <>
              <Button
                variant="secondary"
                onClick={() => onEdit(project.id)}
              >
                Edit
              </Button>

              <Button
                variant="secondary"
                onClick={() => onManageMembers(project.id)}
              >
                Members
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
