import { useEffect, useState } from 'react'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'
import { SkeletonRow } from '../components/SkeletonCard'

const COMPLEXITY_COLOR = (v) => {
  if (v <= 5)  return 'text-[#69e0a5]'
  if (v <= 10) return 'text-[#f9b53f]'
  return 'text-error'
}

const COMPLEXITY_BADGE = (v) => {
  if (v <= 5)  return 'bg-[#69e0a5]/15 text-[#69e0a5] border-[#69e0a5]/30'
  if (v <= 10) return 'bg-[#f9b53f]/15 text-[#f9b53f] border-[#f9b53f]/30'
  return 'bg-error/15 text-error border-error/30'
}

export default function FilesView({ repoId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ field: 'complexity', dir: -1 })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  useEffect(() => {
    const load = async () => {
      const res = await api.get(`/repos/${repoId}/files`)
      if (res.ok) setFiles(res.files || [])
      else setError(res.error?.message || 'Failed to load files.')
      setLoading(false)
    }
    load()
  }, [repoId])

  const toggleSort = (field) => {
    setSort(s => ({ field, dir: s.field === field ? -s.dir : -1 }))
    setPage(1)
  }

  const filtered = files
    .filter(f => (f.path || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sort.field] ?? 0, bv = b[sort.field] ?? 0
      return sort.dir * (av < bv ? -1 : av > bv ? 1 : 0)
    })

  const pages = Math.ceil(filtered.length / PAGE_SIZE)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const SortIcon = ({ field }) => (
    <span className={`material-symbols-outlined text-[14px] transition-colors ${sort.field === field ? 'text-primary-container' : 'text-outline'}`}>
      {sort.field === field && sort.dir === -1 ? 'arrow_downward' : sort.field === field ? 'arrow_upward' : 'unfold_more'}
    </span>
  )

  if (loading) return (
    <div className="card overflow-hidden">
      <table className="w-full"><tbody>{[1,2,3,4,5].map(i=><SkeletonRow key={i} cols={5}/>)}</tbody></table>
    </div>
  )
  if (error) return <ErrorCard message={error} />

  return (
    <div className="flex flex-col gap-md">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
        {[
          { label: 'Total Files', value: files.length, icon: 'description' },
          { label: 'Total Size', value: (files.reduce((s,f)=>s+(f.size||0),0) / 1024).toFixed(1) + ' KB', icon: 'format_size' },
          { label: 'Avg Complexity', value: files.length ? (files.reduce((s,f)=>s+(f.complexity||0),0)/files.length).toFixed(1) : '—', icon: 'speed' },
          { label: 'High Risk Files', value: files.filter(f=>(f.complexity||0)>10).length, icon: 'warning' },
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

      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none material-symbols-outlined text-outline text-[18px]">search</span>
        <input
          type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Filter by file path…"
          className="input-field !pl-[40px]"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-surface-container-lowest">
                {[
                  { key: 'path', label: 'File Path' },
                  { key: 'language', label: 'Language' },
                  { key: 'size', label: 'Size (KB)' },
                  { key: 'complexity', label: 'Complexity' },
                  { key: 'changeFrequency', label: 'Changes' },
                ].map(({ key, label }) => (
                  <th key={key} className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">
                    <button onClick={() => toggleSort(key)} className="flex items-center gap-xs hover:text-on-surface transition-colors">
                      {label} <SortIcon field={key} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={5} className="px-md py-xl text-center text-body-sm font-body-sm text-on-surface-variant">No files match your search.</td></tr>
              ) : visible.map((file, i) => (
                <tr key={file._id || i} className="border-b border-white/[0.05] hover:bg-surface-container-high transition-colors">
                  <td className="px-md py-sm">
                    <span className="text-body-sm font-code-base text-primary truncate max-w-xs block" title={file.path}>
                      {file.path}
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    <span className="text-body-sm font-body-sm text-on-surface-variant">{file.language || '—'}</span>
                  </td>
                  <td className="px-md py-sm">
                    <span className="text-body-sm font-body-sm text-on-surface">{((file.size || 0) / 1024).toFixed(1)}</span>
                  </td>
                  <td className="px-md py-sm">
                    <span className={`text-label-caps font-label-caps px-sm py-xs rounded-full border ${COMPLEXITY_BADGE(file.complexity || 0)}`}>
                      {(file.complexity || 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    <span className="text-body-sm font-body-sm text-on-surface">{(file.changeFrequency || 0).toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-md py-sm border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-body-sm font-body-sm text-on-surface-variant">
              {filtered.length} files · page {page} of {pages}
            </span>
            <div className="flex gap-xs">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-ghost disabled:opacity-40">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="btn-ghost disabled:opacity-40">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
