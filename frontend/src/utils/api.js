import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with better configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better auth error handling
let isRefreshing = false;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please try again.');
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Check connection/backend.');
      } else {
        toast.error('Unable to connect to server.');
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    console.error(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url} - ${status}:`, data?.message || 'Unknown error');

    switch (status) {
      case 401:
        if (!isRefreshing && !originalRequest._retry) {
          console.log('🔄 Token expired, attempting to refresh...');
          const token = localStorage.getItem('token');
          if (token) {
            originalRequest._retry = true;
            try {
              const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.data.success) {
                console.log('✅ Token is still valid, retrying request');
                return api(originalRequest);
              }
            } catch (refreshError) {
              console.log('❌ Token refresh failed');
            }
          }
          console.log('🧹 Clearing invalid session');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          window.dispatchEvent(new CustomEvent('auth-error'));
          toast.error('Session expired. Please login again.');
        }
        break;
      case 403:
        toast.error('Access denied.');
        break;
      case 404:
        if (!originalRequest.url.includes('/dashboard')) {
          toast.error('Resource not found.');
        }
        break;
      case 422:
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => toast.error(err.msg || err.message));
        } else {
          toast.error(data.message || 'Validation error.');
        }
        break;
      case 429:
        toast.error('Too many requests.');
        break;
      case 500:
        toast.error('Server error.');
        break;
      default:
        if (data?.message) {
          toast.error(data.message);
        } else {
          toast.error(`Error ${status}: Something went wrong.`);
        }
    }
    return Promise.reject(error);
  }
);

// Enhanced API methods
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login successful');
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      const response = await api.post('/auth/register', userData);
      console.log('✅ Registration successful');
      return response;
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      throw error;
    }
  },
  logout: () => {
    console.log('🚪 Logging out...');
    return api.post('/auth/logout').catch(() => {});
  },
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data)
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getRequests: (params) => api.get('/admin/requests', { params }),
  approveRequest: (id, data) => api.put(`/admin/requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.put(`/admin/requests/${id}/reject`, data),
  getReports: (params) => api.get('/admin/reports/summary', { params }),
  getUserHistory: (userId) => api.get(`/admin/users/${userId}/history`),
};

export const officerAPI = {
  getDashboard: () => api.get('/officer/dashboard'),
  getRequests: (params) => api.get('/officer/requests', { params }),
  createRequest: (requestData) => api.post('/officer/requests', requestData),
  cancelRequest: (id) => api.put(`/officer/requests/${id}/cancel`),
  getIssuedEquipment: () => api.get('/officer/equipment/issued'),
  getInventory: (params) => api.get('/officer/inventory', { params }),
  getEquipmentDetails: (id) => api.get(`/officer/equipment/${id}`),
  getAuthorizedEquipmentPools: (params) => {
    console.log('🔄 GET /equipment/authorized-pools', params);
    return api.get('/equipment/authorized-pools', { params });
  },
  requestEquipmentFromPool: (data) => {
    console.log('🔄 POST /officer/equipment-requests/from-pool', data);
    return api.post('/officer/equipment-requests/from-pool', data);
  },
  getMyHistory: () => api.get('/officer/my-history'),
};

export const equipmentAPI = {
  getMaintenanceItems: () => api.get('/equipment/maintenance-items'),
  getEquipmentPools: (params) => {
    console.log('🔄 GET /equipment/pools', params);
    return api.get('/equipment/pools', { params });
  },
  getEquipmentPoolsByDesignation: (designation) => {
    console.log('🔄 GET /equipment/pools/by-designation', { designation });
    return api.get('/equipment/pools/by-designation', { params: { designation } });
  },
  createEquipmentPool: (poolData) => {
    console.log('🔄 POST /equipment/pools', poolData);
    return api.post('/equipment/pools', poolData);
  },
  getEquipmentPoolDetails: (poolId) => {
    console.log(`🔄 GET /equipment/pools/${poolId}`);
    return api.get(`/equipment/pools/${poolId}`);
  },
  issueEquipmentFromPool: (poolId, data) => {
    console.log(`🔄 POST /equipment/pools/${poolId}/issue`, data);
    return api.post(`/equipment/pools/${poolId}/issue`, data);
  },
  returnEquipmentToPool: (poolId, data) => {
    console.log(`🔄 POST /equipment/pools/${poolId}/return`, data);
    return api.post(`/equipment/pools/${poolId}/return`, data);
  },
  getItemHistory: (poolId, uniqueId) => {
    console.log(`🔄 GET /equipment/pools/${poolId}/items/${uniqueId}/history`);
    return api.get(`/equipment/pools/${poolId}/items/${uniqueId}/history`);
  },
  getMyEquipmentHistory: () => {
    console.log('🔄 GET /equipment/my-equipment-history');
    return api.get('/equipment/my-equipment-history');
  },
  getCurrentlyIssuedEquipment: () => {
    console.log('🔄 GET /equipment/currently-issued');
    return api.get('/equipment/currently-issued');
  },
  deleteEquipmentPool: (poolId) => {
    console.log(`🔄 DELETE /equipment/pools/${poolId}`);
    return api.delete(`/equipment/pools/${poolId}`);
  },
  updateEquipmentPool: (poolId, data) => {
    console.log(`🔄 PUT /equipment/pools/${poolId}`, data);
    return api.put(`/equipment/pools/${poolId}`, data);
  },
  completeMaintenance: (data) => {
    console.log('🔄 POST /equipment/pools/complete-maintenance', data);
    return api.post('/equipment/pools/complete-maintenance', data);
  },
  writeOffLost: (data) => {
    console.log('🔄 POST /equipment/pools/write-off-lost', data);
    return api.post('/equipment/pools/write-off-lost', data);
  },
  markAsRecovered: (data) => {
    console.log('🔄 POST /equipment/pools/mark-recovered', data);
    return api.post('/equipment/pools/mark-recovered', data);
  }
};

export const checkServerHealth = async () => {
  try {
    console.log('🏥 Checking server health...');
    const response = await axios.get(
      (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/health',
      { timeout: 5000 }
    );
    console.log('✅ Server is healthy:', response.data);
    return { healthy: true, data: response.data };
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      toast.error('Backend server is not running.');
    } else {
      toast.error('Unable to connect to backend server.');
    }
    return { healthy: false, error: error.message };
  }
};

export const testConnection = async () => {
  const health = await checkServerHealth();
  if (health.healthy) {
    try {
      await axios.get((process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/auth/me');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: true, message: 'Connection successful (not authenticated)' };
      }
      return { success: false, message: 'Auth endpoint unreachable' };
    }
  }
  return { success: false, message: 'Server unreachable' };
};

export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

export const getStatusBadgeClass = (status) => {
  const statusClasses = {
    'Available': 'badge-success',
    'Issued': 'badge-warning',
    'Under Maintenance': 'badge-info',
    'Retired': 'badge-danger',
    'Pending': 'badge-warning',
    'Approved': 'badge-success',
    'Rejected': 'badge-danger',
    'Completed': 'badge-info',
    'Cancelled': 'badge-secondary'
  };
  return statusClasses[status] || 'badge-secondary';
};

export default api;