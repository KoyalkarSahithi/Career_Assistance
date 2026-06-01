import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { User, Mail, Lock, Eye, EyeOff, Brain } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { setCredentials } from '../store/authSlice'

export default function RegisterPage() {
  const [form, setForm]         = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) return toast.error('Fill in all fields')
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 8) return toast.error('Password must be 8+ characters')

    setLoading(true)
    try {
      const { data } = await api.post('/auth/register/', {
        username: form.username,
        email: form.email,
        password: form.password,
      })
      dispatch(setCredentials(data))
      toast.success('Account created! Welcome 🎉')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data
      toast.error(typeof msg === 'object' ? Object.values(msg).flat().join('. ') : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Brain size={24} color="#fff" /></div>
          <span className="auth-logo-text">ResumeAI</span>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subheading">Start your AI-powered career journey today</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="form-input-icon">
              <User className="input-icon" size={18} />
              <input id="reg-name" type="text" className="form-input" placeholder="John Doe"
                value={form.username} onChange={update('username')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="form-input-icon">
              <Mail className="input-icon" size={18} />
              <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={update('email')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-icon">
              <Lock className="input-icon" size={18} />
              <input id="reg-password" type={showPass ? 'text' : 'password'} className="form-input"
                placeholder="Min. 8 characters" style={{ paddingRight: 44 }}
                value={form.password} onChange={update('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="form-input-icon">
              <Lock className="input-icon" size={18} />
              <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat password"
                value={form.confirm} onChange={update('confirm')} />
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary btn-lg w-full"
            disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
