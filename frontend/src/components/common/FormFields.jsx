// Form inputs: TextField, TextArea and SelectField. All show a label and an error message.
import { useId } from 'react'

const BASE =
  'block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50'

function fieldClass(error) {
  return `${BASE} ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
  }`
}

function FieldShell({ id, label, error, hint, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

// endAdornment lets a parent place a button inside the field (e.g. show/hide password).
export function TextField({ label, error, hint, endAdornment, className = '', ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={`${fieldClass(error)} ${endAdornment ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center
            pr-2">{endAdornment}</div>
        )}
      </div>
    </FieldShell>
  )
}

export function TextArea({ label, error, hint, className = '', ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        rows={4}
        aria-invalid={Boolean(error)}
        className={`${fieldClass(error)} resize-y ${className}`}
        {...props}
      />
    </FieldShell>
  )
}

export function SelectField({ label, error, hint, options, className = '', ...props }) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select id={id} className={`${fieldClass(error)} ${className}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
