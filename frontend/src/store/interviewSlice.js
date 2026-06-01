import { createSlice } from '@reduxjs/toolkit'

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    questions:    [],   // Generated question list
    sessions:     [],   // History
    activeSession: null, // { id, messages: [] }
    report: null,
    loading: false,
  },
  reducers: {
    setQuestions(state, { payload })      { state.questions = payload },
    setSessions(state, { payload })       { state.sessions  = payload },
    setActiveSession(state, { payload })  { state.activeSession = payload },
    addMessage(state, { payload }) {
      if (state.activeSession) {
        state.activeSession.messages.push(payload)
      }
    },
    setReport(state, { payload })  { state.report  = payload },
    setLoading(state, { payload }) { state.loading = payload },
    clearSession(state) {
      state.activeSession = null
      state.report = null
    },
  },
})

export const { setQuestions, setSessions, setActiveSession, addMessage, setReport, setLoading, clearSession } = interviewSlice.actions
export default interviewSlice.reducer
