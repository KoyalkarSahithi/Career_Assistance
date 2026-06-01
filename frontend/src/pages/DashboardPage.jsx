import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { BarChart2, Upload, MessageSquare, Mic, TrendingUp, TrendingDown, Award } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import api from '../services/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      <p style={{ color: 'var(--primary-light)', fontWeight: 700 }}>ATS Score: {payload[0].value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user }         = useSelector((s) => s.auth)
  const [data, setData]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/')
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      label: 'Resumes Uploaded',
      value: data?.resume_count ?? '—',
      icon: <Upload size={20} />,
      color: 'rgba(99,102,241,0.15)',
      iconColor: 'var(--primary-light)',
      change: null,
    },
    {
      label: 'Latest ATS Score',
      value: data?.latest_ats ?? '—',
      icon: <Award size={20} />,
      color: 'rgba(16,185,129,0.15)',
      iconColor: 'var(--success-light)',
      change: data?.ats_change ?? null,
    },
    {
      label: 'Interview Sessions',
      value: data?.interview_count ?? '—',
      icon: <Mic size={20} />,
      color: 'rgba(6,182,212,0.15)',
      iconColor: 'var(--accent-light)',
      change: null,
    },
    {
      label: 'Avg Interview Score',
      value: data?.avg_interview_score ? `${data.avg_interview_score}%` : '—',
      icon: <BarChart2 size={20} />,
      color: 'rgba(245,158,11,0.15)',
      iconColor: 'var(--warning)',
      change: null,
    },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Good {getGreeting()},{' '}
          <span className="gradient-text">{user?.first_name || user?.username || 'there'}</span> 👋
        </h1>
        <p className="page-description">Here's your career progress at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>
              {s.icon}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{loading ? '...' : s.value}</div>
            {s.change !== null && (
              <div className={`stat-change ${s.change >= 0 ? 'stat-up' : 'stat-down'}`}>
                {s.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(s.change)} pts from last upload
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* ATS history chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">ATS Score History</div>
              <div className="card-subtitle">Score trend across resume uploads</div>
            </div>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : data?.ats_history?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.ats_history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<BarChart2 size={32} />} text="Upload a resume to see ATS trends" link="/upload" linkText="Upload Now" />
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Upload size={18} />, label: 'Upload New Resume', desc: 'Get AI analysis & ATS score', to: '/upload', color: 'var(--primary)' },
              { icon: <MessageSquare size={18} />, label: 'Generate Questions', desc: 'Role-based interview questions', to: '/questions', color: 'var(--accent)' },
              { icon: <Mic size={18} />, label: 'Start Mock Interview', desc: 'Practice with AI interviewer', to: '/interview', color: 'var(--success)' },
            ].map((a) => (
              <Link key={a.to} to={a.to} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)', transition: 'all var(--transition-base)',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}22`, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      {data?.recent_sessions?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Interview Sessions</div>
            <Link to="/interview" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Technical Score', 'Communication Score', 'Overall'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_sessions.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{new Date(s.session_date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}><ScoreBadge val={s.technical_score} /></td>
                  <td style={{ padding: '12px' }}><ScoreBadge val={s.comm_score} /></td>
                  <td style={{ padding: '12px' }}><ScoreBadge val={s.overall} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function ScoreBadge({ val }) {
  if (!val && val !== 0) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const color = val >= 75 ? 'var(--success-light)' : val >= 50 ? 'var(--warning)' : 'var(--danger)'
  return <span style={{ fontWeight: 700, color }}>{val}%</span>
}

function EmptyState({ icon, text, link, linkText }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12, color: 'var(--text-muted)' }}>
      {icon}
      <p style={{ fontSize: 13 }}>{text}</p>
      {link && <Link to={link} className="btn btn-primary btn-sm">{linkText}</Link>}
    </div>
  )
}
