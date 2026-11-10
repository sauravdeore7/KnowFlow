// Search box with a magnifier icon. Controlled: pass value and onChange(text).
import Icon from './Icon'

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5
        text-slate-400">
        <Icon name="search" className="h-4 w-4" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3
          text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none
          focus:ring-2 focus:ring-brand-100"
      />
    </div>
  )
}
