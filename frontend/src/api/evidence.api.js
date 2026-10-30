import axiosInstance from './axiosInstance';

export const evidenceApi = {
  uploadFile: async (file, { stage = 'CITIZEN_INITIAL', complaintId = null, caption = '' } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (stage) formData.append('stage', stage);
    if (complaintId) formData.append('complaintId', complaintId);
    if (caption) formData.append('caption', caption);

    const response = await axiosInstance.post('/evidence/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.evidence || response.data;
  },

  getEvidenceByComplaint: async (complaintId) => {
    const response = await axiosInstance.get(`/evidence/complaint/${complaintId}`);
    return response.data?.evidence || [];
  },
};

export default evidenceApi;

