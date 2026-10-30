import axiosInstance from './axiosInstance';

export const complaintsApi = {
  getComplaints: async (params = {}) => {
    const response = await axiosInstance.get('/complaints', { params });
    return response.data?.complaints || [];
  },

  getComplaintById: async (id) => {
    const response = await axiosInstance.get(`/complaints/${id}`);
    return response.data?.complaint || null;
  },

  createComplaint: async (data) => {
    const response = await axiosInstance.post('/complaints', data);
    return response.data?.complaint;
  },

  findMatches: async (data) => {
    // data: { categoryId, latitude, longitude, radiusMeters, title, description }
    const response = await axiosInstance.post('/complaints/matches', data);
    return response.data?.matches || [];
  },

  getMapComplaints: async (params = {}) => {
    const response = await axiosInstance.get('/complaints/map', { params });
    return response.data?.complaints || [];
  },

  getMyComplaints: async (params = {}) => {
    const response = await axiosInstance.get('/complaints/my', { params });
    return response.data?.complaints || [];
  },

  supportComplaint: async (id) => {
    const response = await axiosInstance.post(`/complaints/${id}/support`);
    return response.data;
  },

  cancelComplaint: async (id, reason) => {
    const response = await axiosInstance.patch(`/complaints/${id}/cancel`, { reason });
    return response.data?.complaint;
  },

  getCitizenStats: async () => {
    const response = await axiosInstance.get('/complaints/stats/citizen');
    return response.data?.stats || { totalComplaints: 0, pendingCount: 0, inProgressCount: 0, resolvedCount: 0 };
  },

  getDepartmentStats: async () => {
    const response = await axiosInstance.get('/complaints/stats/department');
    return response.data?.stats || {};
  },
};

export default complaintsApi;

