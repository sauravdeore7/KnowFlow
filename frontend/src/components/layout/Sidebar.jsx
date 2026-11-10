
import { NAV_ITEMS, PAGE_TO_NAV } from '../../data/navigation'
import { useApp } from '../../hooks/useApp'
import Icon from '../common/Icon'
import Logo from '../common/Logo'

export default function Sidebar({ open, onClose }) {
  const { user, page, navigate, logout } = useApp()

  const activeKey = PAGE_TO_NAV[page] ?? page
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role))

  const workspaceItems = items.filter(
    (item) => item.section === 'workspace'
  )

  const collaborationItems = items.filter(
    (item) => item.section === 'collaboration'
  )

  const governanceItems = items.filter(
    (item) => item.section === 'governance'
  )

  function go(key) {
    navigate(key)
    onClose()
  }

  function renderItems(groupItems) {
    return groupItems.map((item) => {
      const active = item.key === activeKey

      return (
        <li key={item.key}>
          <button
            type="button"
            onClick={() => go(item.key)}
            aria-current={active ? 'page' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left
              text-sm font-medium transition
              ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
          >
            <Icon name={item.icon} className="h-5 w-5 shrink-0" />

            <span className="min-w-0 flex-1">{item.label}</span>

            {item.badge && (
              <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                {item.badge}
              </span>
            )}
          </button>
        </li>
      )
    })
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 px-5 py-8
          transition-transform duration-200 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-2">
          <Logo tagline />
        </div>

        <nav
          className="mt-10 flex-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <ul className="mt-4 space-y-1.5">
            {renderItems(workspaceItems)}
          </ul>

          {collaborationItems.length > 0 && (
            <div className="mt-8">
              <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Work & Collaboration
              </p>

              <ul className="space-y-1.5">
                {renderItems(collaborationItems)}
              </ul>
            </div>
          )}

          {governanceItems.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between px-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Governance
                </p>

                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  Planned
                </span>
              </div>

              <ul className="space-y-1.5">
                {renderItems(governanceItems)}
              </ul>
            </div>
          )}
        </nav>

        <div className="border-t border-slate-800 px-2 pt-5">
          <p className="text-sm text-slate-400">Logged in as</p>

          <p className="mt-1 text-base font-semibold capitalize text-white">
            {user.role}
          </p>

          <button
            type="button"
            onClick={logout}
            className="mt-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
