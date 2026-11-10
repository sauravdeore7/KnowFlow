
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function sendRequest(accessToken, endpoint, options = {}) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  } catch {
    throw new Error(
      'Unable to connect to KnowFlow server. Please check whether the backend is running.',
    )
  }

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok) {
    throw new Error(data.detail || 'Support request operation failed.')
  }

  return data
}

export async function fetchSupportRequests(accessToken) {
  const data = await sendRequest(
    accessToken,
    '/support-requests/',
    { method: 'GET' },
  )

  return data.requests || []
}

export async function createSupportRequest(accessToken, request) {
  const data = await sendRequest(
    accessToken,
    '/support-requests/',
    {
      method: 'POST',
      body: JSON.stringify({
        project_id: request.projectId,
        request_type: request.type,
        title: request.title,
        description: request.description,
        document_name: request.documentName || null,
        priority: request.priority,
      }),
    },
  )

  return data.request
}

export async function updateSupportRequest(accessToken, requestId, changes) {
  const data = await sendRequest(
    accessToken,
    `/support-requests/${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        response: changes.response || '',
        status: changes.status,
      }),
    },
  )

  return data.request
}
