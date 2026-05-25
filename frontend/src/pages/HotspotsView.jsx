import { useEffect, useState } from 'react'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'

const RISK_CONFIG = {
  critical: { label: 'Critical', color: 'text-error', badge: 'bg-error/15 text-error border-error/30', bar: '#ff5757' },
  high:     { label: 'High',     color: 'text-[#f9b53f]', badge: 'bg-[#f9b53f]/15 text-[#f9b53f] border-[#f9b53f]/30', bar: '#f9b53f' },
  medium:   { label: 'Medium',   color: 'text-primary', badge: 'bg-primary/15 text-primary border-primary/30', bar: '#adc6ff' },
  low:      { label: 'Low',      color: 'text-[#69e0a5]', badge: 'bg-[#69e0a5]/15 text-[#69e0a5] border-[#69e0a5]/30', bar: '#69e0a5' },
}

export default function HotspotsView({ repoId }) {
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get(`/repos/${repoId}/hotspots`).then(res => {
      if (res.ok) setHotspots(res.hotspots || [])
      else setError(res.error?.message || 'Failed to load hotspots.')
      setLoading(false)
    })
  }, [repoId])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (error) return <ErrorCard message={error} />

  const hotspotsWithLevels = hotspots.map(h => {
    let riskLevel = 'low';
    if (h.riskScore >= 80) riskLevel = 'critical';
    else if (h.riskScore >= 60) riskLevel = 'high';
    else if (h.riskScore >= 40) riskLevel = 'medium';
    return { ...h, riskLevel };
  });

  const levels = ['all', 'critical', 'high', 'medium', 'low']
  const counts = levels.slice(1).reduce((acc, l) => { acc[l] = hotspotsWithLevels.filter(h => h.riskLevel === l).length; return acc }, {})
  const visible = filter === 'all' ? hotspotsWithLevels : hotspotsWithLevels.filter(h => h.riskLevel === filter)
  const maxScore = Math.max(...hotspotsWithLevels.map(h => h.riskScore || 0), 1)

  return (
    <div className="flex flex-col gap-md">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        {levels.slice(1).map(level => {
          const cfg = RISK_CONFIG[level]
          return (
            <div key={level} className={`card p-md border ${cfg.badge}`}>
              <p className={`font-h2 text-h2 ${cfg.color}`}>{counts[level]}</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">{cfg.label} Risk</p>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-xs bg-surface-container-highest rounded-lg p-unit w-fit">
        {levels.map(l => (
          <button key={l} onClick={() => setFilter(l)}
            className={`px-md py-xs rounded text-body-sm font-body-sm capitalize transition-all ${filter === l ? 'tab-active' : 'tab-inactive'}`}>
            {l === 'all' ? `All (${hotspots.length})` : `${l} (${counts[l]})`}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="card p-xl text-center flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined text-[#69e0a5] text-[48px]">check_circle</span>
          <p className="font-h2 text-h2 text-on-surface">No {filter === 'all' ? '' : filter} hotspots</p>
          <p className="text-body-sm text-on-surface-variant">This codebase looks healthy!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {visible.map((h, i) => {
            const cfg = RISK_CONFIG[h.riskLevel] || RISK_CONFIG.low
            const pct = maxScore > 0 ? ((h.riskScore || 0) / maxScore) * 100 : 0
            return (
              <div key={h.fileId || i} className="card p-md flex flex-col gap-sm hover:bg-surface-container-high transition-colors">
                <div className="flex items-start justify-between gap-sm flex-wrap">
                  <div className="flex items-center gap-sm min-w-0">
                    <span className="material-symbols-outlined text-[18px] flex-shrink-0" style={{ color: cfg.bar }}>warning</span>
                    <span className="font-code-base text-code-base text-primary truncate" title={h.path}>{h.path || '(unknown)'}</span>
                  </div>
                  <span className={`flex-shrink-0 text-label-caps font-label-caps px-sm py-xs rounded-full border ${cfg.badge} capitalize`}>
                    {h.riskLevel}
                  </span>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-sm">
                  <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.bar }} />
                  </div>
                  <span className="text-body-sm font-body-sm text-on-surface w-8 text-right">{(h.riskScore || 0).toFixed(1)}</span>
                </div>

                {/* Metrics row */}
                <div className="flex flex-wrap gap-md">
                  {[
                    { label: 'Complexity', value: h.complexity?.toFixed(1) ?? '—' },
                    { label: 'Changes',    value: h.changeFrequency?.toLocaleString() ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-label-caps font-label-caps text-on-surface-variant">{label}</p>
                      <p className="text-body-sm font-body-sm text-on-surface">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
