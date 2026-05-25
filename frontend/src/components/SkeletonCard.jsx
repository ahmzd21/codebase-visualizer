export default function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`card p-md space-y-sm ${className}`}>
      <div className="skeleton h-4 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={`skeleton h-3 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
      ))}
    </div>
  )
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-white/[0.05]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-md py-sm">
          <div className="skeleton h-3 w-24" />
        </td>
      ))}
    </tr>
  )
}
