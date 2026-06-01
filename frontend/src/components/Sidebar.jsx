import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, Upload, BarChart2, MessageSquare,
  Mic, User, LogOut, Brain
} from 'lucide-react'
import { logout } from '../store/authSlice'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Dashboard',   to: '/dashboard',  Icon: LayoutDashboard },
  { label: 'Upload Resume', to: '/upload',   Icon: Upload },
  { label: 'Analysis',    to: '/analysis',   Icon: BarChart2 },
  { label: 'Questions',   to: '/questions',  Icon: MessageSquare },
  { label: 'Mock Interview', to: '/interview', Icon: Mic },
]

export default function Sidebar() {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user }   = useSelector((s) => s.auth)

  const initials = user
    ? (user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()
    : 'U'

  function handleLogout() {
    dispatch(logout())
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Brain size={20} color="#fff" />
        </div>
        <span className="sidebar-logo-text">ResumeAI</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Main Menu</span>
        {NAV.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
          </NavLink>
        ))}

        <span className="nav-section-label" style={{ marginTop: 8 }}>Account</span>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <User className="nav-icon" size={18} />
          Profile
        </NavLink>
        <button className="nav-link btn-ghost" style={{ width: '100%', textAlign: 'left', color: 'var(--danger)' }} onClick={handleLogout}>
          <LogOut className="nav-icon" size={18} />
          Logout
        </button>
      </nav>

      {/* User info */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.first_name || user?.username || 'User'}</div>
          <div className="user-email">{user?.email || ''}</div>
        </div>
      </div>
    </aside>
  )
}
