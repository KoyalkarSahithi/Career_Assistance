import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { MessageSquare, RefreshCw, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { setQuestions } from '../store/interviewSlice'

const CATEGORIES = ['All', 'HR', 'Technical', 'Project-Based']
const ROLES = ['Software Engineer', 'Data Scientist', 'Product Manager', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer', 'UI/UX Designer']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function QuestionsPage() {
  const dispatch = useDispatch()
  const { questions }    = useSelector((s) => s.interview)
  const { currentResume } = useSelector((s) => s.resume)

  const [role, setRole]       = useState('Software Engineer')
  const [difficulty, setDiff] = useState('Medium')
  const [category, setCategory] = useState('All')
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState({})

  async function generate() {
    if (!currentResume) return toast.error('Please upload a resume first')
    setLoading(true)
    try {
      const { data } = await api.post('/interviews/generate-questions/', {
        resume_id: currentResume.id,
        role,
        difficulty,
      })
      dispatch(setQuestions(data.questions))
      toast.success(`${data.questions.length} questions generated!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const filtered = category === 'All'
    ? questions
    : questions.filter((q) => q.category === category)

  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    acc[cat] = questions.filter((q) => q.category === cat)
    return acc
  }, {})

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Interview Questions</h1>
        <p className="page-description">AI-generated questions tailored to your resume and target role</p>
      </div>

      {/* Config panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Target Role</label>
            <select id="role-select" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Difficulty</label>
            <select id="difficulty-select" className="form-input" value={difficulty} onChange={(e) => setDiff(e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category Filter</label>
            <select id="category-select" className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button id="generate-questions-btn" className="btn btn-primary btn-lg" onClick={generate} disabled={loading}>
            {loading ? <span className="spinner" /> : <><Zap size={16} /> Generate</>}
          </button>
        </div>
      </div>

      {/* No resume warning */}
      {!currentResume && (
        <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠ Upload a resume first for personalized questions. Generic questions will be generated otherwise.
        </div>
      )}

      {/* Questions list */}
      {questions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {(category === 'All' ? CATEGORIES.slice(1) : [category]).map((cat) => {
            const qs = category === 'All' ? grouped[cat] : filtered
            if (!qs?.length) return null
            return (
              <div key={cat}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <CategoryBadge cat={cat} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{qs.length} questions</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {qs.map((q, i) => (
                    <div key={i} className="question-card" onClick={() => setExpanded((p) => ({ ...p, [`${cat}-${i}`]: !p[`${cat}-${i}`] }))}>
                      <div className="question-number">{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, lineHeight: 1.5 }}>{q.question}</div>
                        {expanded[`${cat}-${i}`] && q.hint && (
                          <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            💡 <strong>Hint:</strong> {q.hint}
                          </div>
                        )}
                      </div>
                      {q.hint && (
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                          {expanded[`${cat}-${i}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', gap: 12 }}>
            <button id="regenerate-btn" className="btn btn-secondary" onClick={generate} disabled={loading}>
              <RefreshCw size={16} /> Regenerate
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <MessageSquare size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No questions yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
            Select your target role and difficulty, then click Generate
          </p>
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            <Zap size={16} /> Generate Questions
          </button>
        </div>
      )}
    </div>
  )
}

function CategoryBadge({ cat }) {
  const map = {
    'HR': { cls: 'badge-accent', label: '💬 HR / Behavioral' },
    'Technical': { cls: 'badge-primary', label: '⚙ Technical' },
    'Project-Based': { cls: 'badge-warning', label: '📁 Project-Based' },
  }
  const { cls, label } = map[cat] || { cls: 'badge-primary', label: cat }
  return <span className={`badge ${cls}`}>{label}</span>
}
