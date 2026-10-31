import { Router } from 'express';
import authController from './auth.controller.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { loginSchema, registerSchema } from './auth.validation.js';
import authenticate from '../../middlewares/authenticate.js';

const router = Router();

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/logout', authController.logout);
router.get('/session', authController.checkSession);
router.get('/me', authenticate, authController.getMe);

// Self-service password reset via mail OTP (for Citizen, Worker & Department Officer)
router.post('/forgot-password/request-otp', authController.requestPasswordResetOtp);
router.post('/forgot-password/reset', authController.resetPasswordWithOtp);

export default router;

