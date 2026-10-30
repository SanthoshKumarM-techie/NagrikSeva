export class ApiResponse {
  constructor(statusCode, data, message = 'Operation completed successfully') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data !== undefined ? data : null;
  }

  static success(res, statusCode = 200, data = {}, message = 'Operation completed successfully') {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static created(res, data = {}, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }
}

export default ApiResponse;

