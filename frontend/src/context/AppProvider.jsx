
import { useCallback, useMemo, useState } from 'react'
import { AppContext } from './AppContext'
import { loginUser } from '../services/authService'
import {
  fetchProjects,
  createProject as createProjectRequest,
  updateProject as updateProjectRequest,
} from '../services/projectService'

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [route, setRoute] = useState({
    page: 'dashboard',
    params: {},
  })
  const [projects, setProjects] = useState([])
  const [projectsStatus, setProjectsStatus] = useState('idle')
  const [projectsError, setProjectsError] = useState('')
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()

    setToasts((current) => [
      ...current,
      { id, message, type },
    ])

    setTimeout(() => dismissToast(id), 4000)
  }, [dismissToast])

  const loadProjects = useCallback(async (accessToken) => {
    if (!accessToken) {
      setProjects([])
      setProjectsStatus('idle')
      return
    }

    setProjectsStatus('loading')
    setProjectsError('')

    try {
      const data = await fetchProjects(accessToken)
      setProjects(data)
      setProjectsStatus('ready')
    } catch (error) {
      setProjectsError(error.message)
      setProjectsStatus('error')
    }
  }, [])

  const navigate = useCallback((page, params = {}) => {
    setRoute({ page, params })
    window.scrollTo(0, 0)
  }, [])

  const login = useCallback(async (credentials) => {
    const signedIn = await loginUser(credentials)

    setUser(signedIn)
    setRoute({
      page: 'dashboard',
      params: {},
    })

    await loadProjects(signedIn.accessToken)

    return signedIn
  }, [loadProjects])

  const logout = useCallback(() => {
    setUser(null)
    setProjects([])
    setProjectsStatus('idle')
    setProjectsError('')
    setRoute({
      page: 'dashboard',
      params: {},
    })
  }, [])

  const addProject = useCallback(async (details) => {
    if (!user?.accessToken) {
      throw new Error('Please log in again to create a project.')
    }

    const created = await createProjectRequest(
      user.accessToken,
      details,
      user.email,
    )

    setProjects((current) => [
      created,
      ...current.filter((project) => project.id !== created.id),
    ])

    return created
  }, [user])

  const updateProject = useCallback(async (id, changes) => {
    if (!user?.accessToken) {
      throw new Error('Please log in again to update this project.')
    }

    const updated = await updateProjectRequest(
      user.accessToken,
      id,
      changes,
    )

    setProjects((current) =>
      current.map((project) =>
        project.id === id
          ? { ...project, ...updated }
          : project,
      ),
    )

    return updated
  }, [user])

  const visibleProjects = useMemo(() => {
    if (!user) return []

    if (user.role === 'manager') {
      return projects
    }

    return projects.filter((project) =>
      project.members.some(
        (member) => member.email === user.email,
      ),
    )
  }, [user, projects])

  const getProjectById = useCallback(
    (id) => visibleProjects.find((project) => project.id === id),
    [visibleProjects],
  )

  const value = {
    user,
    isManager: user?.role === 'manager',
    page: route.page,
    params: route.params,
    navigate,
    login,
    logout,
    projects: visibleProjects,
    projectsStatus,
    projectsError,
    loadProjects,
    addProject,
    updateProject,
    getProjectById,
    toasts,
    showToast,
    dismissToast,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
