
import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'
import Icon from '../components/common/Icon'

const CATEGORIES = [
  {
    type: 'member',
    title: 'Team Members',
    subtitle: 'People contributing to the project',
    icon: 'users',
    color: 'violet',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-100',
    headerBg: 'bg-violet-50',
    dot: 'bg-violet-500',
  },
  {
    type: 'journal',
    title: 'Work Journals',
    subtitle: 'Daily work and activities',
    icon: 'bookOpen',
    color: 'cyan',
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-100',
    headerBg: 'bg-cyan-50',
    dot: 'bg-cyan-500',
  },
  {
    type: 'knowledge',
    title: 'Knowledge',
    subtitle: 'Captured project information',
    icon: 'brain',
    color: 'blue',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    headerBg: 'bg-blue-50',
    dot: 'bg-blue-500',
  },
  {
    type: 'document',
    title: 'Documents',
    subtitle: 'Supporting project sources',
    icon: 'fileText',
    color: 'emerald',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    headerBg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
  },
]

function createGraph(project) {
  if (!project) return { nodes: [], edges: [] }

  const members = project.members || []
  const journals = project.journalEntries || []
  const knowledge = project.knowledge?.items || []
  const documents = project.documents || []

  const nodes = []
  const edges = []

  const addNodes = (items, type, getLabel, getSubtitle) => {
    items.forEach((item, index) => {
      nodes.push({
        id: `${type}-${item.id || index}`,
        type,
        label: getLabel(item),
        subtitle: getSubtitle(item),
        data: item,
      })
    })
  }

  addNodes(
    members,
    'member',
    (item) => item.name || item.fullName || item.email || 'Team member',
    (item) => item.role || item.designation || 'Project member'
  )

  addNodes(
    journals,
    'journal',
    (item) => item.title || item.workTitle || 'Work journal',
    (item) => item.authorName || item.createdBy || 'Journal entry'
  )

  addNodes(
    knowledge,
    'knowledge',
    (item) => item.title || item.name || 'Knowledge item',
    (item) => item.category || item.type || 'Project knowledge'
  )

  addNodes(
    documents,
    'document',
    (item) => item.name || 'Untitled document',
    (item) => item.type || 'Project document'
  )

  members.forEach((member, index) => {
    journals.forEach((journal, journalIndex) => {
      const author =
        journal.authorId || journal.userId || journal.employeeId

      const memberId = member.id || member.userId

      if (
        author &&
        memberId &&
        String(author) === String(memberId)
      ) {
        edges.push({
          from: `member-${member.id || index}`,
          to: `journal-${journal.id || journalIndex}`,
        })
      }
    })
  })

  knowledge.forEach((item, index) => {
    const sourceId = item.sourceId || item.documentId

    if (!sourceId) return

    const documentIndex = documents.findIndex(
      (doc) => String(doc.id) === String(sourceId)
    )

    if (documentIndex !== -1) {
      edges.push({
        from: `knowledge-${item.id || index}`,
        to: `document-${documents[documentIndex].id || documentIndex}`,
      })
    }
  })

  return { nodes, edges }
}

function MetricCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

function KnowledgeNode({ node, category, connectionCount, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-xl border p-3.5 text-left transition-all duration-200 ${
        selected
          ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-100'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.iconBg} ${category.iconColor}`}>
          <Icon name={category.icon} className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold leading-5 text-slate-800">
            {node.label}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {node.subtitle}
          </p>
        </div>

        <Icon
          name="chevron-right"
          className={`mt-1 h-4 w-4 shrink-0 transition ${
            selected
              ? 'text-blue-600'
              : 'text-slate-300 group-hover:text-slate-500'
          }`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${category.dot}`} />
          {category.title.slice(0, -1)}
        </span>

        <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
          {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
        </span>
      </div>
    </button>
  )
}

function CategoryColumn({
  category,
  nodes,
  edges,
  selectedNode,
  onSelect,
}) {
  return (
    <div className="min-w-[250px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
      <div className={`border-b border-slate-200 px-4 py-4 ${category.headerBg}`}>
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ${category.iconColor}`}>
            <Icon name={category.icon} className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-800">
              {category.title}
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">
              {category.subtitle}
            </p>
          </div>

          <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
            {nodes.length}
          </span>
        </div>
      </div>

      <div className="min-h-[250px] space-y-3 p-3">
        {nodes.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-4 text-center">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${category.iconBg} ${category.iconColor}`}>
              <Icon name={category.icon} className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-600">
              No records yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Available records will appear here.
            </p>
          </div>
        ) : (
          nodes.map((node) => {
            const connectionCount = edges.filter(
              (edge) => edge.from === node.id || edge.to === node.id
            ).length

            return (
              <KnowledgeNode
                key={node.id}
                node={node}
                category={category}
                connectionCount={connectionCount}
                selected={selectedNode === node.id}
                onClick={() => onSelect(node.id)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

export default function EmployeeKnowledgeGraphPage() {
  const { projects = [] } = useApp()

  const [selectedProject, setSelectedProject] = useState(
    projects[0]?.id || ''
  )
  const [selectedNode, setSelectedNode] = useState(null)

  const project = projects.find(
    (item) => String(item.id) === String(selectedProject)
  )

  const graph = useMemo(
    () => createGraph(project),
    [project]
  )

  const groupedNodes = useMemo(() => {
    return CATEGORIES.map((category) => ({
      category,
      nodes: graph.nodes.filter(
        (node) => node.type === category.type
      ),
    }))
  }, [graph])

  const selectedDetails = graph.nodes.find(
    (node) => node.id === selectedNode
  )

  const metrics = [
    {
      label: 'Team Members',
      value: project?.members?.length || 0,
      icon: 'users',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      label: 'Work Journals',
      value: project?.journalEntries?.length || 0,
      icon: 'bookOpen',
      iconBg: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      label: 'Knowledge Items',
      value: project?.knowledge?.items?.length || 0,
      icon: 'brain',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Documents',
      value: project?.documents?.length || 0,
      icon: 'fileText',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <Icon name="network" className="h-4 w-4" />
            Knowledge & Intelligence
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Knowledge Graph
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Discover how people, daily work, project knowledge and documents
            are connected across your project.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700">
          <Icon name="eye" className="h-4 w-4" />
          Read-only access
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Project Workspace
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a project to explore its knowledge map.
            </p>
          </div>

          <select
            value={selectedProject}
            onChange={(event) => {
              setSelectedProject(event.target.value)
              setSelectedNode(null)
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-72"
          >
            {projects.length === 0 && (
              <option value="">No projects available</option>
            )}

            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {project && (
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <Icon name="folder" className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                  Current project
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {project.name}
                </h3>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white/80 px-4 py-2.5">
              <p className="text-xs text-slate-500">Total records</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">
                {graph.nodes.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {!project ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="folderOpen" className="h-7 w-7" />
          </span>
          <h3 className="mt-4 font-semibold text-slate-900">
            No project available
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Projects assigned to you will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Project Relationship Map
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Explore the four categories of connected project information.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                <Icon name="mousePointerClick" className="h-4 w-4" />
                Select a record to explore
              </div>
            </div>

            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {CATEGORIES.map((category) => (
                  <div key={category.type} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${category.dot}`} />
                    <span className="text-xs font-medium text-slate-600">
                      {category.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto p-4 sm:p-5">
              <div className="grid min-w-[1080px] grid-cols-4 gap-4">
                {groupedNodes.map(({ category, nodes }) => (
                  <CategoryColumn
                    key={category.type}
                    category={category}
                    nodes={nodes}
                    edges={graph.edges}
                    selectedNode={selectedNode}
                    onSelect={setSelectedNode}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Showing {graph.nodes.length} project records across four categories.
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {graph.edges.length} identified relationships
                </p>
              </div>
            </div>
          </div>

          {selectedDetails && (
            <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-blue-100 bg-blue-50/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
                    <Icon name="info" className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Record Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Explore the selected project record
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800"
                  aria-label="Close details"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {CATEGORIES.find(
                        (category) => category.type === selectedDetails.type
                      )?.title}
                    </span>
                    <h4 className="mt-3 text-lg font-bold text-slate-900">
                      {selectedDetails.label}
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDetails.subtitle}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Connections</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {graph.edges.filter(
                        (edge) =>
                          edge.from === selectedDetails.id ||
                          edge.to === selectedDetails.id
                      ).length}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Available record information
                  </p>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
                    {JSON.stringify(selectedDetails.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icon name="shieldCheck" className="h-5 w-5" />
          </span>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Project Knowledge Access
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This is a read-only view of the project records currently
              available in KnowFlow. Employees can explore the information
              without changing project knowledge or its relationships.
              Actual project-level access must be enforced by the backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
