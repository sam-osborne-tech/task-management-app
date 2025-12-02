import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const taskApi = {
  // Get all tasks with optional filters
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    // Transform API response to match frontend expectations
    return { tasks: response.data, pagination: response.pagination };
  },

  // Get a single task by ID
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update an existing task
  updateTask: async (id, updates) => {
    const response = await api.put(`/tasks/${id}`, updates);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    return id;
  },

  // Get task statistics
  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  // Bulk delete tasks
  bulkDelete: async (ids) => {
    const response = await api.post('/tasks/bulk-delete', { ids });
    return response.data;
  },

  // Bulk update status
  bulkUpdateStatus: async (ids, status) => {
    const response = await api.patch('/tasks/bulk-status', { ids, status });
    return response.data;
  },

  // Export tasks
  exportTasks: async (format = 'json') => {
    const response = await api.get('/tasks/export', { 
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    return response;
  }
};

export default api;

