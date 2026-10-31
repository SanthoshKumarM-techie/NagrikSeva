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
    try {
      const response = await axiosInstance.get('/complaints/stats/citizen');
      const stats = response.data?.stats || {};
      return {
        totalComplaints: stats.totalComplaints ?? stats.total_filed ?? 0,
        pendingCount: stats.pendingCount ?? stats.active_count ?? 0,
        inProgressCount: stats.inProgressCount ?? stats.active_count ?? 0,
        resolvedCount: stats.resolvedCount ?? stats.resolved_count ?? 0,
        supportedCount: stats.supportedCount ?? stats.supported_count ?? 0
      };
    } catch {
      return null;
    }
  },

  getDepartmentStats: async () => {
    const response = await axiosInstance.get('/complaints/stats/department');
    return response.data?.stats || {};
  },
};

export default complaintsApi;

