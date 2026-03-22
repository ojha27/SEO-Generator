import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (username: string, email: string, password: string) => 
    api.post('/auth/register', { username, email, password }),
  
  getProfile: () => 
    api.get('/auth/me'),
}

// SEO API
export const seoAPI = {
  generate: (keyword: string, topic: string, targetUrl?: string) => 
    api.post('/seo/generate', { keyword, topic, targetUrl }),
  
  getHistory: (page = 1, limit = 10) => 
    api.get(`/seo/history?page=${page}&limit=${limit}`),
  
  getGeneration: (id: string) => 
    api.get(`/seo/${id}`),
  
  getUsage: () => 
    api.get('/seo/usage'),
  
  deleteGeneration: (id: string) => 
    api.delete(`/seo/${id}`),
}

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
}

export default api
