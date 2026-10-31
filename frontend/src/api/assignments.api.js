import axiosInstance from './axiosInstance';

export const assignmentsApi = {
  getMyTasks: async (params = {}) => {
    const response = await axiosInstance.get('/assignments/my-tasks', { params });
    return response.data?.tasks || [];
  },

  getAssignmentById: async (id) => {
    const response = await axiosInstance.get(`/assignments/${id}`);
    return response.data?.assignment || null;
  },

  createAssignment: async (data) => {
    const response = await axiosInstance.post('/assignments', data);
    return response.data?.assignment;
  },

  acceptAssignment: async (id) => {
    const response = await axiosInstance.patch(`/assignments/${id}/accept`);
    return response.data?.assignment;
  },

  logInspection: async (id, data = {}) => {
    const payload = {
      description: data.description || data.notes || 'Inspection completed on site.',
      notes: data.notes || data.description || 'Inspection completed on site.',
      ...data
    };
    const response = await axiosInstance.post(`/assignments/${id}/inspection`, payload);
    return response.data?.update;
  },

  startRemediation: async (id, data = {}) => {
    const payload = {
      startDate: data.startDate || new Date().toISOString(),
      description: data.description || data.notes || 'Remediation work begun on site.',
      notes: data.notes || data.description || 'Remediation work begun on site.',
      evidenceUrls: data.evidenceUrls || []
    };
    const response = await axiosInstance.patch(`/assignments/${id}/start`, payload);
    return response.data?.assignment || response.data;
  },

  reportWorkDelay: async (id, data = {}) => {
    const response = await axiosInstance.post(`/assignments/${id}/delay`, data);
    return response.data;
  },

  addProgressUpdate: async (id, data = {}) => {
    const payload = {
      description: data.description || data.notes || 'Progress update logged.',
      notes: data.notes || data.description || 'Progress update logged.',
      ...data
    };
    const response = await axiosInstance.post(`/assignments/${id}/progress`, payload);
    return response.data?.update;
  },

  completeWork: async (id, data = {}) => {
    const evidenceUrls = (data.evidenceUrls && data.evidenceUrls.length > 0)
      ? data.evidenceUrls
      : (data.afterEvidenceUrls && data.afterEvidenceUrls.length > 0 ? data.afterEvidenceUrls : []);

    const payload = {
      ...data,
      description: data.description || data.completionNotes || data.notes || 'Work completed and submitted for verification.',
      completionNotes: data.completionNotes || data.description || 'Work completed and submitted for verification.',
      materialsUsed: data.materialsUsed,
      technicalDetails: data.technicalDetails,
      evidenceUrls,
      afterEvidenceUrls: evidenceUrls
    };
    const response = await axiosInstance.post(`/assignments/${id}/complete`, payload);
    return response.data?.assignment || response.data;
  },
};

export default assignmentsApi;
