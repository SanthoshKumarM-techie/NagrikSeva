import axiosInstance from './axiosInstance';

export const analyticsApi = {
  getDepartmentAnalytics: async () => {
    const response = await axiosInstance.get('/analytics/department');
    return response.data;
  },

  getCityAnalytics: async () => {
    const response = await axiosInstance.get('/analytics/city');
    return response.data;
  },
};

export default analyticsApi;

