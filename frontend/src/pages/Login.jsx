import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Spinner from '../components/Spinner'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const res = await api.post(path, { email, password })
      if (!res.ok) {
        setError(res.error?.message || 'Authentication failed.')
        return
      }
      localStorage.setItem('cv_token', res.token)
      localStorage.setItem('cv_userId', res.userId)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Left panel */}
      <div className="hidden md:flex md:w-1/2 bg-surface-container-lowest flex-col justify-between p-margin-page relative overflow-hidden border-r border-white/[0.08]">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top left, #4d8eff 0%, transparent 40%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-primary-container text-[32px] filled">schema</span>
            <span className="font-h1 text-h1 text-on-surface">Codebase Visualizer</span>
          </div>
          <p className="font-h2 text-h2 text-on-surface-variant max-w-md mt-sm">
            Turn any GitHub repo into actionable insights.
          </p>
        </div>
        <div className="relative z-10 flex flex-col gap-lg mt-xl">
          {[
            { icon: 'account_tree', color: 'text-primary', title: 'Dependency Graphs', desc: 'Visualize complex relationships and identify architectural bottlenecks instantly.' },
            { icon: 'speed', color: 'text-secondary', title: 'Complexity Metrics', desc: 'Track cyclomatic complexity and maintainability indices over time.' },
            { icon: 'warning', color: 'text-error', title: 'Hotspot Detection', desc: 'Pinpoint high-churn, low-coverage files that require immediate refactoring.' },
            { icon: 'auto_awesome', color: 'text-tertiary', title: 'AI Insights', desc: 'Get Claude-powered architecture summaries and refactoring suggestions.' },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} className="flex items-start gap-md">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-white/[0.08]">
                <span className={`material-symbols-outlined ${color}`}>{icon}</span>
              </div>
              <div>
                <h3 className="font-body-base text-body-base font-semibold text-on-surface">{title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative z-10 mt-xl">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Trusted by engineers worldwide.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-gutter bg-[#161b27] relative overflow-y-auto">
        <div className="w-full max-w-[420px] glass rounded-xl p-lg shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          {/* Tab switcher */}
          <div className="flex mb-lg bg-surface-container-highest rounded-lg p-unit">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError('') }}
                className={`flex-1 py-sm text-center font-body-base text-body-base font-medium rounded transition-all ${mode === tab ? 'tab-active' : 'tab-inactive'}`}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div className="text-center mb-sm">
              <h2 className="font-h2 text-h2 text-on-surface">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                {mode === 'login' ? 'Enter your details to access your workspaces.' : 'Start analyzing codebases in seconds.'}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-xs p-sm rounded-lg bg-error-container/20 border border-error/30">
                <span className="material-symbols-outlined text-error text-[16px]">error</span>
                <p className="text-body-sm font-body-sm text-error">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="email">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none material-symbols-outlined text-outline text-[18px]">mail</span>
                <input
                  id="email" type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input-field !pl-[40px]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant" htmlFor="password">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none material-symbols-outlined text-outline text-[18px]">lock</span>
                <input
                  id="password" type={showPassword ? 'text' : 'password'} required
                  minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field !pl-[40px] !pr-[40px]"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-sm flex items-center text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-sm flex items-center justify-center gap-sm">
              {loading ? <Spinner size="sm" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
        <div className="absolute bottom-md text-center font-body-sm text-body-sm text-on-surface-variant flex gap-md">
          <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
