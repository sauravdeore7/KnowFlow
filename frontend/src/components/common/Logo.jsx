// KnowFlow wordmark. tone="dark" is for dark backgrounds (sidebar), "light" for white pages.
export default function Logo({ tone = 'dark', tagline = false, className = 'text-3xl' }) {
  return (
    <div>
      <p className={`font-bold tracking-tight ${tone === 'dark' ? 'text-white' :
        'text-slate-900'} ${className}`}>
        Know<span className="text-brand-400">Flow</span>
      </p>
      {tagline && (
        <p className={`mt-1 text-sm ${tone === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
          Project Knowledge Management
        </p>
      )}
    </div>
  )
}
