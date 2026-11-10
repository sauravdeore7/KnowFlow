
import { useState } from 'react'
import { formatDate, timeAgo } from '../../utils/helpers'
import Avatar from '../common/Avatar'
import Badge, { StatusBadge } from '../common/Badge'
import Card, { CardHeader } from '../common/Card'
import EmptyState from '../common/EmptyState'
import Icon from '../common/Icon'
import KnowledgeSummary from './KnowledgeSummary'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'contributions', label: 'My Contributions', icon: 'book-open' },
  { id: 'members', label: 'Team Members', icon: 'users' },
  { id: 'activity', label: 'Team Activity', icon: 'clock' },
  { id: 'documents', label: 'Project Documents', icon: 'file-text' },
  { id: 'knowledge', label: 'Project Knowledge', icon: 'book-open' },
]

function getTaskCount(entries) {
  return entries.reduce((total, entry) => {
    return (
      total +
      (entry.pendingTasks || '')
        .split('\n')
        .filter((task) => task.trim()).length
    )
  }, 0)
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      )}
    </div>
  )
}

export default function EmployeeProjectDetails({ project, user, navigate }) {
  const [activeTab, setActiveTab] = useState('overview')

  const members = project.members || []
  const documents = project.documents || []
  const journalEntries = project.journalEntries || []

  const currentMember = members.find(
    (member) => member.email === user?.email
  )

  const myEntries = journalEntries.filter(
    (entry) => entry.createdBy === currentMember?.name
  )

  const manager = members.find(
    (member) => String(member.role || '').toLowerCase().includes('manager')
  )

  const entries = [...journalEntries].sort(
    (a, b) =>
      new Date(b.date || b.createdAt) -
      new Date(a.date || a.createdAt)
  )

  const knowledgeVisible = project.handoverStatus === 'approved'

  const stats = [
    {
      label: 'My Contributions',
      value: myEntries.length,
      icon: 'book-open',
      color: 'bg-blue-50 text-blue-600',
      tab: 'contributions',
    },
    {
      label: 'Team Members',
      value: members.length,
      icon: 'users',
      color: 'bg-violet-50 text-violet-600',
      tab: 'members',
    },
    {
      label: 'Project Documents',
      value: documents.length,
      icon: 'file-text',
      color: 'bg-amber-50 text-amber-600',
      tab: 'documents',
    },
    {
      label: 'Pending Tasks',
      value: getTaskCount(myEntries),
      icon: 'list-checks',
      color: 'bg-rose-50 text-rose-600',
      tab: 'contributions',
    },
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-0">
            <button
              type="button"
              onClick={() => setActiveTab(stat.tab)}
              className="w-full rounded-xl p-5 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-blue-600">
                    View details →
                  </p>
                </div>

                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon name={stat.icon} className="h-5 w-5" />
                </span>
              </div>
            </button>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle
            title="My Role in This Project"
            subtitle="Your assigned responsibility and project contribution"
          />

          <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <Avatar name={currentMember?.name || user?.name || 'Employee'} />

            <div>
              <p className="font-semibold text-slate-900">
                {currentMember?.name || user?.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {currentMember?.role || 'Project Member'}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">My journal entries</span>
              <span className="font-semibold text-slate-900">
                {myEntries.length}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Pending task items</span>
              <span className="font-semibold text-slate-900">
                {getTaskCount(myEntries)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <SectionTitle
            title="Project Information"
            subtitle="A quick overview of your assigned project"
          />

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Project Manager</p>
              <p className="mt-1 font-semibold text-slate-900">
                {manager?.name || 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Created</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatDate(project.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Last updated</p>
              <p className="mt-1 font-semibold text-slate-900">
                {timeAgo(project.updatedAt)}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Handover status</p>
              <div className="mt-2">
                <StatusBadge
                  type="handover"
                  value={project.handoverStatus}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle
          title="Recent Team Activity"
          subtitle="Latest recorded work across this project"
        />

        {entries.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No team activity yet"
            description="Project journal activity will appear here."
          />
        ) : (
          <div className="space-y-4">
            {entries.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <Avatar name={entry.createdBy || 'Team member'} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {entry.createdBy || 'Team member'}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {entry.workSummary || 'Recorded project activity'}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {timeAgo(entry.createdAt || entry.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View all team activity →
        </button>
      </Card>
    </div>
  )

  const renderContributions = () => (
    <Card className="p-6">
      <SectionTitle
        title="My Contributions"
        subtitle="Your recorded work and progress in this project"
      />

      {myEntries.length === 0 ? (
        <EmptyState
          icon="book-open"
          title="No contributions recorded yet"
          description="Your project journal entries will appear here once recorded."
        />
      ) : (
        <div className="space-y-5">
          {myEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-200 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">
                  {formatDate(entry.date || entry.createdAt)}
                </p>
                <Badge>My journal entry</Badge>
              </div>

              {entry.workSummary && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {entry.workSummary}
                </p>
              )}

              {entry.completedTasks && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Completed tasks
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.completedTasks}
                  </p>
                </div>
              )}

              {entry.decisions && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Decisions
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.decisions}
                  </p>
                </div>
              )}

              {entry.blockers && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Blockers
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.blockers}
                  </p>
                </div>
              )}

              {entry.pendingTasks && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Pending tasks
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.pendingTasks}
                  </p>
                </div>
              )}

              {entry.nextSteps && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Next steps
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.nextSteps}
                  </p>
                </div>
              )}

              {entry.dependencies && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dependencies
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.dependencies}
                  </p>
                </div>
              )}

              {entry.evidence && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Evidence
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {entry.evidence}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  const renderMembers = () => (
    <Card>
      <CardHeader
        title="Team Members"
        subtitle={`${members.length} people working on this project`}
      />

      {members.length === 0 ? (
        <EmptyState
          icon="users"
          title="No team members"
          description="No members are currently assigned to this project."
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 px-6 py-4"
            >
              <Avatar name={member.name} />

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {member.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {member.role}
                </p>
              </div>

              {member.email === user?.email && (
                <Badge tone="info">You</Badge>
              )}

              {member.departing && (
                <Badge tone="warning">Departing</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  const renderActivity = () => (
    <Card className="p-6">
      <SectionTitle
        title="Team Activity"
        subtitle="Read-only timeline of recorded project work"
      />

      {entries.length === 0 ? (
        <EmptyState
          icon="activity"
          title="No activity available"
          description="Team journal activity will appear here."
        />
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Icon name="file-text" className="h-4 w-4" />
                </span>
                <span className="mt-2 min-h-8 w-px flex-1 bg-slate-200" />
              </div>

              <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {entry.createdBy || 'Team member'}
                  </p>

                  <span className="text-xs text-slate-400">
                    {timeAgo(entry.createdAt || entry.date)}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {entry.workSummary || 'Recorded project activity'}
                </p>

                {entry.completedTasks && (
                  <p className="mt-3 whitespace-pre-line text-sm text-slate-500">
                    {entry.completedTasks}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  const renderDocuments = () => (
    <Card>
      <CardHeader
        title="Project Documents"
        subtitle="Documents shared with authorised project members"
      />

      {documents.length === 0 ? (
        <EmptyState
          icon="file"
          title="No shared documents"
          description="Documents made available to this project will appear here."
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 px-6 py-4"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon name="file-text" className="h-5 w-5" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {doc.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {doc.type} · {doc.sizeKb} KB · {doc.uploadedBy}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Uploaded {timeAgo(doc.uploadedAt)}
                </p>
              </div>

              {doc.sourceId && <Badge>{doc.sourceId}</Badge>}
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  const renderKnowledge = () => (
    <Card>
      <CardHeader
        title="Project Knowledge"
        subtitle="Verified knowledge made available through the handover process"
      />

      {!knowledgeVisible ? (
        <EmptyState
          icon="lock"
          title="Knowledge not shared yet"
          description="Project knowledge becomes available after the manager approves the handover."
        />
      ) : !project.knowledge ? (
        <EmptyState
          icon="book-open"
          title="No project knowledge available"
          description="Knowledge has not been extracted for this project yet."
        />
      ) : (
        <KnowledgeSummary knowledge={project.knowledge} />
      )}
    </Card>
  )

  const content = {
    overview: renderOverview,
    contributions: renderContributions,
    members: renderMembers,
    activity: renderActivity,
    documents: renderDocuments,
    knowledge: renderKnowledge,
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('projects')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back to My Projects
      </button>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge tone="info">My Assigned Project</Badge>

              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {project.name}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {project.description}
              </p>
            </div>

            <StatusBadge type="project" value={project.status} />
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>{members.length} team members</span>
            <span>{documents.length} shared documents</span>
            <span>Updated {timeAgo(project.updatedAt)}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-4 pt-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              <Icon name={tab.icon} className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {content[activeTab]()}
    </div>
  )
}
