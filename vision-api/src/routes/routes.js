import { Router } from 'express';
import { getDb, id, scopeByUser } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let rows = scopeByUser(req.user, getDb().routes);
    if (req.query.accountId) {
      rows = rows.filter((r) => r.accountId === req.query.accountId);
    }
    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const route = {
      id: id('rt'),
      recordType: 'Collection',
      status: 'Planned',
      ...req.body,
    };
    getDb().routes.unshift(route);
    res.status(201).json({ data: route });
  })
);

export default router;
