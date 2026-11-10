
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function createJournal(accessToken, journal) {
  if (!accessToken) {
    throw new Error('Authentication token is missing. Please log in again.')
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}/journals/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        project_id: journal.projectId,
        entry_date: journal.date,
        work_summary: journal.workSummary,
        completed_tasks: journal.completedTasks,
        decisions: journal.decisions,
        blockers: journal.blockers,
        dependencies: journal.dependencies,
        pending_tasks: journal.pendingTasks,
        next_steps: journal.nextSteps,
        evidence: journal.evidence,
      }),
    })
  } catch {
    throw new Error(
      'Unable to connect to KnowFlow server. Please check whether the backend is running.',
    )
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Could not save your daily journal.',
    )
  }

  return data.journal
}
