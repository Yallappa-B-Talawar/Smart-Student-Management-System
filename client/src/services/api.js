import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ssms-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't intercept 401s from login or refresh endpoints themselves
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        localStorage.setItem('ssms-token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('ssms-token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Students API ──
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getStats: () => api.get('/students/stats'),
  myProfile: () => api.get('/students/my-profile'),
};

// ── Teachers API ──
export const teachersAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getStats: () => api.get('/teachers/stats'),
  myProfile: () => api.get('/teachers/my-profile'),
  updateMyProfile: (data) => api.put('/teachers/my-profile', data),
};

// ── Attendance API ──
export const attendanceAPI = {
  getByClass: (cls, date) => api.get('/attendance', { params: { class: cls, date } }),
  mark: (records) => api.post('/attendance/mark', { records }),
  getStats: (cls, date) => api.get('/attendance/stats', { params: { class: cls, date } }),
  myAttendance: (params) => api.get('/attendance/my-attendance', { params }),
};

// ── Organizations API ──
export const organizationsAPI = {
  getAll: () => api.get('/organizations'),                         // public
  getById: (id) => api.get(`/organizations/${id}`),               // public
  create: (data) => api.post('/organizations', data),             // admin
  update: (id, data) => api.put(`/organizations/${id}`, data),    // admin
  delete: (id) => api.delete(`/organizations/${id}`),             // admin
  getStats: () => api.get('/organizations/admin/stats'),          // admin
};

export default api;
