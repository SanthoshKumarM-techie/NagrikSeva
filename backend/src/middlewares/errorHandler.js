import ApiError from '../utils/ApiError.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
    errors = [err.message];
  } else if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Conflict: Record already exists';
    errors = [err.detail || 'Unique constraint violation'];
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference identifier in request';
    errors = [err.detail || 'Foreign key constraint violation'];
  } else if (err.message) {
    message = err.message;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
}

export default errorHandler;

