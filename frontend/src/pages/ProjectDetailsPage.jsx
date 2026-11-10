
// Project Details: overview, members, documents, knowledge summary and handover status.
import { useApp } from '../hooks/useApp'
import { formatDate, timeAgo } from '../utils/helpers'
import Avatar from '../components/common/Avatar'
import Badge, { StatusBadge } from '../components/common/Badge'
import Button from '../components/common/Button'
import Card, { CardHeader } from '../components/common/Card'
import EmptyState from '../components/common/EmptyState'
import Icon from '../components/common/Icon'
import HandoverProgress from '../components/projects/HandoverProgress'
import KnowledgeSummary from '../components/projects/KnowledgeSummary'
import EmployeeProjectDetails from '../components/projects/EmployeeProjectDetails'

export default function ProjectDetailsPage() {
  const { params, getProjectById, isManager, navigate, user } = useApp()
  const project = getProjectById(params.projectId)

  if (!project) {
    return (
      <Card>
        <EmptyState
          icon="alert"
          title="Project not found"
          description="This project does not exist or you do not have access to it."
          action={
            <Button onClick={() => navigate('projects')}>
              Back to projects
            </Button>
          }
        />
      </Card>
    )
  }

  // Employees see their dedicated project workspace.
  // The existing Manager Project Details interface remains unchanged.
  if (!isManager) {
    return (
      <EmployeeProjectDetails
        project={project}
        user={user}
        navigate={navigate}
      />
    )
  }

  const go = (page) => navigate(page, { projectId: project.id })

  // Manager can always access the project knowledge summary.
  const knowledgeVisible = isManager || project.handoverStatus === 'approved'

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('projects')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500
          hover:text-slate-900"
      >
        <Icon name="arrowLeft" className="h-4 w-4" />
        Back to projects
      </button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {project.name}
              </h2>
              <StatusBadge type="project" value={project.status} />
            </div>
            <p className="mt-2 max-w-3xl text-slate-500">
              {project.description}
            </p>
          </div>

          {isManager && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => go('upload')}>
                <Icon name="upload" className="h-4 w-4" />
                Upload documents
              </Button>
              <Button variant="secondary" onClick={() => go('extraction')}>
                <Icon name="sparkles" className="h-4 w-4" />
                Extract knowledge
              </Button>
              <Button onClick={() => go('review')}>
                <Icon name="clipboard" className="h-4 w-4" />
                Review handover
              </Button>
            </div>
          )}
        </div>

        <dl
          className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2
            lg:grid-cols-4"
        >
          {[
            ['Created', formatDate(project.createdAt)],
            ['Last updated', timeAgo(project.updatedAt)],
            ['Members', project.members.length],
            ['Documents', project.documents.length],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
              </dt>
              <dd className="mt-1 text-base font-semibold text-slate-900">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border border-blue-200">
          <CardHeader
            title="Daily Work Journal"
            subtitle="View the complete history of daily work recorded for this project."
            action={
              <Button onClick={() => go('project-journal')}>
                <Icon name="book-open" className="h-4 w-4" />
                View Journal History
              </Button>
            }
          />
          <div className="px-6 pb-5">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">
                {project.journalEntries?.length || 0}
              </strong>{' '}
              journal entries recorded for this project.
            </p>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Knowledge summary"
              subtitle="Evidence-linked knowledge for the handover"
            />
            {!knowledgeVisible ? (
              <EmptyState
                icon="lock"
                title="Handover not shared yet"
                description="The manager must approve this handover before you can see it."
              />
            ) : !project.knowledge ? (
              <EmptyState
                icon="sparkles"
                title="No knowledge extracted yet"
                description="Upload authorised documents, then run knowledge extraction."
                action={
                  isManager && (
                    <Button onClick={() => go('upload')}>
                      Upload documents
                    </Button>
                  )
                }
              />
            ) : (
              <KnowledgeSummary knowledge={project.knowledge} />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Uploaded documents"
              subtitle="Only authorised sources are processed"
              action={
                isManager && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => go('upload')}
                  >
                    Add document
                  </Button>
                )
              }
            />
            {project.documents.length === 0 ? (
              <EmptyState
                icon="file"
                title="No documents uploaded"
                description="Authorised project documents will be listed here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {project.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg
                        bg-slate-100 text-slate-500"
                    >
                      <Icon name="file" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {doc.type} - {doc.sizeKb} KB - {doc.uploadedBy} -{' '}
                        {timeAgo(doc.uploadedAt)}
                      </p>
                    </div>
                    <Badge>{doc.sourceId}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Handover status" />
            <div className="px-6 pt-5">
              <StatusBadge
                type="handover"
                value={project.handoverStatus}
              />
            </div>
            <HandoverProgress project={project} />
          </Card>

          <Card>
            <CardHeader
              title="Project members"
              subtitle={`${project.members.length} people`}
            />
            <ul className="divide-y divide-slate-100">
              {project.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-6 py-4"
                >
                  <Avatar name={member.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {member.role}
                    </p>
                  </div>
                  {member.departing && (
                    <Badge tone="warning">Departing</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
