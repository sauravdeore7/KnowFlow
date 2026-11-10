// Labels and colours for project status and handover status badges.
// tone is one of: success, warning, info, neutral, danger (see Badge.jsx)

export const PROJECT_STATUS = {
  active: { label: 'Active', tone: 'success' },
  under_review: { label: 'Under Review', tone: 'warning' },
  completed: { label: 'Completed', tone: 'info' },
}

export const HANDOVER_STATUS = {
  not_started: { label: 'Not started', tone: 'neutral' },
  draft: { label: 'Draft', tone: 'info' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
}

export const MEMBER_ROLES = [
  'Developer',
  'Incoming Developer',
  'QA Engineer',
  'DevOps Engineer',
  'Designer',
  'Team Member',
]

export const KNOWLEDGE_TYPES = {
  completed: 'Completed',
  pending: 'Pending',
  decision: 'Decision',
  blocker: 'Blocker',
  question: 'Open question',
}
