import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'
import Toast from '../components/Toast'
import SkeletonCard from '../components/SkeletonCard'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    api.get('/users/profile').then(res => {
      if (res.ok) {
        setProfile(res.user)
        setStats(res.stats)
        setDisplayName(res.user.displayName || '')
      } else {
        setError(res.error?.message || 'Failed to load profile.')
      }
      setLoading(false)
    })
  }, [])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    const res = await api.patch('/users/profile', { displayName })
    if (res.ok) {
      setProfile(res.user)
      setToast({ message: 'Profile updated!', type: 'success' })
    } else {
      setToast({ message: res.error?.message || 'Update failed.', type: 'error' })
    }
    setSavingProfile(false)
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return }
    setSavingPassword(true)
    const res = await api.patch('/users/profile/password', { currentPassword, newPassword, confirmPassword })
    if (res.ok) {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setToast({ message: 'Password changed successfully!', type: 'success' })
    } else {
      setPwError(res.error?.message || 'Password change failed.')
    }
    setSavingPassword(false)
  }

  const logout = () => { localStorage.clear(); navigate('/login') }

  if (loading) return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto px-md py-xl flex flex-col gap-md">
      {[1,2,3].map(i => <SkeletonCard key={i} lines={4} />)}
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <ErrorCard message={error} onRetry={() => navigate('/dashboard')} />
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-surface-container-lowest/80 backdrop-blur-xl px-md py-sm flex items-center gap-sm">
        <button onClick={() => navigate('/dashboard')} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="material-symbols-outlined text-primary-container text-[20px] filled">schema</span>
        <h1 className="font-h2 text-h2 text-on-surface flex-1">Profile</h1>
        <button onClick={logout} className="btn-ghost flex items-center gap-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-md py-xl flex flex-col gap-lg">

        {/* Avatar + email */}
        <div className="card p-md flex items-center gap-md">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 border border-primary-container/30 flex items-center justify-center flex-shrink-0">
            <span className="font-h1 text-h1 text-primary-container">
              {(profile?.displayName || profile?.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-h2 text-h2 text-on-surface truncate">{profile?.displayName || 'No display name'}</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant truncate">{profile?.email}</p>
            <p className="text-label-caps font-label-caps text-on-surface-variant mt-xs">
              Joined {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Usage stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-md">
            {[
              { label: 'Repositories',    value: stats.repoCount,           icon: 'folder_code' },
              { label: 'Files Scanned',   value: stats.totalFilesScanned?.toLocaleString(), icon: 'description' },
              { label: 'AI Insights',     value: stats.aiInsightsGenerated, icon: 'auto_awesome' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card p-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container text-[20px]">{icon}</span>
                <div>
                  <p className="font-h2 text-h2 text-on-surface">{value ?? '—'}</p>
                  <p className="text-body-sm font-body-sm text-on-surface-variant">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Most recent repo */}
        {stats?.mostRecentRepo && (
          <div className="card p-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[18px]">history</span>
            <div className="min-w-0">
              <p className="text-label-caps font-label-caps text-on-surface-variant">Most Recent Analysis</p>
              <p className="text-body-base font-body-base text-on-surface truncate">{stats.mostRecentRepo.repoName}</p>
              <p className="text-body-sm font-body-sm text-on-surface-variant truncate">{stats.mostRecentRepo.repoUrl}</p>
            </div>
            <span className="ml-auto text-label-caps font-label-caps capitalize px-sm py-xs rounded-full border
              bg-[#69e0a5]/15 text-[#69e0a5] border-[#69e0a5]/30 flex-shrink-0">
              {stats.mostRecentRepo.status}
            </span>
          </div>
        )}

        {/* Edit profile */}
        <div className="card p-md flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[18px]">edit</span>
            <h2 className="font-h2 text-h2 text-on-surface">Edit Profile</h2>
          </div>
          <form onSubmit={saveProfile} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                maxLength={50} placeholder="Your name"
                className="input-field" />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant">Email</label>
              <input type="email" value={profile?.email} readOnly
                className="input-field opacity-50 cursor-not-allowed" />
              <p className="text-body-sm font-body-sm text-on-surface-variant">Email cannot be changed.</p>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-xs">
                {savingProfile ? <Spinner size="sm" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card p-md flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[18px]">lock</span>
            <h2 className="font-h2 text-h2 text-on-surface">Change Password</h2>
          </div>
          <form onSubmit={savePassword} className="flex flex-col gap-md">
            {pwError && (
              <div className="flex items-center gap-xs p-sm rounded-lg bg-error-container/20 border border-error/30">
                <span className="material-symbols-outlined text-error text-[16px]">error</span>
                <p className="text-body-sm font-body-sm text-error">{pwError}</p>
              </div>
            )}
            {[
              { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, id: 'cur-pw' },
              { label: 'New Password',     value: newPassword,     setter: setNewPassword,     id: 'new-pw' },
              { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, id: 'conf-pw' },
            ].map(({ label, value, setter, id }) => (
              <div key={id} className="flex flex-col gap-xs">
                <label htmlFor={id} className="font-label-caps text-label-caps text-on-surface-variant">{label}</label>
                <input id={id} type="password" required minLength={6} value={value}
                  onChange={e => setter(e.target.value)} placeholder="••••••••"
                  className="input-field" />
              </div>
            ))}
            <div className="flex justify-end">
              <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-xs">
                {savingPassword ? <Spinner size="sm" /> : null}
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card p-md flex items-center justify-between gap-md border-error/20">
          <div>
            <p className="font-body-base text-body-base font-semibold text-on-surface">Sign Out</p>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-xs">End your current session.</p>
          </div>
          <button onClick={logout} className="btn-ghost border-error/30 text-error hover:bg-error/10 flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}
