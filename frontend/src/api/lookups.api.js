import axiosInstance from './axiosInstance';

export const lookupsApi = {
  getDepartments: async (params = {}) => {
    const response = await axiosInstance.get('/departments', { params });
    return response.data?.departments || [];
  },

  getCategories: async (params = {}) => {
    const response = await axiosInstance.get('/categories', { params });
    return response.data?.categories || [];
  },

  getWards: async (params = {}) => {
    const response = await axiosInstance.get('/wards', { params });
    return response.data?.wards || [];
  },

  createDepartment: async (data) => {
    const response = await axiosInstance.post('/departments', data);
    return response.data?.department || response.department || response;
  },

  updateDepartment: async (id, data) => {
    const response = await axiosInstance.put(`/departments/${id}`, data);
    return response.data?.department || response.department || response;
  },

  toggleDepartmentStatus: async (id, isActive) => {
    const response = await axiosInstance.patch(`/departments/${id}/status`, { isActive });
    return response.data?.department || response.department || response;
  },
};

export default lookupsApi;

