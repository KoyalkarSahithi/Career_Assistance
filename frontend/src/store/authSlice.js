import { createSlice } from '@reduxjs/toolkit'

const token = localStorage.getItem('access_token')
const user  = JSON.parse(localStorage.getItem('user') || 'null')

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: token || null, user: user || null, loading: false, error: null },
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.access
      state.user  = payload.user
      localStorage.setItem('access_token',  payload.access)
      localStorage.setItem('refresh_token', payload.refresh)
      localStorage.setItem('user', JSON.stringify(payload.user))
    },
    updateUser(state, { payload }) {
      state.user = { ...state.user, ...payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
    logout(state) {
      state.token = null
      state.user  = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    },
    setLoading(state, { payload }) { state.loading = payload },
    setError(state, { payload })   { state.error   = payload },
  },
})

export const { setCredentials, updateUser, logout, setLoading, setError } = authSlice.actions
export default authSlice.reducer
