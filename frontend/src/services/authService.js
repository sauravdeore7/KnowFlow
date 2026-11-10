
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function loginUser({ email, password, role }) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    })
  } catch {
    throw new Error(
      'Unable to connect to KnowFlow server. Please check whether the backend is running.',
    )
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Incorrect email or password.')
  }

  if (data.user.role !== role) {
    throw new Error(
      `This is a ${data.user.role} account. Select "${data.user.role}" above.`,
    )
  }

  return {
    ...data.user,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}
