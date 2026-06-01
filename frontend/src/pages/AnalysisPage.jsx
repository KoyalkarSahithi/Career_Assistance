import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function AnalysisPage() {
  const { analysis, currentResume } = useSelector((s) => s.resume)

  if (!analysis) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Resume Analysis</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <Upload size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No analysis yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Upload a resume to get your AI-powered analysis</p>
          <Link to="/upload" id="go-upload-btn" className="btn btn-primary">Upload Resume</Link>
        </div>
      </div>
    )
  }

  const score      = analysis.ats_score ?? 0
  const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const scoreLabel = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work'

  const radialData = [{ name: 'ATS', value: score, fill: scoreColor }]

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Resume Analysis</h1>
          {currentResume && <p className="page-description">{currentResume.file_name}</p>}
        </div>
        <Link to="/upload" className="btn btn-secondary"><Upload size={16} /> Re-upload</Link>
      </div>

      {/* Top row */}
      <div className="analysis-grid" style={{ marginBottom: 20 }}>
        {/* ATS Score widget */}
        <div className="ats-score-widget">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ATS Score</div>
          <ResponsiveContainer width={180} height={180}>
            <RadialBarChart
              cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
              data={radialData} startAngle={90} endAngle={90 - (360 * score / 100)}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.05)' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="ats-score-number" style={{ color: scoreColor, WebkitTextFillColor: scoreColor }}>{score}</div>
          <span className="badge" style={{ background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}44` }}>{scoreLabel}</span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Your resume scored {score}/100 on ATS compatibility
          </p>
        </div>

        {/* Suggestions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">AI Feedback & Suggestions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analysis.feedback?.map((item, i) => (
              <FeedbackItem key={i} item={item} />
            )) ?? <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No feedback available</p>}
          </div>
        </div>
      </div>

      {/* Skills row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SkillsCard title="Technical Skills" color="var(--primary-light)" items={analysis.technical_skills} emptyMsg="No technical skills detected" />
        <SkillsCard title="Soft Skills" color="var(--accent-light)" items={analysis.soft_skills} emptyMsg="No soft skills detected" />
        <SkillsCard title="Missing Skills" color="var(--warning)" items={analysis.missing_skills} emptyMsg="Great! No obvious skill gaps" isWarning />
      </div>

      {/* ATS category breakdown */}
      {analysis.category_scores && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">ATS Score Breakdown</div>
            <div className="card-subtitle">How each section contributes to your score</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(analysis.category_scores).map(([cat, val]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{cat}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{val}/100</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${val}%`, background: val >= 75 ? 'var(--success)' : val >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <Link to="/questions" id="gen-questions-btn" className="btn btn-primary btn-lg">Generate Interview Questions →</Link>
        <Link to="/interview" className="btn btn-secondary btn-lg">Start Mock Interview</Link>
      </div>
    </div>
  )
}

function FeedbackItem({ item }) {
  const icons = { positive: <CheckCircle size={16} />, warning: <AlertTriangle size={16} />, negative: <XCircle size={16} /> }
  const colors = { positive: 'var(--success-light)', warning: 'var(--warning)', negative: 'var(--danger)' }
  const type = item.type || 'warning'
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <span style={{ color: colors[type], flexShrink: 0, marginTop: 1 }}>{icons[type]}</span>
      <div>
        {item.title && <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.title}</div>}
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.message || item}</div>
      </div>
    </div>
  )
}

function SkillsCard({ title, color, items, emptyMsg, isWarning }) {
  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: 12 }}>
        <div className="card-title" style={{ fontSize: 15, color }}>{title}</div>
        {items?.length > 0 && (
          <span className="badge badge-primary" style={{ color, background: `${color}22`, borderColor: `${color}33` }}>
            {items.length}
          </span>
        )}
      </div>
      <div className="skills-grid">
        {items?.length
          ? items.map((s) => (
              <span key={s} className="tag" style={{ color, background: `${color}15`, borderColor: `${color}25` }}>
                {isWarning && '⚠ '}{s}
              </span>
            ))
          : <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{emptyMsg}</p>
        }
      </div>
    </div>
  )
}
