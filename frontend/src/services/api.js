import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Problems ──────────────────────────────────────────────────────────────
export const getProblems     = (status)  => api.get('/api/problems/', { params: { status_filter: status } })
export const createProblem   = (data)    => api.post('/api/problems/', data)

// ── Matching ──────────────────────────────────────────────────────────────
export const dispatchVolunteers = (problem_id) =>
  api.post('/api/match/dispatch', { problem_id })

export const getMatches = (problem_id) =>
  api.get(`/api/match/${problem_id}`)

export const confirmResolution = (data) =>
  api.post('/api/match/confirm', data)

export default api