import axiosInstance from './axiosInstance';

export const slaApi = {
  getRules: async (params = {}) => {
    const response = await axiosInstance.get('/sla/rules', { params });
    return response.data?.rules || [];
  },

  getRuleById: async (id) => {
    const response = await axiosInstance.get(`/sla/rules/${id}`);
    return response.data?.rule;
  },

  createRule: async (data) => {
    const response = await axiosInstance.post('/sla/rules', data);
    return response.data?.rule;
  },

  updateRule: async (id, data) => {
    const response = await axiosInstance.put(`/sla/rules/${id}`, data);
    return response.data?.rule;
  },
};

export default slaApi;

