import axiosInstance from './axiosInstance';

export const transfersApi = {
  getIncomingTransfers: async (params = {}) => {
    const response = await axiosInstance.get('/transfers/incoming', { params });
    return response?.data?.transfers || response?.transfers || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
  },

  getOutgoingTransfers: async (params = {}) => {
    const response = await axiosInstance.get('/transfers/outgoing', { params });
    return response?.data?.transfers || response?.transfers || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
  },

  getRepeatedTransfers: async () => {
    const response = await axiosInstance.get('/transfers/repeated');
    return response?.data?.transfers || response?.transfers || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
  },

  getAllTransfers: async (params = {}) => {
    const response = await axiosInstance.get('/transfers/all', { params });
    return response?.data?.transfers || response?.transfers || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
  },

  getComplaintTransfers: async (complaintId) => {
    const response = await axiosInstance.get(`/transfers/complaint/${complaintId}`);
    return response?.data?.transfers || response?.transfers || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
  },

  initiateTransfer: async (data) => {
    // data: { complaintId, toDepartmentId, reason }
    const response = await axiosInstance.post('/transfers', data);
    return response?.data?.transfer || response?.transfer || response?.data || response;
  },

  reviewTransfer: async (id, data) => {
    // data: { status: 'ACCEPTED'|'REJECTED', reviewNotes }
    const response = await axiosInstance.patch(`/transfers/${id}/review`, data);
    return response?.data?.transfer || response?.transfer || response?.data || response;
  },
};

export default transfersApi;

