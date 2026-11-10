// Sticky top bar: menu button (mobile), page title and the signed-in user.
import { PAGE_META } from '../../data/navigation'
import { useApp } from '../../hooks/useApp'
import Avatar from '../common/Avatar'
import Icon from '../common/Icon'

export default function TopBar({ onMenuClick }) {
  const { user, page } = useApp()
  const meta = PAGE_META[page] ?? { title: 'KnowFlow', subtitle: '' }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Icon name="menu" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
            {meta.title}
          </h1>
          <p className="hidden truncate text-sm text-slate-500 sm:block">{meta.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs capitalize text-slate-500">{user.role}</p>
          </div>
          <Avatar name={user.name} size="lg" />
        </div>
      </div>
    </header>
  )
}
