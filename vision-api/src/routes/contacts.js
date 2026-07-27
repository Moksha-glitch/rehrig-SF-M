import { Router } from 'express';
import { getDb, id, scopeByUser } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let rows = scopeByUser(req.user, getDb().contacts);
    if (req.query.accountId) {
      rows = rows.filter((c) => c.accountId === req.query.accountId);
    }
    res.json({ data: rows });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const contact = {
      id: id('con'),
      name: `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim(),
      isUserCreated: false,
      isUserActive: false,
      ...req.body,
    };
    getDb().contacts.unshift(contact);
    res.status(201).json({ data: contact });
  })
);

export default router;
