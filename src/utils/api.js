import axios from 'axios'

// ── Base URL management ──────────────────────────────────────────────────────
// Default production backend URL — user can override in Settings
const DEFAULT_BACKEND_URL = 'https://vps.axorawebsolutions.com'

const _stored = localStorage.getItem('fb_base_url') || ''
const _isWrongUrl = _stored === '' 
  || _stored.includes('outreach.axorawebsolutions.com')
  || _stored.includes('pylister.axorawebsolutions.com')
  || _stored.includes('localhost')
  || _stored.includes('127.0.0.1')
if (_isWrongUrl) {
  localStorage.setItem('fb_base_url', DEFAULT_BACKEND_URL)
}
let baseUrl = (_isWrongUrl ? DEFAULT_BACKEND_URL : _stored).replace(/\/+$/, '')

export function getBaseUrl() {
  return baseUrl
}

export function setBaseUrl(url) {
  const clean = (url || '').replace(/\/+$/, '')
  baseUrl = clean || ''
  localStorage.setItem('fb_base_url', baseUrl)
  instance.defaults.baseURL = baseUrl
  return baseUrl
}

// ── Token management ─────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('access_token')
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('access_token', token)
  } else {
    localStorage.removeItem('access_token')
  }
}

export function clearToken() {
  localStorage.removeItem('access_token')
}

export function hasToken() {
  return Boolean(localStorage.getItem('access_token'))
}

// ── Axios instance ───────────────────────────────────────────────────────────
const instance = axios.create({
  baseURL: baseUrl,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

// Inject auth token on every request
instance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-clear token on 401 and broadcast so App can redirect to login
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken()
      // Notify the app to redirect to login screen
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(err)
  }
)

// ── API methods ──────────────────────────────────────────────────────────────
const api = {
  // ── Health ─────────────────────────────────────────────────────────────────
  health: () => instance.get('/health').then((res) => res.data),

  // ── Auth ───────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const { data } = await instance.post('/api/auth/login', { email, password })
    setToken(data.access_token)
    return data
  },

  signup: async (email, password) => {
    const { data } = await instance.post('/api/auth/signup', { email, password })
    return data
  },

  me: () => instance.get('/api/auth/me').then((res) => res.data),

  logout: async () => {
    try {
      await instance.post('/api/auth/logout')
    } finally {
      clearToken()
    }
  },

  // ── Accounts ───────────────────────────────────────────────────────────────
  getAccounts: () =>
    instance.get('/api/accounts/').then((res) => res.data),

  getAccount: (id) =>
    instance.get(`/api/accounts/${id}`).then((res) => res.data),

  createAccount: (payload) =>
    instance.post('/api/accounts/', payload).then((res) => res.data),

  updateAccount: (id, payload) =>
    instance.patch(`/api/accounts/${id}`, payload).then((res) => res.data),

  deleteAccount: (id) =>
    instance.delete(`/api/accounts/${id}`).then((res) => res.data),

  verifyAccount: (id) =>
    instance.post(`/api/accounts/${id}/verify`).then((res) => res.data),

  verifyAccountInteractive: (id) =>
    instance.post(`/api/accounts/${id}/verify-interactive`).then((res) => res.data),

  verifySession: async (formData) => {
    console.log('[api] verifySession called with FormData')
    try {
      // Override default Content-Type header to allow axios to set multipart/form-data boundary
      const { data } = await instance.post('/api/accounts/verify-session', formData, {
        headers: { 'Content-Type': undefined }  // Let axios set the boundary
      })
      console.log('[api] verifySession response:', data)
      return data
    } catch (err) {
      console.error('[api] verifySession error:', err.response?.data || err.message)
      throw err
    }
  },

  createImportSessionAccount: (payload) =>
    instance.post('/api/accounts/', payload).then((res) => res.data),

  // ── Listings ───────────────────────────────────────────────────────────────
  getListings: (params = {}) =>
    instance.get('/api/listings/', { params }).then((res) => res.data),

  getListing: (id) =>
    instance.get(`/api/listings/${id}`).then((res) => res.data),

  createListing: (payload) =>
    instance.post('/api/listings/', payload).then((res) => res.data),

  updateListing: (id, payload) =>
    instance.patch(`/api/listings/${id}`, payload).then((res) => res.data),

  deleteListing: (id) =>
    instance.delete(`/api/listings/${id}`).then((res) => res.data),

  // ── Tasks ──────────────────────────────────────────────────────────────────
  getTasks: (params = {}) =>
    instance.get('/api/tasks/', { params }).then((res) => res.data),

  // NOTE: GET /api/tasks/{id} works now — using direct endpoint
  getTask: (taskId) =>
    instance.get(`/api/tasks/${taskId}`).then((res) => res.data),

  cancelTask: (taskId) =>
    instance.post(`/api/tasks/${taskId}/cancel`).then((res) => res.data),

  getTaskLogs: (taskId, limit = 100) =>
    instance.get(`/api/tasks/${taskId}/logs`, { params: { limit } }).then((res) => res.data),

  getAllLogs: (params = {}) =>
    instance.get('/api/tasks/logs/all', { params }).then((res) => res.data),

  deleteLog: (logId) =>
    instance.delete(`/api/tasks/logs/${logId}`).then((res) => res.data),

  deleteLogsBulk: (logIds) =>
    instance.delete('/api/tasks/logs/bulk', { data: { log_ids: logIds } }).then((res) => res.data),

  deleteAllLogs: () =>
    instance.delete('/api/tasks/logs/all').then((res) => res.data),

  cleanupStuckTasks: () =>
    instance.post('/api/tasks/cleanup-stuck').then((res) => res.data),

  // ── Automation (15 features) ───────────────────────────────────────────────
  startAutomation: async (name, payload = {}) => {
    const { data } = await instance.post(`/api/automation/${name}`, payload)
    return data
  },

  // Convenience wrappers for each automation endpoint
  newAccountSlow: (payload) => api.startAutomation('new-account-slow', payload),
  newAccountSlowV2: (payload) => api.startAutomation('new-account-slow-v2', payload),
  ultraAIListings: (payload) => api.startAutomation('ultra-ai-listings', payload),
  createDrafts: (payload) => api.startAutomation('create-drafts', payload),
  renewListings: (payload) => api.startAutomation('renew-listings', payload),
  relistListings: (payload) => api.startAutomation('relist-listings', payload),
  draftPublisherAI: (payload) => api.startAutomation('draft-publisher-ai', payload),
  deleteAllListings: (payload) => api.startAutomation('delete-all-listings', payload),
  draftPublisher: (payload) => api.startAutomation('draft-publisher', payload),
  publishListing: (payload) => api.startAutomation('publish-listing', payload),
  draftDelete: (payload) => api.startAutomation('draft-delete', payload),
  deleteListingAutomation: (payload) => api.startAutomation('delete-listing', payload),
  adsMultiplier: (payload) => api.startAutomation('ads-multiplier', payload),
  warmup: (payload) => api.startAutomation('warmup', payload),
  profileUpdater: (payload) => api.startAutomation('profile-updater', payload),
  getClicks: (payload = {}) =>
    instance.post('/api/automation/get-clicks', payload).then((res) => res.data),
  openAccounts: (payload) =>
    instance.post('/api/automation/open-accounts', payload).then((res) => res.data),

  generateProduct: (idea) =>
    instance.post('/api/automation/generate-product', { idea }).then((res) => res.data),

  // ── File upload ────────────────────────────────────────────────────────────
  /**
   * Upload one or more image files to the backend.
   * Returns { paths: string[] } — absolute server paths Playwright can use.
   */
  uploadImages: async (files) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    const { data } = await instance.post('/api/automation/upload-images', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return data
  },

  // ── Inbox ──────────────────────────────────────────────────────────────────
  getInboxMessages: (params = {}) =>
    instance.get('/api/inbox/', { params }).then((res) => res.data),

  getInboxMessage: (id) =>
    instance.get(`/api/inbox/${id}`).then((res) => res.data),

  readInbox: (payload) =>
    instance.post('/api/inbox/read', payload).then((res) => res.data),

  autoReplyInbox: (payload) =>
    instance.post('/api/inbox/auto-reply', payload).then((res) => res.data),

  replyInboxMessage: (messageId, payload) =>
    instance.post(`/api/inbox/${messageId}/reply`, payload).then((res) => res.data),

  deleteInboxMessage: (id) =>
    instance.delete(`/api/inbox/${id}`).then((res) => res.data),
}

export default api
