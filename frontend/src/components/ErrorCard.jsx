export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="card p-md flex items-start gap-sm border-error/30 bg-error-container/10">
      <span className="material-symbols-outlined text-error text-[20px] flex-shrink-0 mt-[2px]">
        error
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-body-sm text-error">{message || 'Something went wrong.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-sm text-body-sm font-body-sm text-primary hover:text-primary-fixed transition-colors"
          >
            Try again →
          </button>
        )}
      </div>
    </div>
  )
}
