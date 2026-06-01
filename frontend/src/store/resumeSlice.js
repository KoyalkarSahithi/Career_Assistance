import { createSlice } from '@reduxjs/toolkit'

const resumeSlice = createSlice({
  name: 'resume',
  initialState: {
    currentResume: null,   // { id, file_name, upload_date }
    analysis: null,        // { ats_score, technical_skills, soft_skills, missing_skills, feedback }
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentResume(state, { payload }) { state.currentResume = payload },
    setAnalysis(state, { payload })      { state.analysis = payload },
    setHistory(state, { payload })       { state.history = payload },
    setLoading(state, { payload })       { state.loading = payload },
    setError(state, { payload })         { state.error = payload },
    clearResume(state) {
      state.currentResume = null
      state.analysis      = null
    },
  },
})

export const { setCurrentResume, setAnalysis, setHistory, setLoading, setError, clearResume } = resumeSlice.actions
export default resumeSlice.reducer
