import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RepoDetail from './pages/RepoDetail'
import ProfilePage from './pages/ProfilePage'

function RequireAuth({ children }) {
  const token = localStorage.getItem('cv_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={<RequireAuth><Dashboard /></RequireAuth>}
        />
        <Route
          path="/repos/:repoId"
          element={<RequireAuth><RepoDetail /></RequireAuth>}
        />
        <Route
          path="/profile"
          element={<RequireAuth><ProfilePage /></RequireAuth>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
