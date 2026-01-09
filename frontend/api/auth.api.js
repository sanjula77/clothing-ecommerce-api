import api from './axios';

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    // Backend returns { success: true, data: { _id, name, email, token } }
    return response.data.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    // Backend returns { success: true, data: { _id, name, email, token } }
    return response.data.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    // Backend returns { success: true, data: user }
    return response.data.data;
  },
};

