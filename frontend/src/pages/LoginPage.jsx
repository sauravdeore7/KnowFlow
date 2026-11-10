
// Sign-in screen. Authentication is handled by the KnowFlow FastAPI backend.
import { useState } from 'react'
import { useApp } from '../hooks/useApp'
import { isValidEmail } from '../utils/helpers'
import Alert from '../components/common/Alert'
import Button from '../components/common/Button'
import Icon from '../components/common/Icon'
import Logo from '../components/common/Logo'
import { TextField } from '../components/common/FormFields'

const ROLES = [
  {
    value: 'manager',
    label: 'Manager',
    hint: 'Create projects, review and approve handovers.',
  },
  {
    value: 'employee',
    label: 'Employee',
    hint: 'View approved handovers shared with you.',
  },
]

const DEMO_ACCOUNTS = [
  {
    label: 'Manager',
    role: 'manager',
    email: 'manager@knowflow.demo',
    password: 'KnowFlow@Manager2026',
  },
  {
    label: 'Employee',
    role: 'employee',
    email: 'employee@knowflow.demo',
    password: 'KnowFlow@Employee2026',
  },
  {
    label: 'Incoming Employee',
    role: 'employee',
    email: 'incoming@knowflow.demo',
    password: 'KnowFlow@Coming2026',
  },
]

export default function LoginPage() {
  const { login } = useApp()

  const [role, setRole] = useState('manager')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const roleLabel = role === 'manager' ? 'Manager' : 'Employee'

  function selectDemoAccount(account) {
    setRole(account.role)
    setEmail(account.email)
    setPassword(account.password)
    setErrors({})
    setFormError('')
    setShowPassword(false)
  }

  function validate() {
    const next = {}

    if (!email.trim()) {
      next.email = 'Email is required.'
    } else if (!isValidEmail(email)) {
      next.email = 'Enter a valid email address.'
    }

    if (!password) {
      next.password = 'Password is required.'
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.'
    }

    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const found = validate()
    setErrors(found)

    if (Object.keys(found).length > 0) return

    setLoading(true)

    try {
      await login({ email, password, role })
    } catch (error) {
      setFormError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden flex-col justify-between bg-slate-950 p-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-0 lg:p-10 xl:p-12">
        <div className="my-auto">
          <Logo className="text-5xl xl:text-6xl" />

          <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight text-white xl:text-4xl">
            Never lose the knowledge behind the work.
          </h2>

          <p className="mt-5 max-w-lg text-base leading-8 text-slate-300 xl:text-lg">
            KnowFlow turns scattered, authorised project information into
            structured, evidence-linked handovers that managers review
            and approve.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          CodersInPune Hackathon - Team AEGIS
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo tone="light" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Sign in
          </h1>

          <p className="mt-2 text-slate-500">
            Choose how you are accessing KnowFlow.
          </p>

          <div
            className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1"
            role="tablist"
          >
            {ROLES.map((item) => (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={role === item.value}
                onClick={() => {
                  setRole(item.value)
                  setFormError('')
                }}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  role === item.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {ROLES.find((item) => item.value === role).hint}
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-6 space-y-5"
          >
            {formError && (
              <Alert tone="error">
                {formError}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                  className="rounded-lg p-2 text-slate-400 hover:text-slate-600"
                >
                  <Icon
                    name={showPassword ? 'eyeOff' : 'eye'}
                    className="h-5 w-5"
                  />
                </button>
              }
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : `Sign in as ${roleLabel}`}
            </Button>
          </form>

          {/* Demo access for judges */}
          <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Demo Access
              </h3>

              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                For Judges
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Explore KnowFlow using the demo accounts below.
              Select an account to automatically fill the login form.
            </p>

            <div className="mt-4 space-y-3">
              {DEMO_ACCOUNTS.map((account) => (
                <div
                  key={account.email}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {account.label}
                      </p>

                      <p className="mt-0.5 break-all text-xs text-slate-500">
                        {account.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectDemoAccount(account)}
                      className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Use Account
                    </button>
                  </div>

                  <p className="mt-2 break-all text-xs text-slate-500">
                    Password: {account.password}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Demo accounts are provided for evaluation purposes.
              Please do not enter personal or sensitive information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
