import jwt from 'jsonwebtoken';
import { getDb, publicUser } from '../store.js';

const accessSecret = () => process.env.JWT_ACCESS_SECRET || 'vision-access-dev-secret-change-me';
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || 'vision-refresh-dev-secret-change-me';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      persona: user.persona,
      role: user.role,
      accountIds: user.accountIds || [],
      segmentIds: user.segmentIds || [],
    },
    accessSecret(),
    { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, typ: 'refresh' }, refreshSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_TTL || '7d',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret());
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret());
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  try {
    const payload = verifyAccessToken(token);
    const user = getDb().users.find((u) => u.id === payload.sub);
    if (!user || !user.active) {
      return res.status(401).json({ message: 'Session is no longer valid.' });
    }
    req.user = publicUser(user);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Access token expired or invalid.' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = getDb().users.find((u) => u.id === payload.sub);
    if (user?.active) {
      req.user = publicUser(user);
      req.auth = payload;
    }
  } catch {
    /* ignore */
  }
  return next();
}
