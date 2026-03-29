import jwt from 'jsonwebtoken';

let cachedSecret;

/**
 * JWT is optional for local dev: if JWT_SECRET is unset, a fixed dev default is used.
 * Production must set JWT_SECRET (tokens are still used for /api/auth/register and /api/sessions).
 */
export function getJwtSecret() {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is required in production');
    process.exit(1);
  }
  console.warn('[auth] JWT_SECRET unset — using insecure dev-only default. Set JWT_SECRET for production.');
  cachedSecret = '__voicecanvas_dev_jwt_secret__';
  return cachedSecret;
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });

  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, getJwtSecret());
  } catch { /* ignore invalid tokens */ }
  next();
}

export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}
