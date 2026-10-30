import axiosInstance from './axiosInstance';

export const usersApi = {
  updateProfile: async (data) => {
    // data: { fullName, phone, address }
    const response = await axiosInstance.patch('/users/profile', data);
    return response.data?.user;
  },

  getDepartmentWorkers: async (departmentId = null) => {
    const url = departmentId ? `/users/workers/${departmentId}` : '/users/workers';
    const response = await axiosInstance.get(url);
    return response.data?.workers || [];
  },

  listUsers: async (params = {}) => {
    const response = await axiosInstance.get('/users', { params });
    return response.data?.users || [];
  },

  getUserById: async (id) => {
    const response = await axiosInstance.get(`/users/${id}`);
    return response.data?.user;
  },

  createUser: async (data) => {
    const response = await axiosInstance.post('/users', data);
    return response.data?.user;
  },

  updateUserStatus: async (id, isActive) => {
    const response = await axiosInstance.patch(`/users/${id}/status`, { isActive });
    return response.data?.user;
  },
};

export default usersApi;

