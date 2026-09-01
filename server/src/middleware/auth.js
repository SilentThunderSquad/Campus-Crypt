import { getUserFromRequest } from '../services/authService.js';

export async function requireAuth(req, res, next) {
  const user = req.user ?? (await getUserFromRequest(req));

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: 'Authentication required to access this resource.',
    });
  }

  req.user = user;
  return next();
}

export function requireVerifiedUser(req, res, next) {
  if (!req.user || req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      ok: false,
      message: 'Verified student access is required for this feature.',
    });
  }

  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      ok: false,
      message: 'Administrator access is required for this resource.',
    });
  }

  return next();
}
