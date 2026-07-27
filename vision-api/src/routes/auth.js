import { Router } from 'express';
import { z } from 'zod';
import { getDb, publicUser } from '../store.js';
import { permissionsFor } from '../rbac.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
const DEMO_PASSWORD = () => process.env.DEMO_PASSWORD || 'vision';

router.get(
  '/demo-users',
  asyncHandler(async (_req, res) => {
    res.json({
      data: getDb().users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        persona: u.persona,
        role: u.role,
        scopeLabel: u.scopeLabel,
        active: u.active,
      })),
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .parse(req.body);

    const user = getDb().users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'No Vision account matches that email.' });
    }
    if (!user.active) {
      return res.status(403).json({ message: 'This account is inactive. Contact your administrator.' });
    }
    if (body.password !== DEMO_PASSWORD()) {
      return res.status(401).json({ message: 'Incorrect password. Try again or contact helpdesk.' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    getDb().refreshTokens.add(refreshToken);

    res.json({
      user: publicUser(user),
      permissions: permissionsFor(user),
      accessToken,
      refreshToken,
      expiresIn: process.env.ACCESS_TOKEN_TTL || '15m',
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const body = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
    const db = getDb();
    if (!db.refreshTokens.has(body.refreshToken)) {
      return res.status(401).json({ message: 'Refresh token is invalid.' });
    }
    try {
      const payload = verifyRefreshToken(body.refreshToken);
      const user = db.users.find((u) => u.id === payload.sub);
      if (!user?.active) {
        db.refreshTokens.delete(body.refreshToken);
        return res.status(401).json({ message: 'Session is no longer valid.' });
      }
      db.refreshTokens.delete(body.refreshToken);
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      db.refreshTokens.add(refreshToken);
      res.json({
        user: publicUser(user),
        permissions: permissionsFor(user),
        accessToken,
        refreshToken,
        expiresIn: process.env.ACCESS_TOKEN_TTL || '15m',
      });
    } catch {
      db.refreshTokens.delete(body.refreshToken);
      return res.status(401).json({ message: 'Refresh token expired or invalid.' });
    }
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken;
    if (token) getDb().refreshTokens.delete(token);
    res.json({ ok: true });
  })
);

export default router;
