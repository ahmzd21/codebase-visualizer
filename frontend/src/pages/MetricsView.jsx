import { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const FONT = { family: 'Inter, sans-serif', size: 11 }
const GRID = 'rgba(255,255,255,0.05)'
const TICK = '#8c909f'
const PALETTE = ['#adc6ff','#d0bcff','#69e0a5','#ffb786','#f9b53f','#a3d9ff','#ffadad','#b5ead7']

export default function MetricsView({ repoId }) {
  const [metrics, setMetrics] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [metricsRes, filesRes] = await Promise.all([
        api.get(`/repos/${repoId}/metrics`),
        api.get(`/repos/${repoId}/files`),
      ])
      if (metricsRes.ok) {
        setMetrics(metricsRes.metrics || {})
        setFiles(filesRes.ok ? (filesRes.files || []) : [])
      } else {
        setError(metricsRes.error?.message || 'Failed to load metrics.')
      }
      setLoading(false)
    }
    load()
  }, [repoId])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (error) return <ErrorCard message={error} />

  const {
    totalFiles = 0,
    totalSize = 0,
    avgComplexity = 0,
    maxComplexityFile = '—',
    maxComplexityScore = 0,
    languageBreakdown = {},
  } = metrics || {}

  // Build complexity distribution from files data
  const complexityBuckets = { '0-2': 0, '3-5': 0, '6-10': 0, '11-20': 0, '20+': 0 }
  files.forEach(f => {
    const c = f.complexity || 0
    if (c <= 2) complexityBuckets['0-2']++
    else if (c <= 5) complexityBuckets['3-5']++
    else if (c <= 10) complexityBuckets['6-10']++
    else if (c <= 20) complexityBuckets['11-20']++
    else complexityBuckets['20+']++
  })
  const distLabels = Object.keys(complexityBuckets)
  const distValues = Object.values(complexityBuckets)

  const langLabels = Object.keys(languageBreakdown)
  const langValues = Object.values(languageBreakdown)

  const donutData = {
    labels: langLabels,
    datasets: [{ data: langValues, backgroundColor: PALETTE.slice(0, langLabels.length), borderWidth: 2, borderColor: '#10131a' }],
  }

  const barData = {
    labels: distLabels,
    datasets: [{
      label: 'Files', data: distValues, borderRadius: 4,
      backgroundColor: ['#69e0a5', '#69e0a5', '#f9b53f', '#ff5757', '#ff5757'],
    }],
  }

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: TICK, font: FONT }, grid: { color: GRID } },
      y: { ticks: { color: TICK, font: FONT }, grid: { color: GRID } },
    },
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        {[
          { label: 'Total Files',        value: totalFiles.toLocaleString(), icon: 'description' },
          { label: 'Total Size',         value: (totalSize / 1024).toFixed(1) + ' KB', icon: 'format_list_numbered' },
          { label: 'Avg Complexity',     value: avgComplexity.toFixed(2), icon: 'speed' },
          { label: 'Max Complexity',     value: maxComplexityScore.toFixed(1), icon: 'health_and_safety' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card p-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[20px]">{icon}</span>
            <div>
              <p className="font-h2 text-h2 text-on-surface">{value}</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        <div className="card p-md flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[18px]">pie_chart</span>
            <h2 className="font-body-base text-body-base font-semibold text-on-surface">Language Breakdown</h2>
          </div>
          {langLabels.length === 0
            ? <p className="text-body-sm text-on-surface-variant">No data.</p>
            : (
              <div className="grid grid-cols-[1fr_auto] gap-md items-center">
                <div style={{ height: 200 }}>
                  <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '65%' }} />
                </div>
                <div className="flex flex-col gap-xs">
                  {langLabels.map((lang, i) => (
                    <div key={lang} className="flex items-center gap-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i] || '#424754' }} />
                      <span className="text-body-sm text-on-surface-variant">{lang}</span>
                      <span className="ml-auto text-body-sm text-on-surface pl-sm">{langValues[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>

        <div className="card p-md flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[18px]">bar_chart</span>
            <h2 className="font-body-base text-body-base font-semibold text-on-surface">Complexity Distribution</h2>
          </div>
          {files.length === 0
            ? <p className="text-body-sm text-on-surface-variant">No data.</p>
            : <div style={{ height: 200 }}><Bar data={barData} options={barOpts} /></div>
          }
          <p className="text-body-sm text-on-surface-variant">Green ≤5 · Yellow ≤10 · Red &gt;10</p>
        </div>
      </div>

      {/* Most complex file callout */}
      {maxComplexityFile !== '—' && (
        <div className="card p-md flex items-center gap-sm">
          <span className="material-symbols-outlined text-error text-[20px]">local_fire_department</span>
          <div>
            <p className="text-body-sm font-body-sm text-on-surface-variant">Most Complex File</p>
            <p className="font-code-base text-code-base text-primary">{maxComplexityFile}</p>
          </div>
          <span className="ml-auto text-h2 font-h2 text-error">{maxComplexityScore.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}
