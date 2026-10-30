import axiosInstance from './axiosInstance';

export const reviewsApi = {
  getReviews: async (complaintId) => {
    const response = await axiosInstance.get(`/reviews/complaint/${complaintId}`);
    return response.data?.reviews || [];
  },

  officerVerify: async (complaintId, data) => {
    // data: { decision: 'APPROVED' | 'REWORK_REQUIRED', reviewNotes, reworkInstructions }
    const response = await axiosInstance.post(`/reviews/complaint/${complaintId}/officer-verify`, data);
    return response.data?.review;
  },

  citizenFeedback: async (complaintId, data) => {
    // data: { decision: 'CONFIRMED' | 'DISPUTED', rating, feedback }
    const response = await axiosInstance.post(`/reviews/complaint/${complaintId}/citizen-feedback`, data);
    return response.data?.review;
  },
};

export default reviewsApi;

