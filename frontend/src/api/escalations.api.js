import axiosInstance from './axiosInstance';

export const escalationsApi = {
  listEscalations: async (params = {}) => {
    const response = await axiosInstance.get('/escalations', { params });
    return response.data?.escalations || [];
  },

  acknowledgeEscalation: async (id, notes = '') => {
    const response = await axiosInstance.patch(`/escalations/${id}/acknowledge`, { notes });
    return response.data?.escalation;
  },

  resolveEscalation: async (id, resolutionNotes = '') => {
    const response = await axiosInstance.patch(`/escalations/${id}/resolve`, { resolutionNotes });
    return response.data?.escalation;
  },

  manualEscalate: async (data) => {
    // data: { complaintId, level, description }
    const response = await axiosInstance.post('/escalations/manual', data);
    return response.data?.escalation;
  },
};

export default escalationsApi;

