import bcrypt from 'bcrypt';
import authRepository from './auth.repository.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';

export const login = async ({ email, password, session, ipAddress, userAgent }) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Your account is currently inactive. Please contact system administrator.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const userPayload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
    departmentId: user.department_id,
    departmentName: user.department_name,
    departmentCode: user.department_code,
    workerProfileId: user.worker_profile_id,
    specialization: user.specialization,
    avatarUrl: user.avatar_url
  };

  // Set in session
  session.user = userPayload;

  // Log audit event asynchronously
  auditService.logEvent({
    userId: user.id,
    action: 'USER_LOGIN',
    entityType: 'AUTH',
    entityId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress,
    userAgent
  }).catch(err => console.error('Audit log failed:', err));

  return userPayload;
};

export const logout = async (session, userId, ipAddress, userAgent) => {
  if (userId) {
    auditService.logEvent({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'AUTH',
      entityId: userId,
      details: {},
      ipAddress,
      userAgent
    }).catch(err => console.error('Audit log failed:', err));
  }

  return new Promise((resolve, reject) => {
    session.destroy((err) => {
      if (err) {
        return reject(ApiError.internal('Failed to destroy session'));
      }
      resolve();
    });
  });
};

export const getMe = async (userId) => {
  const user = await authRepository.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
    departmentId: user.department_id,
    departmentName: user.department_name,
    departmentCode: user.department_code,
    workerProfileId: user.worker_profile_id,
    specialization: user.specialization,
    avatarUrl: user.avatar_url,
    isActive: user.is_active,
    createdAt: user.created_at
  };
};

export const register = async ({ email, password, fullName, phoneNumber, role, departmentId, specialization, address, session, ipAddress, userAgent }) => {
  // Citizens and Field Workers can self-register
  if (role && !['CITIZEN', 'FIELD_WORKER'].includes(role)) {
    throw ApiError.forbidden('Only Citizens and Field Workers can register online. Department accounts must be created by a Supervisor Admin.');
  }

  const existing = await authRepository.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const prefix = role === 'FIELD_WORKER' ? 'WRK' : 'CIT';
  const userCode = `${prefix}${Date.now().toString().slice(-4)}`;

  const user = await authRepository.create({
    userCode,
    email,
    passwordHash,
    fullName,
    phoneNumber,
    role: role || 'CITIZEN',
    departmentId: departmentId || null,
    address: address || null,
    specialization: specialization || null
  });

  const userPayload = {
    id: user.id,
    userCode: user.user_code,
    email: user.email,
    fullName: user.full_name,
    phoneNumber: user.phone_number,
    role: user.role,
    departmentId: user.department_id,
    departmentName: user.department_name,
    departmentCode: user.department_code,
    workerProfileId: user.worker_profile_id,
    specialization: user.specialization,
    avatarUrl: user.avatar_url
  };

  // Set in session automatically on registration
  session.user = userPayload;

  auditService.logEvent({
    userId: user.id,
    action: 'USER_REGISTER',
    entityType: 'AUTH',
    entityId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress,
    userAgent
  }).catch(err => console.error('Audit log failed:', err));

  return userPayload;
};

export default {
  login,
  register,
  logout,
  getMe
};

