import evidenceRepository from './evidence.repository.js';
import { uploadFile } from '../../config/storage.js';
import ApiError from '../../utils/ApiError.js';

export const handleFileUpload = async (file) => {
  if (!file) {
    throw ApiError.badRequest('No file provided');
  }

  const uploadResult = await uploadFile(file);
  return {
    fileUrl: uploadResult.url,
    path: uploadResult.path,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
};

export const getComplaintEvidence = async (complaintId) => {
  return await evidenceRepository.findByComplaintId(complaintId);
};

export const addEvidenceRecord = async (data, client) => {
  return await evidenceRepository.create(data, client);
};

export default {
  handleFileUpload,
  getComplaintEvidence,
  addEvidenceRecord
};

