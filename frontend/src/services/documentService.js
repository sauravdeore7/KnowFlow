
const API_BASE_URL = 'http://127.0.0.1:8000'

async function getErrorMessage(response, fallback) {
  try {
    const data = await response.json()
    return data.detail || fallback
  } catch {
    return fallback
  }
}

export async function uploadDocument(accessToken, projectId, file) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  const formData = new FormData()
  formData.append('file', file)

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/documents/?project_id=${encodeURIComponent(projectId)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      },
    )
  } catch {
    throw new Error('Unable to connect to KnowFlow server.')
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Document upload failed.'),
    )
  }

  return response.json()
}

export async function deleteDocument(accessToken, documentId) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  } catch {
    throw new Error('Unable to connect to KnowFlow server.')
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Document deletion failed.'),
    )
  }

  return response.json()
}

export async function downloadDocument(accessToken, documentId) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  let response

  try {
    response = await fetch(
      `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  } catch {
    throw new Error('Unable to connect to KnowFlow server.')
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Document download failed.'),
    )
  }

  return response.blob()
}
