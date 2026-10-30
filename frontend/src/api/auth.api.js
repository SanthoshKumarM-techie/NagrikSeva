import axiosInstance from './axiosInstance';

export const authApi = {
  login: async (credentials) => {
    // credentials: { email, password } OR { userId, password }
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data?.user;
  },

  register: async (userData) => {
    // userData: { email, password, fullName, phoneNumber, role, departmentId, specialization, address }
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data?.user;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response;
  },

  getSession: async () => {
    const response = await axiosInstance.get('/auth/session');
    return response.data; // { authenticated: boolean, user: Object|null }
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data?.user;
  },
};

export default authApi;

