import axiosInstance from './axiosInstance';

export const assignmentsApi = {
  getMyTasks: async (params = {}) => {
    const response = await axiosInstance.get('/assignments/my-tasks', { params });
    const payload = response.data?.data || response.data;
    return payload?.tasks || payload || [];
  },

  getAssignmentById: async (id) => {
    const response = await axiosInstance.get(`/assignments/${id}`);
    const payload = response.data?.data || response.data;
    return payload?.assignment || payload || null;
  },

  createAssignment: async (data) => {
    // data: { complaintId, workerId, assignmentNotes }
    const response = await axiosInstance.post('/assignments', data);
    const payload = response.data?.data || response.data;
    return payload?.assignment || payload;
  },

  acceptAssignment: async (id) => {
    const response = await axiosInstance.patch(`/assignments/${id}/accept`);
    const payload = response.data?.data || response.data;
    return payload?.assignment || payload;
  },

  logInspection: async (id, data = {}) => {
    const payload = {
      description: data.description || data.notes || 'Inspection completed on site.',
      notes: data.notes || data.description || 'Inspection completed on site.',
      ...data
    };
    const response = await axiosInstance.post(`/assignments/${id}/inspection`, payload);
    const resPayload = response.data?.data || response.data;
    return resPayload?.update || resPayload;
  },

  startRemediation: async (id) => {
    const response = await axiosInstance.patch(`/assignments/${id}/start`);
    const payload = response.data?.data || response.data;
    return payload?.assignment || payload;
  },

  addProgressUpdate: async (id, data = {}) => {
    const payload = {
      description: data.description || data.notes || 'Progress update logged.',
      notes: data.notes || data.description || 'Progress update logged.',
      ...data
    };
    const response = await axiosInstance.post(`/assignments/${id}/progress`, payload);
    const resPayload = response.data?.data || response.data;
    return resPayload?.update || resPayload;
  },

  completeWork: async (id, data = {}) => {
    const evidenceUrls = (data.evidenceUrls && data.evidenceUrls.length > 0)
      ? data.evidenceUrls
      : (data.afterEvidenceUrls && data.afterEvidenceUrls.length > 0 ? data.afterEvidenceUrls : []);

    const payload = {
      ...data,
      description: data.description || data.completionNotes || data.notes || 'Work completed and submitted for verification.',
      completionNotes: data.completionNotes || data.description || 'Work completed and submitted for verification.',
      evidenceUrls,
      afterEvidenceUrls: evidenceUrls
    };
    const response = await axiosInstance.post(`/assignments/${id}/complete`, payload);
    const resPayload = response.data?.data || response.data;
    return resPayload?.assignment || resPayload;
  },
};

export default assignmentsApi;

