export default function ProgressBar({ value = 0, className = '' }) {
  return (
    <div className={`w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-primary-container rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
