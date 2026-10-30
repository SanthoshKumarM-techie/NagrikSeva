import ApiError from '../utils/ApiError.js';

export function authenticate(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return next(ApiError.unauthorized('Authentication required. Please sign in.'));
}

export default authenticate;

