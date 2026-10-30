import wardRepository from './ward.repository.js';
import ApiError from '../../utils/ApiError.js';

export const listWards = async (filters) => {
  return await wardRepository.findAll(filters);
};

export const getWardById = async (id) => {
  const ward = await wardRepository.findById(id);
  if (!ward) {
    throw ApiError.notFound('Ward not found');
  }
  return ward;
};

export default {
  listWards,
  getWardById
};

