import authService from './auth.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const identifier = req.body.email || req.body.userId || req.body.userCode || req.body.identifier;
  const password = req.body.password;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  const user = await authService.login({
    email: identifier,
    password,
    session: req.session,
    ipAddress,
    userAgent
  });

  return ApiResponse.success(res, 200, { user }, 'Login successful');
});

export const register = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  const user = await authService.register({
    ...req.body,
    session: req.session,
    ipAddress,
    userAgent
  });

  return ApiResponse.created(res, { user }, 'Account registered successfully');
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.session?.user?.id;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  await authService.logout(req.session, userId, ipAddress, userAgent);
  res.clearCookie('nagrikseva.sid');
  res.clearCookie('nagrikseva_session');

  return ApiResponse.success(res, 200, null, 'Logged out successfully');
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return ApiResponse.success(res, 200, { user }, 'Profile retrieved successfully');
});

export const checkSession = asyncHandler(async (req, res) => {
  if (req.session && req.session.user) {
    return ApiResponse.success(res, 200, { authenticated: true, user: req.session.user }, 'Session is active');
  }
  return ApiResponse.success(res, 200, { authenticated: false, user: null }, 'No active session');
});

export const requestPasswordResetOtp = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.userId || req.body.userCode;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  const result = await authService.requestPasswordResetOtp({
    identifier,
    ipAddress,
    userAgent
  });

  return ApiResponse.success(res, 200, result, result.message);
});

export const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const identifier = req.body.identifier || req.body.email || req.body.userId || req.body.userCode;
  const { otp, newPassword } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  const result = await authService.resetPasswordWithOtp({
    identifier,
    otp,
    newPassword,
    ipAddress,
    userAgent
  });

  return ApiResponse.success(res, 200, result, result.message);
});

export default {
  login,
  register,
  logout,
  getMe,
  checkSession,
  requestPasswordResetOtp,
  resetPasswordWithOtp
};

