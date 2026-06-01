import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { setCurrentResume, setAnalysis } from '../store/resumeSlice'

export default function UploadPage() {
  const [file, setFile]       = useState(null)
  const [status, setStatus]   = useState('idle') // idle | uploading | analyzing | done | error
  const [progress, setProgress] = useState(0)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length) return toast.error('Only PDF files under 5MB are allowed')
    setFile(accepted[0])
    setStatus('idle')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  async function handleUpload() {
    if (!file) return toast.error('Please select a resume first')
    const formData = new FormData()
    formData.append('resume', file)

    setStatus('uploading')
    setProgress(30)
    try {
      // Upload
      const { data: uploadData } = await api.post('/resumes/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 50)),
      })
      dispatch(setCurrentResume(uploadData))
      setProgress(60)
      setStatus('analyzing')
      toast('Analyzing your resume with AI...', { icon: '🤖' })

      // Analyze
      const { data: analysisData } = await api.get(`/resumes/${uploadData.id}/analyze/`)
      dispatch(setAnalysis(analysisData))
      setProgress(100)
      setStatus('done')
      toast.success('Analysis complete!')
    } catch (err) {
      setStatus('error')
      toast.error(err.response?.data?.detail || 'Upload failed. Try again.')
    }
  }

  function viewAnalysis() {
    navigate('/analysis')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Upload Resume</h1>
        <p className="page-description">Upload your PDF resume to get an AI-powered analysis and ATS score</p>
      </div>

      {/* Dropzone */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} id="resume-dropzone" />
          <div className="dropzone-icon">
            {file ? <FileText size={28} /> : <Upload size={28} />}
          </div>
          {file ? (
            <>
              <p className="dropzone-title" style={{ color: 'var(--primary-light)' }}>{file.name}</p>
              <p className="dropzone-hint">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
            </>
          ) : (
            <>
              <p className="dropzone-title">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              <p className="dropzone-hint">or click to browse · PDF only · Max 5MB</p>
            </>
          )}
        </div>

        {/* Remove file */}
        {file && status === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} color="var(--primary-light)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={() => { setFile(null); setStatus('idle') }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Progress */}
        {(status === 'uploading' || status === 'analyzing') && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <span>{status === 'uploading' ? 'Uploading...' : '🤖 AI is analyzing your resume...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'done' && (
          <div style={{ marginTop: 20, padding: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <CheckCircle size={28} color="var(--success-light)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--success-light)' }}>Analysis Complete!</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Your resume has been analyzed. View your results now.</div>
            </div>
            <button id="view-analysis-btn" className="btn btn-primary" onClick={viewAnalysis}>View Analysis</button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="var(--danger)" />
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>Upload failed. Please try again.</span>
          </div>
        )}

        {/* Upload btn */}
        {(status === 'idle' || status === 'error') && (
          <button id="upload-btn" className="btn btn-primary btn-lg w-full" style={{ marginTop: 20, justifyContent: 'center' }}
            onClick={handleUpload} disabled={!file}>
            <Upload size={18} />
            Analyze My Resume
          </button>
        )}

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 28 }}>
          {[
            { emoji: '🎯', title: 'ATS Score', desc: 'See how your resume scores on ATS systems' },
            { emoji: '🧠', title: 'AI Feedback', desc: 'Get smart suggestions to improve your resume' },
            { emoji: '💡', title: 'Skill Gaps', desc: 'Discover missing skills for your target role' },
          ].map((c) => (
            <div key={c.title} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{c.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
