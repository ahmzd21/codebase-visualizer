const BASE = 'http://localhost:5000/api'

/**
 * Central fetch utility.
 * - Automatically attaches Authorization header from localStorage
 * - On 401: clears storage and redirects to /login
 * - Returns parsed JSON
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('cv_token')

  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  // Parse body first so we can return it even on error
  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    localStorage.removeItem('cv_token')
    localStorage.removeItem('cv_userId')
    window.location.href = '/login'
    return data
  }

  return { ok: res.ok, status: res.status, ...data }
}

/** Convenience wrappers */
export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
}
