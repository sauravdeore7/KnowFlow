
import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'
import { downloadDocument } from '../services/documentService'

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatFileSize(sizeKb) {
  if (sizeKb === undefined || sizeKb === null) return 'Size unavailable'

  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1)} MB`
  }

  return `${sizeKb} KB`
}

function getVersion(doc) {
  return doc.version || doc.versionNumber || doc.currentVersion || null
}

function MetricCard({ label, value, icon, color, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function DocumentRow({ document, onDownload, downloading }) {
  const version = getVersion(document.doc)

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 last:border-0 sm:flex-row sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon name="fileText" className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-slate-900">
          {document.doc.name || 'Untitled document'}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{document.doc.type || 'File'}</span>
          <span>{formatFileSize(document.doc.sizeKb)}</span>
          <span>Uploaded by {document.doc.uploadedBy || 'Unknown'}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>{document.project.name}</span>
          <span>·</span>
          <span>{formatDate(document.doc.uploadedAt)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
        {version ? (
          <span className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            Version {version}
          </span>
        ) : (
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
            Version not tracked
          </span>
        )}

        <button
          type="button"
          onClick={() => onDownload(document.doc)}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            name={downloading ? 'loader' : 'download'}
            className={`h-4 w-4 ${downloading ? 'animate-spin' : ''}`}
          />
          {downloading ? 'Downloading...' : 'Download'}
        </button>
      </div>
    </div>
  )
}

export default function MyDocumentsPage() {
  const { projects = [], user, showToast } = useApp()

  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [downloadingId, setDownloadingId] = useState(null)

  async function handleDownload(doc) {
    if (!doc.id) {
      showToast?.('Document ID is unavailable.', 'error')
      return
    }

    if (!user?.accessToken) {
      showToast?.('Please log in again to download this document.', 'error')
      return
    }

    setDownloadingId(doc.id)

    try {
      const blob = await downloadDocument(user.accessToken, doc.id)
      const fileUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = fileUrl
      link.download = doc.name || 'document'
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.URL.revokeObjectURL(fileUrl)

      showToast?.('Document downloaded successfully.')
    } catch (error) {
      showToast?.(error.message || 'Unable to download document.', 'error')
    } finally {
      setDownloadingId(null)
    }
  }

  const documents = useMemo(() => {
    return projects.flatMap((project) =>
      (project.documents || []).map((doc) => ({
        doc,
        project,
      }))
    ).sort((a, b) => {
      return new Date(b.doc.uploadedAt || 0) - new Date(a.doc.uploadedAt || 0)
    })
  }, [projects])

  const recentDocuments = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    return documents.filter(({ doc }) => {
      const date = new Date(doc.uploadedAt).getTime()
      return Number.isFinite(date) && date >= sevenDaysAgo
    })
  }, [documents])

  const projectsWithDocuments = new Set(
    documents.map(({ project }) => project.id)
  ).size

  const filteredDocuments = useMemo(() => {
    return documents.filter(({ doc, project }) => {
      const matchesProject =
        selectedProject === 'all' || project.id === selectedProject

      const searchText = search.trim().toLowerCase()

      const matchesSearch =
        !searchText ||
        [
          doc.name,
          doc.type,
          doc.uploadedBy,
          project.name,
          doc.sourceId,
        ].some((value) =>
          String(value || '').toLowerCase().includes(searchText)
        )

      const uploadedTime = new Date(doc.uploadedAt).getTime()
      const isRecent =
        Number.isFinite(uploadedTime) &&
        uploadedTime >= Date.now() - 7 * 24 * 60 * 60 * 1000

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'recent' && isRecent)

      return matchesProject && matchesSearch && matchesFilter
    })
  }, [documents, selectedProject, search, activeFilter])

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Icon name="folder" className="h-4 w-4" />
            Work & Collaboration
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            My Documents
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Access documents shared across your assigned projects.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700">
          <Icon name="lock" className="h-4 w-4" />
          Assigned projects only
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="All Documents"
          value={documents.length}
          icon="fileText"
          color="bg-blue-50 text-blue-600"
          description="Available in your projects"
        />

        <MetricCard
          label="Recently Added"
          value={recentDocuments.length}
          icon="clock"
          color="bg-emerald-50 text-emerald-600"
          description="Uploaded in the last 7 days"
        />

        <MetricCard
          label="Projects with Documents"
          value={projectsWithDocuments}
          icon="folder"
          color="bg-violet-50 text-violet-600"
          description="Assigned projects containing files"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Document Library
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Browse and find your project documents.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-64">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search documents..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={selectedProject}
                onChange={(event) => setSelectedProject(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Documents
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('recent')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeFilter === 'recent'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Recently Added
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Available Documents
          </p>
          <span className="text-xs font-medium text-slate-500">
            {filteredDocuments.length} results
          </span>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon name="fileText" className="h-7 w-7" />
            </span>

            <h3 className="mt-4 font-semibold text-slate-900">
              No documents found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try changing your search or project filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setSelectedProject('all')
                setActiveFilter('all')
              }}
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div>
            {filteredDocuments.map((document) => (
              <DocumentRow
                key={`${document.project.id}-${document.doc.id}`}
                document={document}
                onDownload={handleDownload}
                downloading={downloadingId === document.doc.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Icon name="lock" className="h-5 w-5" />
          </span>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Project document access
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This library displays documents from projects assigned to you.
              Document access remains subject to your project permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
