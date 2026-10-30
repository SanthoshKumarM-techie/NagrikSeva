import evidenceService from './evidence.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const uploadSingleFile = asyncHandler(async (req, res) => {
  const result = await evidenceService.handleFileUpload(req.file);
  return ApiResponse.success(res, 200, result, 'File uploaded successfully');
});

export const getEvidenceByComplaint = asyncHandler(async (req, res) => {
  const evidence = await evidenceService.getComplaintEvidence(req.params.complaintId);
  return ApiResponse.success(res, 200, { evidence }, 'Evidence retrieved successfully');
});

export default {
  uploadSingleFile,
  getEvidenceByComplaint
};

