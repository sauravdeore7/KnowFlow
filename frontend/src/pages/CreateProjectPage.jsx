
import { useState } from 'react'
import { MEMBER_ROLES } from '../data/statusConfig'
import { useApp } from '../hooks/useApp'
import { isValidEmail } from '../utils/helpers'
import Alert from '../components/common/Alert'
import Avatar from '../components/common/Avatar'
import Button from '../components/common/Button'
import Card, { CardHeader } from '../components/common/Card'
import Icon from '../components/common/Icon'
import { SelectField, TextArea, TextField } from '../components/common/FormFields'

const NAME_MAX = 60
const DESCRIPTION_MIN = 20
const DESCRIPTION_MAX = 500
const EMPTY_DRAFT = { name: '', email: '', role: MEMBER_ROLES[0] }
const ROLE_OPTIONS = MEMBER_ROLES.map((role) => ({
  value: role,
  label: role,
}))

export default function CreateProjectPage() {
  const { user, addProject, navigate, showToast } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState([])
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [errors, setErrors] = useState({})
  const [draftErrors, setDraftErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // The creator is always added as Project Manager.
  const manager = {
    id: `m-${user.id}`,
    name: user.name,
    email: user.email,
    role: 'Project Manager',
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
      [manager, ...members].some(
        (member) => member.email.toLowerCase() === email,
      )
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
      },
    ])

    setDraft(EMPTY_DRAFT)
  }

  function validateForm() {
    const next = {}

    if (!name.trim()) {
      next.name = 'Project name is required.'
    } else if (name.trim().length < 3) {
      next.name = 'Project name must be at least 3 characters.'
    } else if (name.trim().length > NAME_MAX) {
      next.name = `Keep the name under ${NAME_MAX} characters.`
    }

    if (!description.trim()) {
      next.description = 'Description is required.'
    } else if (description.trim().length < DESCRIPTION_MIN) {
      next.description = `Describe the project in at least ${DESCRIPTION_MIN} characters.`
    } else if (description.length > DESCRIPTION_MAX) {
      next.description = `Keep the description under ${DESCRIPTION_MAX} characters.`
    }

    if (draft.name.trim() || draft.email.trim()) {
      next.members =
        'Click "Add member" to add this person, or clear the member fields.'
    }

    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const found = validateForm()
    setErrors(found)

    if (Object.keys(found).length > 0) return

    setSubmitting(true)

    try {
      const created = await addProject({
        name,
        description,
        members: [manager, ...members],
      })

      showToast(`Project "${created.name}" created successfully.`)
      navigate('project-details', { projectId: created.id })
    } catch (error) {
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 lg:col-span-2"
      >
        {formError && <Alert tone="error">{formError}</Alert>}

        <Card>
          <CardHeader
            title="Project details"
            subtitle="Tell KnowFlow what this project is about."
          />

          <div className="space-y-5 p-6">
            <TextField
              label="Project name"
              placeholder="e.g. Retail Payment Application"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={errors.name}
            />

            <TextArea
              label="Description"
              placeholder="What does the project do, and what is its current stage?"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              error={errors.description}
              hint={`${description.length}/${DESCRIPTION_MAX} characters`}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Team members"
            subtitle="Add the people who work on this project."
          />

          <div className="space-y-5 p-6">
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {[manager, ...members].map((member, index) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Avatar name={member.name} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.name}
                      {index === 0 && (
                        <span className="text-slate-400"> (you)</span>
                      )}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {member.role} - {member.email}
                    </p>
                  </div>

                  {index > 0 && (
                    <button
                      type="button"
                      aria-label={`Remove ${member.name}`}
                      onClick={() =>
                        setMembers((current) =>
                          current.filter((item) => item.id !== member.id),
                        )
                      }
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Member name"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                error={draftErrors.name}
              />

              <TextField
                label="Member email"
                type="email"
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

            {errors.members && (
              <p className="text-sm text-red-600">{errors.members}</p>
            )}
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('projects')}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create project'}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">
            What happens next
          </h3>

          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>The project appears in your Projects list.</li>
            <li>You can upload authorised documents (Part 2).</li>
            <li>KnowFlow drafts knowledge with source references (Part 2).</li>
            <li>You review and approve the handover (Part 2).</li>
          </ol>
        </Card>

        <Alert tone="success">
          Projects are saved to your KnowFlow database and remain available after refresh.
        </Alert>
      </aside>
    </div>
  )
}
