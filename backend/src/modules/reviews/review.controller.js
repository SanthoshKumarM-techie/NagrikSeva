import reviewService from './review.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const officerVerify = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const review = await reviewService.officerVerify(req.params.complaintId, req.user, req.body, clientInfo);
  return ApiResponse.success(res, 200, { review }, 'Officer verification processed successfully');
});

export const citizenReview = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const review = await reviewService.citizenReview(req.params.complaintId, req.user.id, req.body, clientInfo);
  return ApiResponse.success(res, 200, { review }, 'Citizen review processed successfully');
});

export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getComplaintReviews(req.params.complaintId);
  return ApiResponse.success(res, 200, { reviews }, 'Complaint reviews retrieved');
});

export default {
  officerVerify,
  citizenReview,
  getReviews
};

