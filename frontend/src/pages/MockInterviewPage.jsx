import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Send, Bot, User, RotateCcw, Award, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { setActiveSession, addMessage, setReport, clearSession } from '../store/interviewSlice'

export default function MockInterviewPage() {
  const dispatch     = useDispatch()
  const { activeSession, report } = useSelector((s) => s.interview)
  const { currentResume }         = useSelector((s) => s.resume)

  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages])

  async function startSession() {
    setStarting(true)
    try {
      const { data } = await api.post('/interviews/mock/start/', {
        resume_id: currentResume?.id || null,
      })
      dispatch(setActiveSession({ id: data.session_id, messages: data.messages }))
    } catch {
      toast.error('Failed to start session. Try again.')
    } finally {
      setStarting(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    dispatch(addMessage(userMsg))
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/interviews/mock/respond/', {
        session_id: activeSession.id,
        message: userMsg.content,
      })
      dispatch(addMessage({ role: 'ai', content: data.response }))
      if (data.is_complete) {
        dispatch(setReport(data.report))
      }
    } catch {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // --- Report view ---
  if (report) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Interview Report 🎉</h1>
          <p className="page-description">Here's how you performed in your mock interview</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Technical Score',     value: report.technical_score,     color: 'var(--primary-light)' },
            { label: 'Communication Score', value: report.communication_score, color: 'var(--accent-light)' },
            { label: 'Overall Score',       value: report.overall_score,       color: 'var(--success-light)' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: 'center', padding: 28 }}>
              <Award size={32} color={s.color} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 48, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}%</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title">AI Feedback</div></div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{report.feedback}</p>
        </div>
        {report.strengths?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12, color: 'var(--success-light)' }}>✅ Strengths</div>
              {report.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>{s}</div>)}
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 12, color: 'var(--warning)' }}>⚠ Areas to Improve</div>
              {report.improvements?.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>{s}</div>)}
            </div>
          </div>
        )}
        <button id="new-interview-btn" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}
          onClick={() => dispatch(clearSession())}>
          <RotateCcw size={16} /> Start New Interview
        </button>
      </div>
    )
  }

  // --- Start screen ---
  if (!activeSession) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">AI Mock Interview</h1>
          <p className="page-description">Practice with an AI interviewer and get real-time feedback</p>
        </div>
        <div className="card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', padding: 48 }}>
          <div style={{ width: 72, height: 72, background: 'var(--gradient-brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--shadow-glow)' }}>
            <Bot size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Ready for your interview?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            The AI will ask you interview questions one by one. Answer naturally and get scored on technical accuracy and communication skills.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
            {['Questions are based on your resume', '5–10 questions per session', 'Get scored & detailed feedback at the end'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--success-light)' }}>✓</span> {t}
              </div>
            ))}
          </div>
          <button id="start-interview-btn" className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }}
            onClick={startSession} disabled={starting}>
            {starting ? <><span className="spinner" /> Starting...</> : <><Bot size={18} /> Start Mock Interview</>}
          </button>
        </div>
      </div>
    )
  }

  // --- Chat interface ---
  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Mock Interview</h1>
          <p className="page-description">Answer naturally. Press Enter or click Send.</p>
        </div>
        <button id="end-interview-btn" className="btn btn-danger btn-sm" onClick={() => dispatch(clearSession())}>End Session</button>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {activeSession.messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`chat-avatar ${msg.role === 'user' ? 'user-av' : 'ai'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-msg">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble ai">
              <div className="chat-avatar ai"><Bot size={16} /></div>
              <div className="chat-msg" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Evaluating your answer...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            id="chat-input"
            className="chat-textarea"
            placeholder="Type your answer... (Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <button id="send-btn" className="btn btn-primary btn-icon" onClick={sendMessage}
            disabled={!input.trim() || loading} style={{ height: 48, width: 48, flexShrink: 0 }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
