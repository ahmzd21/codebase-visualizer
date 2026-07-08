import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'
import GraphView from './GraphView'
import FilesView from './FilesView'
import MetricsView from './MetricsView'
import HotspotsView from './HotspotsView'
import AIInsightsView from './AIInsightsView'
import FloatingChat from '../components/FloatingChat'

const TABS = [
  { id: 'graph',     label: 'Graph',     icon: 'account_tree' },
  { id: 'files',     label: 'Files',     icon: 'folder_open' },
  { id: 'metrics',   label: 'Metrics',   icon: 'speed' },
  { id: 'hotspots',  label: 'Hotspots',  icon: 'warning' },
  { id: 'ai',        label: 'AI Insights', icon: 'auto_awesome' },
]

const STATUS_COLORS = {
  completed: 'text-[#69e0a5]',
  processing: 'text-primary',
  pending: 'text-on-surface-variant',
  failed: 'text-error',
}

export default function RepoDetail() {
  const { repoId } = useParams()
  const navigate = useNavigate()
  const [repo, setRepo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('graph')

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/repos/${repoId}`)
      if (res.ok) setRepo(res.repo)
      else setError(res.error?.message || 'Failed to load repository.')
      setLoading(false)
    }
    load()
  }, [repoId])

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <ErrorCard message={error} onRetry={() => navigate('/dashboard')} />
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-surface-container-lowest/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-md py-sm flex items-center gap-sm flex-wrap">
          <button onClick={() => navigate('/dashboard')}
            className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span className="material-symbols-outlined text-primary-container text-[20px] filled">schema</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-h2 text-h2 text-on-surface truncate">{repo.repoName}</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant truncate">{repo.repoUrl}</p>
          </div>
          <span className={`text-label-caps font-label-caps capitalize ${STATUS_COLORS[repo.status]}`}>
            ● {repo.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-md flex gap-unit overflow-x-auto border-t border-white/[0.05]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-xs px-md py-sm text-body-sm font-body-sm whitespace-nowrap border-b-2 transition-all
                ${activeTab === tab.id
                  ? 'border-primary-container text-primary-container'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-md py-lg">
        {repo.status !== 'completed' ? (
          <div className="card p-xl text-center flex flex-col items-center gap-md mt-xl">
            <span className="material-symbols-outlined text-outline text-[48px]">hourglass_empty</span>
            <p className="font-h2 text-h2 text-on-surface capitalize">Analysis {repo.status}</p>
            <p className="font-body-base text-body-base text-on-surface-variant">
              Go back to the dashboard to track progress.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'graph'    && <GraphView repoId={repoId} />}
            {activeTab === 'files'    && <FilesView repoId={repoId} />}
            {activeTab === 'metrics'  && <MetricsView repoId={repoId} />}
            {activeTab === 'hotspots' && <HotspotsView repoId={repoId} />}
            {activeTab === 'ai'       && <AIInsightsView repoId={repoId} />}
          </>
        )}
      </main>
      
      {repo.status === 'completed' && <FloatingChat repoId={repoId} />}
    </div>
  )
}
