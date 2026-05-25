import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import ErrorCard from '../components/ErrorCard'
import SkeletonCard from '../components/SkeletonCard'

const STATUS_COLORS = {
  completed: 'bg-[#69e0a5]/20 text-[#69e0a5] border-[#69e0a5]/30',
  processing: 'bg-primary-container/20 text-primary border-primary/30',
  pending: 'bg-surface-variant text-on-surface-variant border-white/[0.08]',
  failed: 'bg-error-container/20 text-error border-error/30',
}

function RepoCard({ repo, onClick }) {
  const date = new Date(repo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <button onClick={onClick}
      className="card p-md text-left hover:bg-surface-container-high transition-all group w-full flex flex-col gap-sm">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex items-center gap-sm min-w-0">
          <span className="material-symbols-outlined text-primary-container text-[20px] flex-shrink-0">folder_code</span>
          <span className="font-body-base text-body-base font-semibold text-on-surface truncate">
            {repo.repoName || repo.repoUrl.split('/').pop()}
          </span>
        </div>
        <span className={`flex-shrink-0 text-label-caps font-label-caps px-sm py-xs rounded-full border ${STATUS_COLORS[repo.status] || STATUS_COLORS.pending}`}>
          {repo.status}
        </span>
      </div>
      <p className="text-body-sm font-body-sm text-on-surface-variant truncate">{repo.repoUrl}</p>
      <p className="text-label-caps font-label-caps text-on-surface-variant">{date}</p>
      <span className="material-symbols-outlined text-outline text-[16px] self-end group-hover:text-primary transition-colors">arrow_forward</span>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [activeJob, setActiveJob] = useState(null) // { jobId, progress, status, repoName }
  const pollingRef = useRef(null)

  const fetchRepos = useCallback(async () => {
    const res = await api.get('/repos')
    if (res.ok) setRepos(res.repos || [])
    else setError(res.error?.message || 'Failed to load repositories.')
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  // Cleanup polling on unmount
  useEffect(() => () => clearInterval(pollingRef.current), [])

  const startPolling = (jobId, repoName) => {
    setActiveJob({ jobId, progress: 0, status: 'queued', repoName })
    pollingRef.current = setInterval(async () => {
      const res = await api.get(`/jobs/${jobId}`)
      if (!res.ok) return
      const { job } = res
      setActiveJob(prev => ({ ...prev, progress: job.progress, status: job.status }))
      if (job.status === 'done' || job.status === 'failed') {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        setActiveJob(null)
        await fetchRepos()
      }
    }, 2000)
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!repoUrl.includes('github.com')) {
      setSubmitError('Please enter a valid GitHub repository URL.')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post('/repos/analyze', { repoUrl })
      if (!res.ok) {
        setSubmitError(res.error?.message || 'Failed to submit repository.')
        return
      }
      setShowModal(false)
      setRepoUrl('')
      if (res.cached) {
        await fetchRepos()
      } else {
        startPolling(res.jobId, res.repoName || repoUrl.split('/').pop())
      }
    } finally {
      setSubmitting(false)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-surface-container-lowest/80 backdrop-blur-xl px-margin-page py-sm flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary-container text-[24px] filled">schema</span>
          <span className="font-h2 text-h2 text-on-surface">Codebase Visualizer</span>
        </div>
        <div className="flex items-center gap-sm">
          <button onClick={() => navigate('/profile')}
            className="btn-ghost flex items-center gap-xs">
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button onClick={logout} className="btn-ghost flex items-center gap-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-margin-page py-xl">
        {/* Hero */}
        <div className="mb-xl flex items-start justify-between gap-md flex-wrap">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">Your Repositories</h1>
            <p className="font-body-base text-body-base text-on-surface-variant mt-xs">
              Submit a GitHub URL to analyze its architecture, dependencies, and complexity.
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-xs flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Analyze Repo
          </button>
        </div>

        {/* Active job progress */}
        {activeJob && (
          <div className="card p-md mb-lg flex flex-col gap-sm border-primary/20 bg-primary-container/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <Spinner size="sm" />
                <span className="text-body-base font-body-base text-on-surface">
                  Analyzing <strong>{activeJob.repoName}</strong>…
                </span>
              </div>
              <span className="text-label-caps font-label-caps text-primary">{activeJob.progress}%</span>
            </div>
            <ProgressBar value={activeJob.progress} />
            <p className="text-body-sm font-body-sm text-on-surface-variant capitalize">{activeJob.status}</p>
          </div>
        )}

        {/* Repo grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {[1, 2, 3].map(i => <SkeletonCard key={i} lines={4} />)}
          </div>
        ) : error ? (
          <ErrorCard message={error} onRetry={fetchRepos} />
        ) : repos.length === 0 ? (
          <div className="card p-xl text-center flex flex-col items-center gap-md">
            <span className="material-symbols-outlined text-outline text-[48px]">folder_open</span>
            <p className="font-h2 text-h2 text-on-surface">No repositories yet</p>
            <p className="font-body-base text-body-base text-on-surface-variant">
              Click "Analyze Repo" to get started.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-xs mt-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Analyze your first repo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {repos.map(repo => (
              <RepoCard key={repo._id} repo={repo} onClick={() => navigate(`/repos/${repo._id}`)} />
            ))}
          </div>
        )}
      </main>

      {/* Analyze modal */}
      {showModal && (
        <Modal title="Analyze Repository" onClose={() => { setShowModal(false); setSubmitError('') }}>
          <form onSubmit={handleAnalyze} className="flex flex-col gap-md">
            <p className="text-body-sm font-body-sm text-on-surface-variant">
              Paste a public GitHub repository URL. The analysis may take 1–2 minutes.
            </p>
            {submitError && (
              <div className="flex items-center gap-xs p-sm rounded-lg bg-error-container/20 border border-error/30">
                <span className="material-symbols-outlined text-error text-[16px]">error</span>
                <p className="text-body-sm font-body-sm text-error">{submitError}</p>
              </div>
            )}
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant">GitHub URL</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none material-symbols-outlined text-outline text-[18px]">link</span>
                <input
                  type="url" required value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="input-field !pl-[40px]"
                />
              </div>
            </div>
            <div className="flex gap-sm justify-end pt-sm">
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-xs">
                {submitting ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[16px]">analytics</span>}
                {submitting ? 'Submitting…' : 'Analyze'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
