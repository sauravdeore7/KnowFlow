
import { useMemo, useState } from 'react'
import { useApp } from '../hooks/useApp'

const NODE_STYLES = {
  member: {
    color: '#7c3aed',
    light: '#f3e8ff',
    label: 'Team Members',
    icon: '👤',
    x: 30,
  },
  journal: {
    color: '#0891b2',
    light: '#cffafe',
    label: 'Journal Entries',
    icon: '📓',
    x: 350,
  },
  knowledge: {
    color: '#2563eb',
    light: '#dbeafe',
    label: 'Knowledge Findings',
    icon: '🧠',
    x: 670,
  },
  document: {
    color: '#059669',
    light: '#d1fae5',
    label: 'Project Documents',
    icon: '📄',
    x: 990,
  },
}

const NODE_WIDTH = 260
const NODE_HEIGHT = 82
const NODE_GAP = 120

const ALL_TYPES = Object.keys(NODE_STYLES)

function getText(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ')
  }

  if (value === null || value === undefined || value === '') {
    return 'Not recorded'
  }

  return String(value)
}

function getSourceDescription(source, journals, documents) {
  if (!source) return 'Source not recorded'

  const journal = journals.find((item) => item.id === source)

  if (journal) {
    return `Journal entry · ${journal.date || 'Unknown date'}`
  }

  const document = documents.find(
    (item) => item.sourceId === source || item.id === source,
  )

  if (document) {
    return `Document · ${document.name}`
  }

  if (source === 'journal') return 'Journal source'
  if (source === 'document') return 'Document source'

  return 'Recorded project source'
}

function createGraph(project) {
  const members = project.members || []
  const journals = project.journalEntries || []
  const knowledge = project.knowledge?.items || []
  const documents = project.documents || []

  const collections = {
    member: members,
    journal: journals,
    knowledge,
    document: documents,
  }

  const maxItems = Math.max(
    ...Object.values(collections).map((items) => items.length),
    1,
  )

  const height = Math.max(650, 340 + (maxItems - 1) * NODE_GAP + 170)

  const nodes = []

  Object.entries(collections).forEach(([type, items]) => {
    const style = NODE_STYLES[type]

    items.forEach((item, index) => {
      const label =
        type === 'member'
          ? item.name
          : type === 'journal'
            ? item.workSummary || 'Journal Entry'
            : type === 'knowledge'
              ? item.text
              : item.name

      const subtitle =
        type === 'member'
          ? item.role
          : type === 'journal'
            ? `${item.createdBy || 'Team Member'} · ${item.date || ''}`
            : type === 'knowledge'
              ? item.type
              : `${item.type || 'Document'} · ${item.sizeKb || 0} KB`

      nodes.push({
        id: `${type}-${item.id}`,
        recordId: item.id,
        type,
        x: style.x,
        y: 270 + index * NODE_GAP,
        label: getText(label),
        subtitle: getText(subtitle),
        source: item,
      })
    })
  })

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  const edges = []

  // Link journal entries to their recorded authors.
  journals.forEach((journal) => {
    const author = members.find(
      (member) =>
        member.name?.trim().toLowerCase() ===
        journal.createdBy?.trim().toLowerCase(),
    )

    if (!author) return

    edges.push({
      id: `author-${journal.id}`,
      from: `member-${author.id}`,
      to: `journal-${journal.id}`,
      label: 'AUTHORED',
      color: '#8b5cf6',
    })
  })

  // Link findings to the actual journal or document recorded as their source.
  knowledge.forEach((finding) => {
    if (!finding.source) return

    const sourceJournal = journals.find(
      (journal) => journal.id === finding.source,
    )

    const sourceDocument = documents.find(
      (document) =>
        document.id === finding.source ||
        document.sourceId === finding.source,
    )

    const sourceNode = sourceJournal
      ? `journal-${sourceJournal.id}`
      : sourceDocument
        ? `document-${sourceDocument.id}`
        : null

    if (!sourceNode || !nodeMap.has(sourceNode)) return

    edges.push({
      id: `source-${finding.id}`,
      from: sourceNode,
      to: `knowledge-${finding.id}`,
      label: 'SOURCE',
      color: '#3b82f6',
    })
  })

  return {
    nodes,
    edges,
    height,
    collections,
  }
}

function GraphNode({ node, selected, onSelect }) {
  const style = NODE_STYLES[node.type]

  const label =
    node.label.length > 31
      ? `${node.label.slice(0, 31)}...`
      : node.label

  const subtitle =
    node.subtitle.length > 32
      ? `${node.subtitle.slice(0, 32)}...`
      : node.subtitle

  return (
    <g
      onClick={() => onSelect(node)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(node)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View ${style.label}: ${node.label}`}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      <rect
        x={node.x}
        y={node.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="13"
        fill={selected ? style.light : '#ffffff'}
        stroke={selected ? style.color : '#e2e8f0'}
        strokeWidth={selected ? 2.5 : 1.4}
        style={{
          filter: selected ? 'drop-shadow(0px 5px 9px #94a3b855)' : 'none',
          transition: 'all 0.2s ease',
        }}
      />

      <rect
        x={node.x}
        y={node.y + 1}
        width="5"
        height={NODE_HEIGHT - 2}
        rx="2"
        fill={style.color}
      />

      <circle
        cx={node.x + 25}
        cy={node.y + 27}
        r="11"
        fill={style.light}
      />

      <circle
        cx={node.x + 25}
        cy={node.y + 27}
        r="4"
        fill={style.color}
      />

      <text
        x={node.x + 45}
        y={node.y + 29}
        fill="#1e293b"
        fontSize="12"
        fontWeight="700"
      >
        {label}
      </text>

      <text
        x={node.x + 45}
        y={node.y + 52}
        fill={style.color}
        fontSize="10"
        fontWeight="600"
      >
        {subtitle}
      </text>

      {selected && (
        <circle
          cx={node.x + NODE_WIDTH - 15}
          cy={node.y + 15}
          r="5"
          fill={style.color}
        />
      )}
    </g>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium leading-6 text-slate-700">
        {getText(value)}
      </p>
    </div>
  )
}

function NodeDetails({ node, project }) {
  if (!node) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <div className="text-3xl">🔎</div>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          Explore a knowledge node
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Select any node in the graph to inspect its actual project record.
        </p>
      </div>
    )
  }

  const item = node.source
  const style = NODE_STYLES[node.type]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: style.light }}
        >
          {style.icon}
        </div>

        <div className="min-w-0">
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: style.color }}
          >
            {style.label}
          </span>

          <h3 className="mt-1 break-words font-bold text-slate-900">
            {node.label}
          </h3>
        </div>
      </div>

      <div className="mt-4">
        {node.type === 'member' && (
          <>
            <DetailRow label="Name" value={item.name} />
            <DetailRow label="Email" value={item.email} />
            <DetailRow label="Role" value={item.role} />
            <DetailRow
              label="Departing member"
              value={item.departing ? 'Yes' : 'No'}
            />
          </>
        )}

        {node.type === 'journal' && (
          <>
            <DetailRow label="Author" value={item.createdBy} />
            <DetailRow label="Entry date" value={item.date} />
            <DetailRow label="Work summary" value={item.workSummary} />
            <DetailRow label="Completed tasks" value={item.completedTasks} />
            <DetailRow label="Decisions" value={item.decisions} />
            <DetailRow label="Blockers" value={item.blockers} />
            <DetailRow label="Dependencies" value={item.dependencies} />
            <DetailRow label="Pending tasks" value={item.pendingTasks} />
            <DetailRow label="Next steps" value={item.nextSteps} />
          </>
        )}

        {node.type === 'knowledge' && (
          <>
            <DetailRow label="Finding type" value={item.type} />
            <DetailRow label="Finding" value={item.text} />
            <DetailRow
              label="Recorded source"
              value={getSourceDescription(
                item.source,
                project.journalEntries || [],
                project.documents || [],
              )}
            />
          </>
        )}

        {node.type === 'document' && (
          <>
            <DetailRow label="Document name" value={item.name} />
            <DetailRow label="File type" value={item.type} />
            <DetailRow label="File size" value={`${item.sizeKb || 0} KB`} />
            <DetailRow label="Uploaded by" value={item.uploadedBy} />
            <DetailRow label="Uploaded at" value={item.uploadedAt} />
          </>
        )}

        <DetailRow label="Record ID" value={node.recordId} />
      </div>
    </div>
  )
}

export default function KnowledgeGraphPage() {
  const { projects, params } = useApp()

  const [selectedProjectId, setSelectedProjectId] = useState(
    params.projectId || '',
  )

  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTypes, setActiveTypes] = useState(ALL_TYPES)

  const project = projects.find(
    (item) => item.id === selectedProjectId,
  )

  const graph = useMemo(
    () => (project ? createGraph(project) : null),
    [project],
  )

  const visibleNodes = useMemo(() => {
    if (!graph) return []

    const query = search.trim().toLowerCase()

    return graph.nodes.filter((node) => {
      const matchesType = activeTypes.includes(node.type)

      const matchesSearch =
        !query ||
        node.label.toLowerCase().includes(query) ||
        node.subtitle.toLowerCase().includes(query)

      return matchesType && matchesSearch
    })
  }, [graph, activeTypes, search])

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  )

  const visibleEdges = useMemo(() => {
    if (!graph) return []

    return graph.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.from) &&
        visibleNodeIds.has(edge.to),
    )
  }, [graph, visibleNodeIds])

  const selectedNode = visibleNodes.find(
    (node) => node.id === selectedNodeId,
  )

  const totalNodes = graph?.nodes.length || 0
  const totalConnections = graph?.edges.length || 0

  function toggleType(type) {
    setActiveTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    )
    setSelectedNodeId(null)
  }

  function selectProject(projectId) {
    setSelectedProjectId(projectId)
    setSelectedNodeId(null)
    setSearch('')
    setActiveTypes(ALL_TYPES)
  }

  if (!projects.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">
          No projects available
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create a project before exploring its Knowledge Graph.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Knowledge Graph
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Explore how people, project activity, knowledge and documents connect.
          </p>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          Manager Workspace
        </span>
      </div>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <h3 className="font-bold text-blue-950">Select Project</h3>
        <p className="mt-1 text-sm text-blue-800">
          Explore the relationships formed from the project's recorded information.
        </p>

        <select
          value={selectedProjectId}
          onChange={(event) => selectProject(event.target.value)}
          className="mt-4 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Choose a project...</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </section>

      {!project ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
          <div className="text-4xl">🕸️</div>
          <h3 className="mt-3 font-semibold text-slate-800">
            Select a project to explore its graph
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Its members, journals, documents and knowledge findings will appear as connected nodes.
          </p>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Project Knowledge Network
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {project.name}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {project.knowledge?.summary || project.description}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Live project records
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'Team Members',
                  value: project.members?.length || 0,
                  color: 'text-violet-700',
                },
                {
                  label: 'Journal Entries',
                  value: project.journalEntries?.length || 0,
                  color: 'text-cyan-700',
                },
                {
                  label: 'Knowledge Findings',
                  value: project.knowledge?.items?.length || 0,
                  color: 'text-blue-700',
                },
                {
                  label: 'Documents',
                  value: project.documents?.length || 0,
                  color: 'text-emerald-700',
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-bold text-slate-900">
                {totalNodes}
              </p>
              <p className="mt-1 text-xs text-slate-500">Total Nodes</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-bold text-blue-700">
                {totalConnections}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Verified Connections
              </p>
            </div>

            <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-1">
              <p className="text-2xl font-bold text-emerald-700">
                {visibleNodes.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Currently Visible
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Interactive Relationship Map
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Search, filter and select nodes to explore project knowledge.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {visibleEdges.length} connections shown
                </span>
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members, journals, findings or documents..."
                className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {ALL_TYPES.map((type) => {
                  const style = NODE_STYLES[type]
                  const active = activeTypes.includes(type)
                  const count = graph.collections[type].length

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleType(type)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        active
                          ? 'border-slate-300 bg-white text-slate-800 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: active ? style.color : '#cbd5e1',
                        }}
                      />
                      {style.label}
                      <span className="text-slate-400">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {graph.nodes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl">🕸️</div>
                <h3 className="mt-3 font-semibold text-slate-800">
                  No graph records available
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add members, journals, documents or knowledge findings to build this graph.
                </p>
              </div>
            ) : visibleNodes.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-semibold text-slate-800">
                  No matching nodes found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term or enable more node categories.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-slate-50 p-3 sm:p-5">
                <svg
                  viewBox={`0 0 1320 ${graph.height}`}
                  width="1320"
                  height={graph.height}
                  role="img"
                  aria-label={`Interactive knowledge graph for ${project.name}`}
                  className="max-w-none"
                >
                  <defs>
                    <filter id="graph-shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="3"
                        stdDeviation="4"
                        floodColor="#64748b"
                        floodOpacity="0.12"
                      />
                    </filter>
                  </defs>

                  {/* Project root */}
                  <rect
                    x="490"
                    y="35"
                    width="340"
                    height="90"
                    rx="18"
                    fill="#172554"
                    filter="url(#graph-shadow)"
                  />

                  <text
                    x="660"
                    y="69"
                    textAnchor="middle"
                    fill="#bfdbfe"
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="2"
                  >
                    PROJECT ROOT
                  </text>

                  <text
                    x="660"
                    y="96"
                    textAnchor="middle"
                    fill="white"
                    fontSize="15"
                    fontWeight="700"
                  >
                    {project.name.length > 38
                      ? `${project.name.slice(0, 38)}...`
                      : project.name}
                  </text>

                  {/* Project-to-category connections */}
                  {ALL_TYPES.map((type) => {
                    const style = NODE_STYLES[type]
                    const centerX = style.x + NODE_WIDTH / 2

                    return (
                      <g key={`branch-${type}`}>
                        <path
                          d={`M 660 125 C 660 165, ${centerX} 145, ${centerX} 195`}
                          fill="none"
                          stroke={style.color}
                          strokeWidth="2"
                          strokeDasharray="5 6"
                          opacity="0.45"
                        />

                        <circle
                          cx={centerX}
                          cy="195"
                          r="6"
                          fill={style.color}
                        />

                        <text
                          x={centerX}
                          y="225"
                          textAnchor="middle"
                          fill={style.color}
                          fontSize="11"
                          fontWeight="700"
                          letterSpacing="1"
                        >
                          {style.label.toUpperCase()}
                        </text>
                      </g>
                    )
                  })}

                  {/* Category-to-record guide lines */}
                  {visibleNodes.map((node) => {
                    const centerX = node.x + NODE_WIDTH / 2

                    return (
                      <line
                        key={`guide-${node.id}`}
                        x1={centerX}
                        y1="205"
                        x2={centerX}
                        y2={node.y}
                        stroke={NODE_STYLES[node.type].color}
                        strokeWidth="1"
                        strokeDasharray="3 7"
                        opacity="0.15"
                      />
                    )
                  })}

                  {/* Verified record-to-record relationships */}
                  {visibleEdges.map((edge) => {
                    const from = graph.nodes.find(
                      (node) => node.id === edge.from,
                    )

                    const to = graph.nodes.find(
                      (node) => node.id === edge.to,
                    )

                    if (!from || !to) return null

                    const fromX = from.x + NODE_WIDTH
                    const fromY = from.y + NODE_HEIGHT / 2
                    const toX = to.x
                    const toY = to.y + NODE_HEIGHT / 2
                    const middleX = (fromX + toX) / 2

                    return (
                      <g key={edge.id}>
                        <path
                          d={`M ${fromX} ${fromY} C ${middleX} ${fromY}, ${middleX} ${toY}, ${toX} ${toY}`}
                          fill="none"
                          stroke={edge.color}
                          strokeWidth="2.5"
                          opacity="0.75"
                        />

                        <circle
                          cx={toX}
                          cy={toY}
                          r="4"
                          fill={edge.color}
                        />
                      </g>
                    )
                  })}

                  {/* Selectable nodes */}
                  {visibleNodes.map((node) => (
                    <GraphNode
                      key={node.id}
                      node={node}
                      selected={selectedNodeId === node.id}
                      onSelect={(selected) =>
                        setSelectedNodeId(selected.id)
                      }
                    />
                  ))}
                </svg>
              </div>
            )}

            <div className="border-t border-slate-200 bg-white p-4">
              <p className="text-xs leading-6 text-slate-500">
                <span className="font-semibold text-slate-700">
                  Relationship guide:
                </span>
                {' '}Dashed lines represent project grouping. Solid purple lines
                indicate journal authorship. Solid blue lines connect knowledge
                findings to their recorded journal or document source.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <NodeDetails
              node={selectedNode}
              project={project}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-slate-900">
                Relationship Summary
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Verified connections derived from existing project records.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-violet-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-violet-900">
                      Journal Authorship
                    </p>
                    <p className="mt-1 text-xs text-violet-700">
                      Journals matched to their recorded authors
                    </p>
                  </div>
                  <span className="text-xl font-bold text-violet-700">
                    {graph.edges.filter((edge) => edge.label === 'AUTHORED').length}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Source Connections
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      Findings matched to source records
                    </p>
                  </div>
                  <span className="text-xl font-bold text-blue-700">
                    {graph.edges.filter((edge) => edge.label === 'SOURCE').length}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Data integrity
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Connections are displayed only when their source IDs or
                    recorded author names match actual project records.
                    Unmatched relationships are not fabricated.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">
          About this Knowledge Graph
        </p>
        <p className="mt-1 text-sm leading-6 text-blue-800">
          The graph visualizes actual project members, journal entries,
          extracted knowledge findings and uploaded documents. Relationships
          are derived from recorded authorship and source references.
          Advanced semantic relationship discovery can be introduced in a
          future version.
        </p>
      </div>
    </div>
  )
}
