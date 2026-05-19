const jwt = require('jsonwebtoken');

/**
 * Optional JWT auth — attaches req.user = { uid, role }.
 * Public routes can run without token.
 */
function authOptional(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    req.user = null;
    return next();
  }
  try {
    req.user = jwt.verify(token, secret);
  } catch {
    req.user = null;
  }
  next();
}

/** Requires valid JWT. */
function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
}

/** Issue a dev/admin token (use only in trusted environments). */
function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

module.exports = { authOptional, authRequired, signToken };
