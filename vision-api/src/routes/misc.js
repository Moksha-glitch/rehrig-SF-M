import { Router } from 'express';
import { getDb, resetDb, scopeByUser } from '../store.js';
import { permissionsFor } from '../rbac.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user, permissions: permissionsFor(req.user) });
  })
);

router.get(
  '/users',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.persona !== 'rehrig') {
      return res.status(403).json({ message: 'Admin only.' });
    }
    res.json({ data: getDb().users });
  })
);

router.get(
  '/segments',
  requireAuth,
  asyncHandler(async (req, res) => {
    let rows = scopeByUser(req.user, getDb().segments);
    if (req.query.accountId) rows = rows.filter((s) => s.accountId === req.query.accountId);
    res.json({ data: rows });
  })
);

router.get(
  '/products',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDb();
    if (req.query.accountId) {
      return res.json({ data: db.productsByAccount[req.query.accountId] || [] });
    }
    const accounts = req.user.accountIds?.length
      ? db.accounts.filter((a) => req.user.accountIds.includes(a.id))
      : db.accounts;
    res.json({
      data: accounts.flatMap((a) => db.productsByAccount[a.id] || []),
    });
  })
);

router.get(
  '/api-integrations',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({ data: getDb().apiIntegrations });
  })
);

router.get(
  '/analytics/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const db = getDb();
    const accountNames = new Set(
      (req.user.accountIds?.length
        ? db.accounts.filter((a) => req.user.accountIds.includes(a.id))
        : db.accounts
      ).map((a) => a.name)
    );
    res.json({
      data: {
        hotTicketAging: db.analytics.hotTicketAging.filter((row) => accountNames.has(row.name)),
        missedPickups30d: db.analytics.missedPickups30d,
        liveDispatches: db.analytics.liveDispatches.filter((d) => accountNames.has(d.account)),
        priorityWorkOrders: db.analytics.priorityWorkOrders.filter((w) =>
          accountNames.has(w.account)
        ),
      },
    });
  })
);

router.post(
  '/dev/reset',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.persona !== 'rehrig') {
      return res.status(403).json({ message: 'Admin only.' });
    }
    resetDb();
    res.json({ ok: true });
  })
);

export default router;
