
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '')

let store = []

async function getErrorMessage(response, fallback) {
  try {
    const data = await response.json()
    return data.detail || fallback
  } catch {
    return fallback
  }
}

function normalizeProjects(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.projects)) return data.projects
  if (Array.isArray(data?.data)) return data.data

  throw new Error(
    'The server returned an unexpected projects response. Please check the backend GET /projects/ response.',
  )
}

export async function fetchProjects(accessToken) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch {
    throw new Error('Unable to connect to the KnowFlow server.')
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Unable to load projects.'),
    )
  }

  const data = await response.json()
  const projects = normalizeProjects(data)

  store = projects
  return projects
}

export async function createProject(accessToken, details, managerEmail) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  const members = (details.members || [])
    .filter((member) => {
      const isManager = member.role === 'Project Manager'
      const isCurrentManager =
        managerEmail &&
        member.email?.toLowerCase() === managerEmail.toLowerCase()

      return !isManager && !isCurrentManager
    })
    .map((member) => ({
      name: member.name.trim(),
      email: member.email.trim(),
      role: member.role,
    }))

  let response

  try {
    response = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: details.name.trim(),
        description: details.description.trim(),
        members,
      }),
    })
  } catch {
    throw new Error('Unable to connect to the KnowFlow server.')
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Unable to create project.'),
    )
  }

  const data = await response.json()
  const project = data.project

  if (!project) {
    throw new Error('The server did not return the created project.')
  }

  store = [project, ...store.filter((item) => item.id !== project.id)]

  return project
}

export async function updateProject(accessToken, id, changes) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  const existing = store.find((project) => project.id === id)

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/projects/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: changes.name.trim(),
          description: changes.description.trim(),
          status: changes.status,
        }),
      },
    )
  } catch {
    throw new Error('Unable to connect to the KnowFlow server.')
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Unable to update project.'),
    )
  }

  const data = await response.json()

  if (!data.project) {
    throw new Error('The server did not return the updated project.')
  }

  const updated = {
    ...(existing || {}),
    ...data.project,
  }

  store = store.map((project) =>
    project.id === id ? updated : project,
  )

  return updated
}
