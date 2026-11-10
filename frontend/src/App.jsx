
import { AppProvider } from './context/AppProvider'
import {
  MANAGER_ONLY_PAGES,
  EMPLOYEE_ONLY_PAGES,
} from './data/navigation'
import { useApp } from './hooks/useApp'
import AppLayout from './components/layout/AppLayout'
import ToastContainer from './components/common/ToastContainer'

import CreateProjectPage from './pages/CreateProjectPage'
import EditProjectPage from './pages/EditProjectPage'
import ManageMembersPage from './pages/ManageMembersPage'
import DashboardPage from './pages/DashboardPage'
import DocumentUploadPage from './pages/DocumentUploadPage'
import HandoverReviewPage from './pages/HandoverReviewPage'
import KnowledgeExtractionPage from './pages/KnowledgeExtractionPage'
import KnowledgeInsightsPage from './pages/KnowledgeInsightsPage'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import EmployeeKnowledgeGraphPage from './pages/EmployeeKnowledgeGraphPage'
import EmployeeKnowledgeInsightsPage from './pages/EmployeeKnowledgeInsightsPage'
import MyHandoverPage from './pages/MyHandoverPage'
import PlannedFeaturePage from './pages/PlannedFeaturePage'
import LoginPage from './pages/LoginPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import ProjectsPage from './pages/ProjectsPage'
import JournalHistoryPage from './pages/JournalHistoryPage'
import EmployeeJournalHistoryPage from './pages/EmployeeJournalHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import ManagerNotificationsPage from './pages/ManagerNotificationsPage'
import MyDocumentsPage from './pages/MyDocumentsPage'
import RequestsSupportPage from './pages/RequestsSupportPage'
import ManagerRequestsSupportPage from './pages/ManagerRequestsSupportPage'

const PAGES = {
  dashboard: DashboardPage,
  projects: ProjectsPage,
  'project-journal': JournalHistoryPage,

  // Employee workspace
  notifications: NotificationsPage,
  'my-handover': MyHandoverPage,
  'my-documents': MyDocumentsPage,
  'requests-support': RequestsSupportPage,
  'employee-knowledge-graph': EmployeeKnowledgeGraphPage,
  'employee-knowledge-insights': EmployeeKnowledgeInsightsPage,

  // Manager workspace
  'manager-notifications': ManagerNotificationsPage,
  'manager-requests-support': ManagerRequestsSupportPage,

  // Employee features planned for Round 3
  'employee-ai-assistant': PlannedFeaturePage,
  'employee-ai-podcast': PlannedFeaturePage,
  'contribution-analytics': PlannedFeaturePage,
  'knowledge-portfolio': PlannedFeaturePage,
  'employee-reports-analytics': PlannedFeaturePage,

  // Project management
  'create-project': CreateProjectPage,
  'project-details': ProjectDetailsPage,
  'edit-project': EditProjectPage,
  'manage-members': ManageMembersPage,

  // Manager knowledge workspace
  upload: DocumentUploadPage,
  extraction: KnowledgeExtractionPage,
  insights: KnowledgeInsightsPage,
  'knowledge-graph': KnowledgeGraphPage,
  review: HandoverReviewPage,

  // Manager features planned for Round 3
  'audit-history': PlannedFeaturePage,
  'reports-analytics': PlannedFeaturePage,
}

function AppRoutes() {
  const { user, page } = useApp()

  if (!user) return <LoginPage />

  const allowed =
    user.role === 'manager'
      ? !EMPLOYEE_ONLY_PAGES.includes(page)
      : !MANAGER_ONLY_PAGES.includes(page)

  const CurrentPage = allowed
    ? page === 'project-journal' && user.role === 'employee'
      ? EmployeeJournalHistoryPage
      : PAGES[page] ?? DashboardPage
    : DashboardPage

  return (
    <AppLayout>
      <CurrentPage />
    </AppLayout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
      <ToastContainer />
    </AppProvider>
  )
}
