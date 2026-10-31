import bcrypt from 'bcrypt';
import crypto from 'crypto';
import authRepository from './auth.repository.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';
import mailService from '../../services/mail.service.js';

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export const login = async ({ email, password, expectedRole, session, ipAddress, userAgent }) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or User ID');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Your account is currently inactive. Please contact system administrator.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid password');
  }

  // Role categorization and access control
  if (expectedRole) {
    const roleUpper = (user.role || '').toUpperCase();
    const expUpper = (expectedRole || '').toUpperCase();

    const portalRoleMap = {
      'CITIZEN': ['CITIZEN'],
      'WORKER': ['FIELD_WORKER'],
      'FIELD_WORKER': ['FIELD_WORKER'],
      'OFFICER': ['DEPARTMENT_OFFICER'],
      'DEPARTMENT_OFFICER': ['DEPARTMENT_OFFICER'],
      'ADMIN': ['SUPER_ADMIN'],
      'SUPER_ADMIN': ['SUPER_ADMIN']
    };

    const allowed = portalRoleMap[expUpper] || [expUpper];
    if (!allowed.includes(roleUpper)) {
      const roleTitles = {
        'CITIZEN': 'Citizen',
        'FIELD_WORKER': 'Contractor & Crew Operations',
        'DEPARTMENT_OFFICER': 'Department Officer',
        'SUPER_ADMIN': 'Super Admin'
      };
      const portalTitles = {
        'CITIZEN': 'Citizen Portal',
        'WORKER': 'Contractor & Crew Operations Gate',
        'FIELD_WORKER': 'Contractor & Crew Operations Gate',
        'OFFICER': 'Department Officer Desk',
        'DEPARTMENT_OFFICER': 'Department Officer Desk',
        'ADMIN': 'Supervisor Administration Desk',
        'SUPER_ADMIN': 'Supervisor Administration Desk'
      };

      const userRoleTitle = roleTitles[roleUpper] || user.role;
      const expectedPortalTitle = portalTitles[expUpper] || `${expectedRole} Gate`;

      throw ApiError.forbidden(
        `Access Denied: This account is registered as '${userRoleTitle}' and cannot sign in through the ${expectedPortalTitle}. Please use the corresponding municipal gate.`
      );
    }
  }

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

export const requestPasswordResetOtp = async ({ identifier, ipAddress, userAgent }) => {
  if (!identifier) {
    throw ApiError.badRequest('Please enter your email or Official User ID.');
  }

  const cleanId = identifier.trim();
  const user = await authRepository.findByEmail(cleanId);
  if (!user) {
    throw ApiError.notFound('No account found matching this email or User ID.');
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Your account is currently inactive. Please contact the administrator.');
  }

  // Generate a cryptographically secure 6-digit numeric OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  // Valid for 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Store OTP in database
  await authRepository.createOtp({
    userId: user.id,
    email: user.email,
    otpCode,
    expiresAt
  });

  // Asynchronously dispatch OTP mail
  await mailService.sendPasswordResetOtpEmail({
    toEmail: user.email,
    fullName: user.full_name,
    otpCode,
    role: user.role,
    userCode: user.user_code
  });

  // Log audit event
  auditService.logEvent({
    userId: user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'AUTH',
    entityId: user.id,
    details: { email: user.email, role: user.role, userCode: user.user_code },
    ipAddress,
    userAgent
  }).catch(err => console.error('Audit log failed:', err));

  return {
    success: true,
    maskedEmail: maskEmail(user.email),
    userCode: user.user_code,
    role: user.role,
    otpCode: otpCode,
    email: user.email,
    fullName: user.full_name,
    message: `A 6-digit verification code has been dispatched to ${maskEmail(user.email)}. It will expire in 10 minutes.`
  };
};

export const resetPasswordWithOtp = async ({ identifier, otp, newPassword, ipAddress, userAgent }) => {
  if (!identifier) {
    throw ApiError.badRequest('Email or User ID is required.');
  }
  if (!otp || otp.trim().length !== 6) {
    throw ApiError.badRequest('Please enter a valid 6-digit verification OTP code.');
  }
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('New password must be at least 6 characters long.');
  }

  const cleanId = identifier.trim();
  const user = await authRepository.findByEmail(cleanId);
  if (!user) {
    throw ApiError.notFound('User account not found.');
  }

  const validOtp = await authRepository.findValidOtp({
    email: user.email,
    otpCode: otp.trim()
  });

  if (!validOtp) {
    throw ApiError.badRequest('Invalid or expired verification code. Please request a new OTP.');
  }

  // Hash new password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password in database
  await authRepository.updatePassword({
    userId: user.id,
    passwordHash
  });

  // Mark OTP as used
  await authRepository.markOtpUsed(validOtp.id);

  // Log audit event
  auditService.logEvent({
    userId: user.id,
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'AUTH',
    entityId: user.id,
    details: { email: user.email, role: user.role, userCode: user.user_code },
    ipAddress,
    userAgent
  }).catch(err => console.error('Audit log failed:', err));

  return {
    success: true,
    message: 'Your password has been successfully reset! You can now sign in with your new credentials.'
  };
};

export default {
  login,
  register,
  logout,
  getMe,
  requestPasswordResetOtp,
  resetPasswordWithOtp
};

