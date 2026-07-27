import { Router } from 'express';
import { getDb } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json({ data: getDb().notificationConfig });
  })
);

router.patch(
  '/config/:id',
  asyncHandler(async (req, res) => {
    const rule = getDb().notificationConfig.find((r) => r.id === req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found.' });
    if (typeof req.body.enabled === 'boolean') rule.enabled = req.body.enabled;
    Object.assign(rule, req.body);
    res.json({ data: rule });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = req.user.accountIds?.length
      ? getDb().notifications.filter(
          (n) => !n.accountId || req.user.accountIds.includes(n.accountId)
        )
      : getDb().notifications;
    res.json({ data });
  })
);

router.post(
  '/read-all',
  asyncHandler(async (_req, res) => {
    getDb().notifications.forEach((n) => {
      n.read = true;
    });
    res.json({ ok: true });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const item = getDb().notifications.find((n) => n.id === req.params.id);
    if (!item) return res.status(404).json({ message: 'Notification not found.' });
    item.read = true;
    res.json({ data: item });
  })
);

export default router;
