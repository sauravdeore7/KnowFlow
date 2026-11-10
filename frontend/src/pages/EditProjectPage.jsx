
import { useEffect, useState } from 'react'
import { PROJECT_STATUS } from '../data/statusConfig'
import { useApp } from '../hooks/useApp'
import Alert from '../components/common/Alert'
import Button from '../components/common/Button'
import Card, { CardHeader } from '../components/common/Card'
import Icon from '../components/common/Icon'
import { SelectField, TextArea, TextField } from '../components/common/FormFields'

const NAME_MAX = 60
const DESCRIPTION_MIN = 20
const DESCRIPTION_MAX = 500

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS).map(([value, config]) => ({
  value,
  label: config.label,
}))

export default function EditProjectPage() {
  const { params, getProjectById, updateProject, navigate, showToast } = useApp()

  const project = getProjectById(params.projectId)

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState(project?.status ?? 'active')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name ?? '')
      setDescription(project.description ?? '')
      setStatus(project.status ?? 'active')
      setErrors({})
      setFormError('')
    }
  }, [project?.id])

  if (!project) {
    return (
      <Card className="p-6">
        <Alert tone="error">Project not found or you do not have access to it.</Alert>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('projects')}>
            Back to Projects
          </Button>
        </div>
      </Card>
    )
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
    } else if (description.trim().length > DESCRIPTION_MAX) {
      next.description = `Keep the description under ${DESCRIPTION_MAX} characters.`
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
      const updated = await updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        status,
      })

      showToast(`Project "${updated.name}" updated successfully.`)
      navigate('project-details', { projectId: project.id })
    } catch (error) {
      setFormError(error.message || 'Could not update the project. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit} noValidate className="space-y-6 lg:col-span-2">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Card>
          <CardHeader
            title="Edit project details"
            subtitle="Update the information and status of this project."
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

            <SelectField
              label="Project status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('project-details', { projectId: project.id })}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" loading={submitting}>
            <Icon name="save" className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>

      <aside className="space-y-4">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900">Before saving</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>Changes will update the project details.</li>
            <li>Existing members and documents will be preserved.</li>
            <li>Project knowledge and handover records will remain attached.</li>
          </ul>
        </Card>

        <Alert tone="warning">
          Prototype only. Changes are stored in temporary memory and reset when the page is refreshed.
        </Alert>
      </aside>
    </div>
  )
}
