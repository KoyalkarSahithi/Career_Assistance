import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { User, Mail, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { updateUser } from '../store/authSlice'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    email:      user?.email      || '',
  })
  const [passForm, setPassForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading]   = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  const initials = ((form.first_name?.[0] || '') + (form.last_name?.[0] || '')) || user?.username?.[0] || 'U'

  async function saveProfile(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.put('/auth/profile/', form)
      dispatch(updateUser(data))
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    if (passForm.new_password !== passForm.confirm) return toast.error('Passwords do not match')
    if (passForm.new_password.length < 8) return toast.error('Password must be 8+ characters')
    setPassLoading(true)
    try {
      await api.post('/auth/change-password/', {
        old_password: passForm.old_password,
        new_password: passForm.new_password,
      })
      toast.success('Password changed!')
      setPassForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-description">Manage your account details and password</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        {/* Avatar card */}
        <div className="card" style={{ textAlign: 'center', alignSelf: 'start' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff', margin: '0 auto 16px', boxShadow: 'var(--shadow-glow)' }}>
            {initials.toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{form.first_name} {form.last_name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{form.email}</div>
          <div style={{ marginTop: 12 }}>
            <span className="badge badge-primary">{user?.username}</span>
          </div>
        </div>

        {/* Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Profile form */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Personal Information</div>
            </div>
            <form onSubmit={saveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <div className="form-input-icon">
                    <User className="input-icon" size={16} />
                    <input id="profile-fname" type="text" className="form-input" placeholder="First Name"
                      value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <div className="form-input-icon">
                    <User className="input-icon" size={16} />
                    <input id="profile-lname" type="text" className="form-input" placeholder="Last Name"
                      value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="form-input-icon">
                  <Mail className="input-icon" size={16} />
                  <input id="profile-email" type="email" className="form-input"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
              </button>
            </form>
          </div>

          {/* Password form */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Change Password</div>
            </div>
            <form onSubmit={changePassword}>
              {['old_password', 'new_password', 'confirm'].map((field) => (
                <div key={field} className="form-group">
                  <label className="form-label">
                    {field === 'old_password' ? 'Current Password' : field === 'new_password' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <div className="form-input-icon">
                    <Lock className="input-icon" size={16} />
                    <input id={`pass-${field}`} type="password" className="form-input" placeholder="••••••••"
                      value={passForm[field]} onChange={(e) => setPassForm({ ...passForm, [field]: e.target.value })} />
                  </div>
                </div>
              ))}
              <button id="change-password-btn" type="submit" className="btn btn-secondary" disabled={passLoading}>
                {passLoading ? <span className="spinner" /> : <><Lock size={16} /> Update Password</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
