import { describe, it, expect } from 'vitest';
import ApiError from '../src/utils/ApiError.js';

describe('ApiError Utility', () => {
  it('should create badRequest error (400)', () => {
    const error = ApiError.badRequest('Invalid input', ['Field title is required']);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.errors).toEqual(['Field title is required']);
  });

  it('should create unauthorized error (401)', () => {
    const error = ApiError.unauthorized('Authentication required');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication required');
  });

  it('should create forbidden error (403)', () => {
    const error = ApiError.forbidden('Access denied');
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access denied');
  });

  it('should create notFound error (404)', () => {
    const error = ApiError.notFound('Complaint not found');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Complaint not found');
  });

  it('should create conflict error (409)', () => {
    const error = ApiError.conflict('Already exists');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Already exists');
  });

  it('should create internal server error (500)', () => {
    const error = ApiError.internal('Database crash');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Database crash');
  });
});

