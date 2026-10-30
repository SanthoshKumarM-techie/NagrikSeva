import bcrypt from 'bcrypt';
import userRepository from './user.repository.js';
import db from '../../config/database.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';

export const listUsers = async (filters) => {
  const page = parseInt(filters.page || 1, 10);
  const limit = parseInt(filters.limit || 20, 10);
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    userRepository.findAll({ ...filters, limit, offset }),
    userRepository.countAll(filters)
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

export const createUser = async (userData, adminId, clientInfo = {}) => {
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  const existing = await userRepository.findByEmail(cleanEmail);
  if (existing) {
    throw ApiError.conflict(`User with email '${cleanEmail}' already exists. Please use a unique email address.`);
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password || 'officer123', saltRounds);

  return await db.withTransaction(async (client) => {
    const user = await userRepository.create({
      userCode: userData.userCode || userData.id,
      email: cleanEmail,
      passwordHash,
      fullName: userData.fullName || userData.name,
      phoneNumber: userData.phoneNumber || userData.phone,
      role: userData.role,
      departmentId: userData.departmentId || null,
      avatarUrl: userData.avatarUrl || null
    }, client);

    if (userData.role === 'FIELD_WORKER') {
      await userRepository.createWorkerProfile({
        userId: user.id,
        departmentId: userData.departmentId,
        wardId: userData.wardId || null,
        specialization: userData.specialization || 'General Maintenance'
      }, client);
    }

    auditService.logEvent({
      userId: adminId,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return user;
  });
};

export const updateProfile = async (userId, data) => {
  const updated = await userRepository.updateProfile(userId, data);
  if (!updated) {
    throw ApiError.notFound('User not found');
  }
  return updated;
};

export const updateUserStatus = async (id, isActive, adminId, clientInfo = {}) => {
  const updated = await userRepository.updateStatus(id, isActive);
  if (!updated) {
    throw ApiError.notFound('User not found');
  }

  auditService.logEvent({
    userId: adminId,
    action: isActive ? 'ENABLE_USER' : 'DISABLE_USER',
    entityType: 'USER',
    entityId: id,
    details: { isActive },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return updated;
};

export const getDepartmentWorkers = async (departmentId, filters) => {
  return await userRepository.findWorkersByDepartment(departmentId, filters);
};

export default {
  listUsers,
  getUserById,
  createUser,
  updateProfile,
  updateUserStatus,
  getDepartmentWorkers
};

