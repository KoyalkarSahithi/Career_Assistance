import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import resumeReducer from './resumeSlice'
import interviewReducer from './interviewSlice'

export const store = configureStore({
  reducer: {
    auth:      authReducer,
    resume:    resumeReducer,
    interview: interviewReducer,
  },
})
