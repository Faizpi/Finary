import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finary_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const dashboardApi = {
  getDashboard: () => api.get('/dashboard'),
  getProfile: () => api.get('/insights/profile'),
  getBadges: () => api.get('/insights/badges'),
  getLeaderboard: () => api.get('/insights/leaderboard'),
}

export const assessmentApi = {
  getLatest: () => api.get('/assessment/latest'),
  create: (payload) => api.post('/assessment', payload),
}

export const transactionApi = {
  list: (params = {}) => api.get('/transactions', { params }),
  create: (payload) => api.post('/transactions', payload),
  remove: (id) => api.delete(`/transactions/${id}`),
}

export const budgetApi = {
  list: () => api.get('/budgets'),
  create: (payload) => api.post('/budgets', payload),
}

export const recommendationApi = {
  sideHustles: (payload = {}) => api.post('/recommendations/side-hustles', payload),
}

export const forumApi = {
  list: () => api.get('/forum/posts'),
  create: (payload) => api.post('/forum/posts', payload),
  reply: (postId, payload) => api.post(`/forum/posts/${postId}/replies`, payload),
}

export const reportApi = {
  exportUrl: (month) => `${api.defaults.baseURL}/reports/transactions/export?month=${month}`,
}

export default api
