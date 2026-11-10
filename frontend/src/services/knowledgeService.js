const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'


export async function extractProjectKnowledge(accessToken, projectId) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  if (!projectId) {
    throw new Error('Please select a project first.')
  }

  let response

  try {
    response = await fetch(
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  } catch {
    throw new Error(
      'Unable to connect to KnowFlow server. Please check whether the backend is running.',
    )
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Knowledge extraction failed. Please try again.',
    )
  }

  return data
}
