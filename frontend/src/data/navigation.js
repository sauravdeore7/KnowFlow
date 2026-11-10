
// Sidebar items, page titles and role rules.

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['manager', 'employee'], section: 'workspace' },
  { key: 'projects', label: 'Projects', icon: 'folder', roles: ['manager', 'employee'], section: 'workspace' },
  { key: 'project-journal', label: 'Journal History', icon: 'book-open', roles: ['manager', 'employee'], section: 'workspace' },

  // Employee workspace
  { key: 'notifications', label: 'Notifications', icon: 'alert', roles: ['employee'], section: 'workspace' },
  { key: 'my-handover', label: 'My Handover', icon: 'clipboard', roles: ['employee'], section: 'workspace' },

  { key: 'my-documents', label: 'My Documents', icon: 'fileText', roles: ['employee'], section: 'collaboration' },
  { key: 'requests-support', label: 'Requests & Support', icon: 'clipboard', roles: ['employee'], section: 'collaboration' },
  { key: 'employee-knowledge-graph', label: 'Knowledge Graph', icon: 'network', roles: ['employee'], section: 'collaboration' },
  { key: 'employee-knowledge-insights', label: 'Knowledge Insights', icon: 'brain', roles: ['employee'], section: 'collaboration' },

  // Employee features planned for Round 3
  { key: 'employee-ai-assistant', label: 'AI Knowledge Assistant', icon: 'sparkles', roles: ['employee'], section: 'collaboration', badge: 'Round 3' },
  { key: 'employee-ai-podcast', label: 'AI Knowledge Podcast', icon: 'headphones', roles: ['employee'], section: 'collaboration', badge: 'Round 3' },
  { key: 'contribution-analytics', label: 'Contribution Analytics', icon: 'listChecks', roles: ['employee'], section: 'collaboration', badge: 'Round 3' },
  { key: 'knowledge-portfolio', label: 'Knowledge Portfolio', icon: 'award', roles: ['employee'], section: 'collaboration', badge: 'Round 3' },
  { key: 'employee-reports-analytics', label: 'Reports & Analytics', icon: 'fileText', roles: ['employee'], section: 'collaboration', badge: 'Round 3' },

  // Manager workspace
  { key: 'manager-notifications', label: 'Notifications', icon: 'bell', roles: ['manager'], section: 'workspace' },
  { key: 'upload', label: 'Document Upload', icon: 'upload', roles: ['manager'], section: 'workspace' },
  { key: 'extraction', label: 'Knowledge Extraction', icon: 'sparkles', roles: ['manager'], section: 'workspace' },
  { key: 'insights', label: 'Knowledge Insights', icon: 'listChecks', roles: ['manager'], section: 'workspace' },
  { key: 'knowledge-graph', label: 'Knowledge Graph', icon: 'network', roles: ['manager'], section: 'workspace' },
  { key: 'review', label: 'Handover Review', icon: 'clipboard', roles: ['manager'], section: 'workspace' },
  { key: 'manager-requests-support', label: 'Requests & Support', icon: 'clipboard', roles: ['manager'], section: 'workspace' },

  // Manager governance — Round 3
  { key: 'audit-history', label: 'Audit & Version History', icon: 'clock', roles: ['manager'], section: 'governance', badge: 'Round 3' },
  { key: 'reports-analytics', label: 'Reports & Analytics', icon: 'fileText', roles: ['manager'], section: 'governance', badge: 'Round 3' },
]

// Pages that are not in the sidebar highlight a parent item instead.
export const PAGE_TO_NAV = {
  'create-project': 'projects',
  'project-details': 'projects',
  'edit-project': 'projects',
  'manage-members': 'projects',
}

// Pages an employee is not allowed to open.
export const MANAGER_ONLY_PAGES = [
  'create-project',
  'edit-project',
  'manage-members',
  'manager-notifications',
  'upload',
  'extraction',
  'insights',
  'knowledge-graph',
  'review',
  'manager-requests-support',
  'audit-history',
  'reports-analytics',
]

// Pages a manager is not allowed to open.
export const EMPLOYEE_ONLY_PAGES = [
  'notifications',
  'my-handover',
  'my-documents',
  'requests-support',
  'employee-knowledge-graph',
  'employee-knowledge-insights',
  'employee-ai-assistant',
  'employee-ai-podcast',
  'contribution-analytics',
  'knowledge-portfolio',
  'employee-reports-analytics',
]

export const PAGE_META = {
  dashboard: { title: 'Dashboard', subtitle: 'Manage your project knowledge and handovers.' },
  projects: { title: 'Projects', subtitle: 'Browse and manage project workspaces.' },
  'create-project': { title: 'Create Project', subtitle: 'Set up a new project workspace.' },
  'project-details': { title: 'Project Details', subtitle: 'Overview, documents, handover.' },
  'edit-project': { title: 'Edit Project', subtitle: 'Update project details.' },
  'manage-members': { title: 'Manage Members', subtitle: 'Manage project team members and roles.' },

  'manager-notifications': {
    title: 'Notifications',
    subtitle: 'Stay updated on employee requests and handovers requiring your attention.',
  },

  upload: { title: 'Document Upload', subtitle: 'Add authorised project documents.' },
  extraction: { title: 'Knowledge Extraction', subtitle: 'Draft knowledge from documents.' },
  insights: { title: 'Knowledge Insights', subtitle: 'Understand the health and completeness of project knowledge.' },
  'knowledge-graph': { title: 'Knowledge Graph', subtitle: 'Explore relationships across project knowledge.' },
  review: { title: 'Handover Review', subtitle: 'Check, correct and approve handovers.' },

  'manager-requests-support': {
    title: 'Requests & Support',
    subtitle: 'Review and manage requests submitted by project employees.',
  },

  'audit-history': { title: 'Audit & Version History', subtitle: 'Planned for Round 3.' },
  'reports-analytics': { title: 'Reports & Analytics', subtitle: 'Planned for Round 3.' },

  'project-journal': {
    title: 'Journal History',
    subtitle: 'View daily work records across your projects.',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Stay updated on your projects and workspace activity.',
  },
  'my-handover': {
    title: 'My Handover',
    subtitle: 'Review outgoing handovers and access handovers shared with you.',
  },
  'my-documents': {
    title: 'My Documents',
    subtitle: 'Access documents shared across your assigned projects.',
  },
  'requests-support': {
    title: 'Requests & Support',
    subtitle: 'Raise project requests and track their progress.',
  },
  'employee-knowledge-graph': {
    title: 'Knowledge Graph',
    subtitle: 'Explore relationships across your assigned project knowledge.',
  },
  'employee-knowledge-insights': {
    title: 'Knowledge Insights',
    subtitle: 'Explore knowledge coverage, contributions and open items across your assigned projects.',
  },
  'employee-ai-assistant': {
    title: 'AI Knowledge Assistant',
    subtitle: 'Get intelligent answers from your authorised project knowledge.',
  },
  'employee-ai-podcast': {
    title: 'AI Knowledge Podcast',
    subtitle: 'Turn project knowledge into easy-to-understand audio summaries.',
  },
  'contribution-analytics': {
    title: 'Contribution Analytics',
    subtitle: 'Understand your contributions to project knowledge and collaboration.',
  },
  'knowledge-portfolio': {
    title: 'Knowledge Portfolio',
    subtitle: 'Build a structured record of your work, skills and project knowledge.',
  },
  'employee-reports-analytics': {
    title: 'Reports & Analytics',
    subtitle: 'Explore personal contribution reports and authorised project insights.',
  },
}
