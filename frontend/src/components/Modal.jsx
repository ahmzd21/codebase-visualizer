import { useEffect } from 'react'

export default function Modal({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`glass rounded-xl w-full ${maxWidth} shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between p-md border-b border-white/[0.08] flex-shrink-0">
          <h2 className="font-h2 text-h2 text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {/* Body */}
        <div className="p-md overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
