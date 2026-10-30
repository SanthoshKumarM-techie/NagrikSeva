import { describe, it, expect, vi } from 'vitest';
import authenticate from '../src/middlewares/authenticate.js';
import authorizeRole from '../src/middlewares/authorizeRole.js';
import authorizeDepartment from '../src/middlewares/authorizeDepartment.js';
import ApiError from '../src/utils/ApiError.js';

describe('Auth & Authorization Middlewares', () => {
  describe('authenticate Middleware', () => {
    it('should call next with 401 ApiError if no session or user in session', () => {
      const req = { session: {} };
      const res = {};
      const next = vi.fn();

      authenticate(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(401);
    });

    it('should set req.user and call next() when valid session exists', () => {
      const user = { id: 'user-123', email: 'citizen@example.com', role: 'CITIZEN' };
      const req = { session: { user } };
      const res = {};
      const next = vi.fn();

      authenticate(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual(user);
    });
  });

  describe('authorizeRole Middleware', () => {
    it('should allow access when user role matches', () => {
      const middleware = authorizeRole('SUPER_ADMIN', 'DEPARTMENT_OFFICER');
      const req = { user: { role: 'DEPARTMENT_OFFICER' } };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject access with 403 ApiError when user role does not match', () => {
      const middleware = authorizeRole('SUPER_ADMIN');
      const req = { user: { role: 'CITIZEN' } };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
    });
  });

  describe('authorizeDepartment Middleware', () => {
    it('should allow SUPER_ADMIN to access any department', () => {
      const middleware = authorizeDepartment();
      const req = { user: { role: 'SUPER_ADMIN' }, params: { departmentId: 'dept-999' } };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow officer to access their own department', () => {
      const middleware = authorizeDepartment();
      const req = {
        user: { role: 'DEPARTMENT_OFFICER', departmentId: 'dept-123' },
        params: { departmentId: 'dept-123' }
      };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject officer trying to access another department', () => {
      const middleware = authorizeDepartment();
      const req = {
        user: { role: 'DEPARTMENT_OFFICER', departmentId: 'dept-123' },
        params: { departmentId: 'dept-999' }
      };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(403);
    });
  });
});
