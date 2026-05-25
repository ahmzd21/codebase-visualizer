import { useEffect, useState } from 'react'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'
import Toast from '../components/Toast'

const renderMarkdown = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-on-surface font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function AIInsightsView({ repoId }) {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    const res = await api.get(`/ai/insights/${repoId}`)
    if (res.ok) setInsight(res.insight)
    else if (res.status !== 404) setError(res.error?.message || 'Failed to load insight.')
    setLoading(false)
  }

  useEffect(() => { load() }, [repoId])

  const generate = async () => {
    setGenerating(true)
    setError('')
    const res = await api.post(`/ai/insights/${repoId}`, {})
    if (res.ok) {
      setInsight(res.insight)
      setToast({ message: 'AI insight generated successfully!', type: 'success' })
    } else {
      setError(res.error?.message || 'Failed to generate insight.')
    }
    setGenerating(false)
  }

  const regenerate = async () => {
    setInsight(null)
    await generate()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="flex flex-col gap-md">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {error && <ErrorCard message={error} onRetry={insight ? regenerate : generate} />}

      {!insight ? (
        <div className="card p-xl text-center flex flex-col items-center gap-md">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary-container/30">
            <span className="material-symbols-outlined text-primary-container text-[32px]">auto_awesome</span>
          </div>
          <div>
            <p className="font-h2 text-h2 text-on-surface">AI Architectural Insight</p>
            <p className="font-body-base text-body-base text-on-surface-variant mt-xs max-w-sm mx-auto">
              Generate a Claude-powered analysis covering architecture, patterns, risks, and refactoring suggestions.
            </p>
          </div>
          <button onClick={generate} disabled={generating} className="btn-primary flex items-center gap-xs">
            {generating ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[16px]">auto_awesome</span>}
            {generating ? 'Generating…' : 'Generate AI Insight'}
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary-container text-[20px]">auto_awesome</span>
              <h2 className="font-h2 text-h2 text-on-surface">AI Architectural Insight</h2>
            </div>
            <div className="flex items-center gap-sm">
              <span className="text-body-sm font-body-sm text-on-surface-variant">
                Generated {new Date(insight.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={regenerate} disabled={generating} className="btn-ghost flex items-center gap-xs">
                {generating ? <Spinner size="sm" /> : <span className="material-symbols-outlined text-[14px]">refresh</span>}
                Regenerate
              </button>
            </div>
          </div>

          {/* Summary */}
          {insight.summary && (
            <div className="card p-md border-primary-container/20 bg-primary-container/5">
              <div className="flex items-center gap-sm mb-sm">
                <span className="material-symbols-outlined text-primary-container text-[18px]">summarize</span>
                <h3 className="font-body-base text-body-base font-semibold text-on-surface">Summary</h3>
              </div>
              <p className="text-body-base font-body-base text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {renderMarkdown(insight.summary)}
              </p>
            </div>
          )}

          {/* Architecture Patterns */}
          {insight.architecturePatterns?.length > 0 && (
            <div className="card p-md">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-secondary text-[18px]">account_tree</span>
                <h3 className="font-body-base text-body-base font-semibold text-on-surface">Architecture Patterns</h3>
              </div>
              <div className="flex flex-wrap gap-xs">
                {insight.architecturePatterns.map(p => (
                  <span key={p} className="text-label-caps font-label-caps px-sm py-xs rounded-full bg-secondary/15 text-secondary border border-secondary/30">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {insight.risks?.length > 0 && (
            <div className="card p-md">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                <h3 className="font-body-base text-body-base font-semibold text-on-surface">Identified Risks</h3>
              </div>
              <ul className="flex flex-col gap-sm">
                {insight.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-sm">
                    <span className="material-symbols-outlined text-error text-[16px] mt-[2px] flex-shrink-0">error_outline</span>
                    <p className="text-body-base font-body-base text-on-surface-variant">{renderMarkdown(r)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Refactoring Suggestions */}
          {insight.refactoringSuggestions?.length > 0 && (
            <div className="card p-md">
              <div className="flex items-center gap-sm mb-md">
                <span className="material-symbols-outlined text-tertiary text-[18px]">build</span>
                <h3 className="font-body-base text-body-base font-semibold text-on-surface">Refactoring Suggestions</h3>
              </div>
              <ol className="flex flex-col gap-sm list-none">
                {insight.refactoringSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-md">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-label-caps font-label-caps text-tertiary">
                      {i + 1}
                    </span>
                    <p className="text-body-base font-body-base text-on-surface-variant">{renderMarkdown(s)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Overall Score */}
          {insight.overallScore != null && (
            <div className="card p-md flex items-center gap-lg">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1d2027" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={insight.overallScore >= 70 ? '#69e0a5' : insight.overallScore >= 40 ? '#f9b53f' : '#ff5757'}
                    strokeWidth="3" strokeDasharray={`${insight.overallScore} 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-h2 text-h2 text-on-surface">
                  {insight.overallScore}
                </span>
              </div>
              <div>
                <p className="font-body-base text-body-base font-semibold text-on-surface">Overall Health Score</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">
                  {insight.overallScore >= 70 ? 'Good — this codebase is healthy and maintainable.'
                    : insight.overallScore >= 40 ? 'Fair — some areas need attention.'
                      : 'Poor — significant refactoring recommended.'}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


