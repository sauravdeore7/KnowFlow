
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Card, { CardHeader } from '../components/common/Card'
import Button from '../components/common/Button'
import EmptyState from '../components/common/EmptyState'
import Icon from '../components/common/Icon'
import { formatDate } from '../utils/helpers'
import SampleDataNotice from '../components/common/SampleDataNotice'

export default function ProjectJournalPage() {
  const { params, projects, user, isManager, navigate } = useApp()

  const assignedProjects = useMemo(
    () =>
      isManager
        ? projects
        : projects.filter((project) =>
            project.members?.some(
              (member) => member.email === user?.email,
            ),
          ),
    [projects, isManager, user?.email],
  )

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || '',
  )

  useEffect(() => {
    const requestedProject = assignedProjects.find(
      (project) => project.id === params.projectId,
    )

    if (requestedProject) {
      setSelectedProjectId(requestedProject.id)
    } else if (
      !assignedProjects.some(
        (project) => project.id === selectedProjectId,
      )
    ) {
      setSelectedProjectId(assignedProjects[0]?.id || '')
    }
  }, [assignedProjects, params.projectId, selectedProjectId])

  const project = assignedProjects.find(
    (item) => item.id === selectedProjectId,
  )

  const entries = useMemo(
    () =>
      [...(project?.journalEntries || [])].sort(
        (a, b) =>
          new Date(a.date || a.createdAt).getTime() -
          new Date(b.date || b.createdAt).getTime(),
      ),
    [project],
  )

  const fields = [
    ['Work Summary', 'workSummary'],
    ['Completed Tasks', 'completedTasks'],
    ['Decisions and Reasons', 'decisions'],
    ['Problems and Blockers', 'blockers'],
    ['Dependencies', 'dependencies'],
    ['Pending Tasks', 'pendingTasks'],
    ['Next Steps', 'nextSteps'],
    ['Supporting Evidence', 'evidence'],
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-blue-950 to-indigo-900 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
          KnowFlow Project Knowledge
        </p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
          Project Journal History
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
          Select a project to explore its complete daily work history,
          decisions, completed tasks and pending activities from day one.
        </p>
      </section>

      <SampleDataNotice />

      {assignedProjects.length === 0 ? (
        <Card>
          <EmptyState
            icon="folder"
            title="No assigned projects"
            description="You do not currently have access to any project journal history."
            action={
              <Button onClick={() => navigate('dashboard')}>
                Back to Dashboard
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="border border-blue-200 bg-blue-50/50">
            <div className="p-5 sm:p-6">
              <label
                htmlFor="journal-project"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Select Project
              </label>
              <select
                id="journal-project"
                value={selectedProjectId}
                onChange={(event) =>
                  setSelectedProjectId(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                {assignedProjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Only projects you are authorised to access are displayed.
              </p>
            </div>
          </Card>

          {project && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                      Selected Project
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {project.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      navigate('project-details', {
                        projectId: project.id,
                      })
                    }
                  >
                    View Project
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </Button>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Total Entries
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {entries.length}
                  </p>
                </Card>

                <Card className="p-5">
                  <p className="text-sm font-medium text-slate-500">
                    First Entry
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {entries[0]?.date
                      ? formatDate(entries[0].date)
                      : entries[0]?.createdAt
                        ? formatDate(entries[0].createdAt)
                        : 'No entries'}
                  </p>
                </Card>

                <Card className="p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Latest Entry
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {entries.length
                      ? formatDate(
                          entries[entries.length - 1].date ||
                          entries[entries.length - 1].createdAt,
                        )
                      : 'No entries'}
                  </p>
                </Card>
              </div>

              <Card>
                <CardHeader
                  title="Complete Work Journal"
                  subtitle="Daily records arranged chronologically, starting with the first recorded day."
                  action={
                    <Button
                      size="sm"
                      onClick={() => navigate('dashboard')}
                    >
                      <Icon name="plus" className="h-4 w-4" />
                      Write Daily Journal
                    </Button>
                  }
                />

                {entries.length === 0 ? (
                  <EmptyState
                    icon="file"
                    title="No journal entries yet"
                    description="Daily work records for this project will appear here after they are saved."
                  />
                ) : (
                  <div className="space-y-4 p-5 sm:p-6">
                    {entries.map((entry, index) => {
                      const summary =
                        entry.workSummary ||
                        entry.completedTasks ||
                        'Daily work journal entry'

                      return (
                        <details
                          key={entry.id}
                          className="group overflow-hidden rounded-xl border border-slate-200 bg-white"
                        >
                          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 hover:bg-blue-50/50">
                            <div className="flex min-w-0 items-center gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-800">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                                  Day {index + 1}
                                </p>
                                <h4 className="mt-1 font-bold text-slate-900">
                                  {entry.date
                                    ? formatDate(entry.date)
                                    : entry.createdAt
                                      ? formatDate(entry.createdAt)
                                      : 'Date not specified'}
                                </h4>
                                <p className="mt-1 truncate text-sm text-slate-600">
                                  {summary}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-500">
                                {entry.createdBy || 'Employee'}
                              </span>
                              <Icon
                                name="chevronDown"
                                className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180"
                              />
                            </div>
                          </summary>

                          <div className="border-t border-slate-200 bg-slate-50 p-5">
                            <div className="mb-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Recorded By
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {entry.createdBy || 'Employee'}
                              </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              {fields
                                .filter(
                                  ([, key]) =>
                                    typeof entry[key] === 'string' &&
                                    entry[key].trim(),
                                )
                                .map(([label, key]) => (
                                  <div
                                    key={key}
                                    className="rounded-xl border border-slate-200 bg-white p-4"
                                  >
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                      {label}
                                    </p>
                                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                                      {entry[key]}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </details>
                      )
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <strong>Prototype limitation:</strong> Journal history currently
        uses temporary application memory. Entries reset when the
        application is refreshed. Permanent database storage will be
        added during backend integration.
      </div>
    </div>
  )
}
