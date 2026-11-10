
import { useMemo, useRef, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Card, { CardHeader } from '../components/common/Card'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import Alert from '../components/common/Alert'
import EmptyState from '../components/common/EmptyState'
import Icon from '../components/common/Icon'
import { formatDate } from '../utils/helpers'
import {
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from '../services/documentService'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function getExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

function getFileType(filename) {
  return getExtension(filename).toUpperCase()
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function DocumentUploadPage() {
  const {
    projects,
    params,
    user,
    loadProjects,
    showToast,
    navigate,
  } = useApp()

  const fileInputRef = useRef(null)

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || '',
  )
  const [pendingFiles, setPendingFiles] = useState([])
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  )

  const totalDocuments = projects.reduce(
    (total, project) => total + (project.documents?.length || 0),
    0,
  )

  const projectsWithDocuments = projects.filter(
    (project) => (project.documents?.length || 0) > 0,
  ).length

  const visibleProjects = selectedProject ? [selectedProject] : projects

  function selectProject(projectId) {
    setSelectedProjectId(projectId)
    setPendingFiles([])
    setError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function addFiles(fileList) {
    setError('')

    if (!selectedProject) {
      setError('Please choose a destination project before selecting files.')
      return
    }

    const incomingFiles = Array.from(fileList || [])
    const validFiles = []

    for (const file of incomingFiles) {
      const extension = getExtension(file.name)

      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setError(`${file.name}: Unsupported file type. Use PDF, DOCX, TXT or MD.`)
        continue
      }

      if (file.size === 0) {
        setError(`${file.name}: This file is empty.`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: File size must not exceed 10 MB.`)
        continue
      }

      const alreadyAdded =
        pendingFiles.some((item) => item.file.name === file.name) ||
        selectedProject.documents?.some((doc) => doc.name === file.name)

      if (alreadyAdded) {
        setError(`${file.name}: This file is already selected or uploaded.`)
        continue
      }

      validFiles.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        authorised: false,
      })
    }

    if (validFiles.length > 0) {
      setPendingFiles((current) => [...current, ...validFiles])
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removePendingFile(id) {
    setPendingFiles((current) => current.filter((item) => item.id !== id))
  }

  function toggleAuthorisation(id) {
    setPendingFiles((current) =>
      current.map((item) =>
        item.id === id ? { ...item, authorised: !item.authorised } : item,
      ),
    )
  }

  async function handleUpload() {
    if (!selectedProject) {
      setError('Please select a project first.')
      return
    }

    const authorisedFiles = pendingFiles.filter((item) => item.authorised)

    if (authorisedFiles.length === 0) {
      setError('Confirm authorisation for at least one file before uploading.')
      return
    }

    if (!user?.accessToken) {
      setError('Your login session is missing. Please log in again.')
      return
    }

    setUploading(true)
    setError('')

    let successfulUploads = 0
    const uploadedIds = []

    try {
      for (const item of authorisedFiles) {
        await uploadDocument(
          user.accessToken,
          selectedProject.id,
          item.file,
        )

        successfulUploads += 1
        uploadedIds.push(item.id)
      }

      await loadProjects(user.accessToken)

      setPendingFiles((current) =>
        current.filter((item) => !uploadedIds.includes(item.id)),
      )

      showToast(
        `${successfulUploads} document${successfulUploads > 1 ? 's' : ''} uploaded successfully.`,
        'success',
      )
    } catch (uploadError) {
      if (successfulUploads > 0) {
        await loadProjects(user.accessToken)

        setPendingFiles((current) =>
          current.filter((item) => !uploadedIds.includes(item.id)),
        )
      }

      setError(
        successfulUploads > 0
          ? `${successfulUploads} document(s) uploaded successfully. ${uploadError.message}`
          : uploadError.message || 'Could not upload documents. Please try again.',
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleDownloadDocument(document) {
    if (!user?.accessToken) {
      setError('Your login session is missing. Please log in again.')
      return
    }

    setDownloadingId(document.id)
    setError('')

    try {
      const blob = await downloadDocument(
        user.accessToken,
        document.id,
      )

      const fileUrl = URL.createObjectURL(blob)
      const link = window.document.createElement('a')

      link.href = fileUrl
      link.download = document.name
      window.document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(fileUrl)

      showToast('Document downloaded successfully.', 'success')
    } catch (downloadError) {
      setError(downloadError.message || 'Could not download this document.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleRemoveDocument(document) {
    if (!selectedProject) return

    const confirmed = window.confirm(
      `Permanently delete "${document.name}" from this project?`,
    )

    if (!confirmed) return

    if (!user?.accessToken) {
      setError('Your login session is missing. Please log in again.')
      return
    }

    setDeletingId(document.id)
    setError('')

    try {
      await deleteDocument(user.accessToken, document.id)

      await loadProjects(user.accessToken)

      showToast('Document deleted successfully.', 'success')
    } catch (removeError) {
      setError(removeError.message || 'Could not delete this document.')
    } finally {
      setDeletingId(null)
    }
  }

  if (projects.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="folder"
          title="No projects available"
          description="Create a project before uploading its documents."
          action={
            <Button onClick={() => navigate('projects')}>
              View projects
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="folder-open" className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Document Centre
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage project files and knowledge sources
            </p>
          </div>
        </div>

        <Badge tone="info">Manager Workspace</Badge>
      </div>

      {/* OVERVIEW METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Documents</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalDocuments}</p>
              <p className="mt-1 text-xs text-slate-400">Across all projects</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon name="file-text" className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Projects</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{projects.length}</p>
              <p className="mt-1 text-xs text-slate-400">Managed project libraries</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Icon name="layers" className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Libraries</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{projectsWithDocuments}</p>
              <p className="mt-1 text-xs text-slate-400">Projects with documents</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon name="folder-check" className="h-6 w-6" />
            </div>
          </div>
        </Card>

      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* UPLOAD DOCUMENTS */}
      <Card>
        <CardHeader
          title="Upload Documents"
          subtitle="Add one or multiple authorised documents to a project library."
          action={<Badge tone="info">Multi-project</Badge>}
        />

        <div className="space-y-5 p-6">

          <div>
            <label
              htmlFor="document-project-select"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Choose destination project
            </label>

            <div className="relative">
              <select
                id="document-project-select"
                value={selectedProjectId}
                onChange={(event) => selectProject(event.target.value)}
                className="w-full appearance-none rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3.5 pr-11 text-sm font-semibold text-blue-900 outline-none transition hover:border-blue-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-700"
              />
            </div>

            {selectedProject ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="success">{selectedProject.status}</Badge>
                <span className="text-xs text-slate-500">
                  {selectedProject.documents?.length || 0} documents currently in this library
                </span>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium text-blue-700">
                Select a project to enable document upload.
              </p>
            )}
          </div>

          {/* DROP ZONE */}
          <div
            onDragOver={(event) => {
              event.preventDefault()
              if (selectedProject) setDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDragging(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDragging(false)
              addFiles(event.dataTransfer.files)
            }}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              !selectedProject
                ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                : dragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <Icon name="cloud-upload" className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Upload to a project library
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {selectedProject
                ? `Selected destination: ${selectedProject.name}`
                : 'Choose a project above before uploading documents.'}
            </p>

            <div className="mt-5">
              <Button
                variant="secondary"
                disabled={!selectedProject || uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="folder-open" className="h-4 w-4" />
                Browse files
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(event) => addFiles(event.target.files)}
            />

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['PDF', 'DOCX', 'TXT', 'MD'].map((type) => (
                <span key={type} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {type}
                </span>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Maximum file size: 10 MB per document
            </p>
          </div>

          {/* PENDING FILES */}
          {pendingFiles.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Selected files ({pendingFiles.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setPendingFiles([])} disabled={uploading}>
                  Clear all
                </Button>
              </div>

              <div className="space-y-3">
                {pendingFiles.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon name="file-text" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{item.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {getFileType(item.file.name)} · {formatFileSize(item.file.size)}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={item.authorised}
                        disabled={uploading}
                        onChange={() => toggleAuthorisation(item.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Authorised
                    </label>

                    <Button variant="ghost" size="sm" disabled={uploading} onClick={() => removePendingFile(item.id)}>
                      <Icon name="trash" className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <Alert tone="info" className="mt-4">
                Only files marked as authorised will be uploaded.
                Confirm that you have permission to use each document.
              </Alert>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={handleUpload}
                  loading={uploading}
                  disabled={!pendingFiles.some((item) => item.authorised)}
                >
                  <Icon name="upload" className="h-4 w-4" />
                  Upload authorised documents
                </Button>
              </div>
            </div>
          )}

          {/* AI INFORMATION */}
          <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600">
              <Icon name="sparkles" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">AI Knowledge Extraction</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Uploaded documents are stored as authorised project knowledge sources.
                AI extraction and source-linked insights will use these documents during knowledge processing.
              </p>
            </div>
          </div>

        </div>
      </Card>

      {/* PROJECT DOCUMENT LIBRARIES */}
      <Card>
        <CardHeader
          title="Project Document Libraries"
          subtitle={selectedProject ? 'Showing the selected project library.' : 'Choose a project to explore its document library.'}
          action={<Badge>{visibleProjects.length} projects</Badge>}
        />

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          {visibleProjects.map((project) => {
            const documentCount = project.documents?.length || 0
            const isSelected = project.id === selectedProjectId

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => selectProject(project.id)}
                aria-pressed={isSelected}
                className={`group rounded-xl border p-5 text-left transition ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50/70 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon name="folder" className="h-6 w-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    {project.status && <Badge tone="success">{project.status}</Badge>}
                    {isSelected && <Icon name="check-circle" className="h-5 w-5 text-blue-600" />}
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">{project.name}</h3>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Icon name="files" className="h-4 w-4" />
                    {documentCount} {documentCount === 1 ? 'document' : 'documents'}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                    View library
                    <Icon name="chevron-right" className="h-4 w-4" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* SELECTED PROJECT DOCUMENTS */}
      <Card>
        <CardHeader
          title={selectedProject ? `${selectedProject.name} — Documents` : 'Project documents'}
          subtitle={selectedProject ? 'Manage documents registered in this project knowledge library.' : 'Select a project above to view and manage its documents.'}
          action={selectedProject && <Badge tone="info">{selectedProject.documents?.length || 0} documents</Badge>}
        />

        {!selectedProject ? (
          <div className="p-6">
            <EmptyState
              icon="folder"
              title="No project selected"
              description="Choose a project from the dropdown or project libraries above to view and manage its documents."
            />
          </div>
        ) : !selectedProject.documents?.length ? (
          <div className="p-6">
            <EmptyState
              icon="file"
              title="No documents in this library"
              description="Upload authorised documents above to build this project's knowledge library."
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {selectedProject.documents.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon name="file-text" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{document.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {document.type} · {document.sizeKb} KB · {document.uploadedBy}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Added {formatDate(document.uploadedAt)}
                  </p>
                </div>

                <Badge>{document.sourceId}</Badge>

                <Button
                  variant="secondary"
                  size="sm"
                  loading={downloadingId === document.id}
                  disabled={downloadingId !== null || deletingId !== null}
                  onClick={() => handleDownloadDocument(document)}
                >
                  <Icon name="download" className="h-4 w-4" />
                  Download
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  loading={deletingId === document.id}
                  disabled={deletingId !== null || downloadingId !== null}
                  onClick={() => handleRemoveDocument(document)}
                >
                  <Icon name="trash" className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
