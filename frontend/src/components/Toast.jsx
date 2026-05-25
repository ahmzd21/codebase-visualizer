import { useEffect, useState } from 'react'

export default function Toast({ message, type = 'success', onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const icons = { success: 'check_circle', error: 'error', info: 'info' }
  const colors = {
    success: 'text-[#69e0a5]',
    error: 'text-error',
    info: 'text-primary',
  }

  return (
    <div
      className={`toast-enter fixed bottom-lg right-lg z-50 card p-sm pr-md flex items-center gap-sm
        shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className={`material-symbols-outlined text-[20px] ${colors[type]}`}>{icons[type]}</span>
      <span className="text-body-sm font-body-sm text-on-surface">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }}
        className="ml-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  )
}
