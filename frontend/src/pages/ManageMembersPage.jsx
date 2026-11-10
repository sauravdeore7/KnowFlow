
import { useEffect, useState } from 'react'
import { MEMBER_ROLES } from '../data/statusConfig'
import { useApp } from '../hooks/useApp'
import { isValidEmail } from '../utils/helpers'
import Alert from '../components/common/Alert'
import Avatar from '../components/common/Avatar'
import Button from '../components/common/Button'
import Card, { CardHeader } from '../components/common/Card'
import Icon from '../components/common/Icon'
import { SelectField, TextField } from '../components/common/FormFields'

const EMPTY_DRAFT = { name: '', email: '', role: MEMBER_ROLES[0] }

const ROLE_OPTIONS = MEMBER_ROLES.map((role) => ({
  value: role,
  label: role,
}))

export default function ManageMembersPage() {
  const { params, getProjectById, updateProject, navigate, showToast } = useApp()

  const project = getProjectById(params.projectId)

  const [members, setMembers] = useState(project?.members ?? [])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [draftErrors, setDraftErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setMembers(project.members ?? [])
      setDraft(EMPTY_DRAFT)
      setDraftErrors({})
      setFormError('')
    }
  }, [project?.id])

  if (!project) {
    return (
      <Card className="p-6">
        <Alert tone="error">
          Project not found or you do not have access to it.
        </Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('projects')}>
            Back to Projects
          </Button>
        </div>
      </Card>
    )
  }

  function validateDraft() {
    const next = {}
    const email = draft.email.trim().toLowerCase()

    if (!draft.name.trim()) {
      next.name = 'Member name is required.'
    }

    if (!email) {
      next.email = 'Member email is required.'
    } else if (!isValidEmail(email)) {
      next.email = 'Enter a valid email address.'
    } else if (
      members.some((member) => member.email.toLowerCase() === email)
    ) {
      next.email = 'This person is already on the project.'
    }

    return next
  }

  function handleAddMember() {
    const found = validateDraft()
    setDraftErrors(found)

    if (Object.keys(found).length > 0) return

    setMembers((current) => [
      ...current,
      {
        id: `m-${Date.now()}`,
        name: draft.name.trim(),
        email: draft.email.trim(),
        role: draft.role,
        departing: false,
      },
    ])

    setDraft(EMPTY_DRAFT)
    setDraftErrors({})
  }

  function handleRoleChange(memberId, newRole) {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId && member.role !== 'Project Manager'
          ? { ...member, role: newRole }
          : member,
      ),
    )
  }

  function handleRemoveMember(memberId) {
    setMembers((current) =>
      current.filter(
        (member) =>
          member.id !== memberId || member.role === 'Project Manager',
      ),
    )
  }

  async function handleSave() {
    setFormError('')

    if (draft.name.trim() || draft.email.trim()) {
      setFormError('Please add the entered member or clear the member fields.')
      return
    }

    setSubmitting(true)

    try {
      await updateProject(project.id, { members })

      showToast('Project members updated successfully.')
      navigate('project-details', { projectId: project.id })
    } catch (error) {
      setFormError(error.message || 'Could not update project members.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Card>
          <CardHeader
            title="Project team"
            subtitle={`Manage members of ${project.name}.`}
          />

          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                Current members
              </p>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {members.length} Members
              </span>
            </div>

            {members.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No project members found.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {members.map((member) => {
                  const isProjectManager = member.role === 'Project Manager'

                  return (
                    <li
                      key={member.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                    >
                      <Avatar name={member.name} size="sm" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {member.email}
                        </p>

                        {member.departing && (
                          <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Departing member
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isProjectManager ? (
                          <span className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                            Project Manager
                          </span>
                        ) : (
                          <>
                            <div className="min-w-0 flex-1 sm:w-44">
                              <SelectField
                                label="Role"
                                options={ROLE_OPTIONS}
                                value={member.role}
                                onChange={(event) =>
                                  handleRoleChange(member.id, event.target.value)
                                }
                              />
                            </div>

                            <button
                              type="button"
                              aria-label={`Remove ${member.name}`}
                              onClick={() => handleRemoveMember(member.id)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Icon name="trash-2" className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Add team member"
            subtitle="Add another person to this project workspace."
          />

          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Member name"
                placeholder="Enter member name"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                error={draftErrors.name}
              />

              <TextField
                label="Member email"
                type="email"
                placeholder="Enter email address"
                value={draft.email}
                onChange={(event) =>
                  setDraft({ ...draft, email: event.target.value })
                }
                error={draftErrors.email}
              />

              <SelectField
                label="Role"
                options={ROLE_OPTIONS}
                value={draft.role}
                onChange={(event) =>
                  setDraft({ ...draft, role: event.target.value })
                }
              />

              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={handleAddMember}
                  className="w-full"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add member
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              navigate('project-details', { projectId: project.id })
            }
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button onClick={handleSave} loading={submitting}>
            <Icon name="save" className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save members'}
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Member management
          </h3>

          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Add new team members using their name and email.</li>
            <li>Change existing members' project roles.</li>
            <li>Remove members who no longer belong to the project.</li>
            <li>The Project Manager cannot be removed or reassigned here.</li>
          </ul>
        </Card>

        <Alert tone="warning">
          Prototype only. Member changes are stored in temporary memory and reset when the page is refreshed.
        </Alert>
      </aside>
    </div>
  )
}
