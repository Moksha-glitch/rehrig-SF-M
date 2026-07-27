import { Router } from 'express';
import { getDb, RECORD_SCHEMAS, scopeByUser } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ data: [] });

    const results = [];
    const accounts =
      req.user.accountIds?.length
        ? getDb().accounts.filter((a) => req.user.accountIds.includes(a.id))
        : getDb().accounts;

    accounts.forEach((account) => {
      if (account.name.toLowerCase().includes(q) || account.uid?.includes(q)) {
        results.push({
          id: account.id,
          title: account.name,
          meta: 'Service Provider',
          module: req.user.persona === 'rehrig' ? 'accountDetail' : 'account',
          params: req.user.persona === 'rehrig' ? { accountId: account.id } : { tab: 'details' },
        });
      }
    });

    scopeByUser(req.user, getDb().contacts).forEach((contact) => {
      const hay = `${contact.name} ${contact.email || ''}`.toLowerCase();
      if (hay.includes(q)) {
        results.push({
          id: contact.id,
          title: contact.name,
          meta: 'Contact',
          module: 'contacts',
          params: {},
        });
      }
    });

    Object.keys(RECORD_SCHEMAS).forEach((kind) => {
      scopeByUser(req.user, getDb().operationalRecords[kind] || []).forEach((record) => {
        const title =
          record.number || record.name || record.subject || record.title || record.id;
        if (String(title).toLowerCase().includes(q)) {
          results.push({
            id: record.id,
            title: String(title),
            meta: RECORD_SCHEMAS[kind].singular,
            module: kind,
            params: {},
          });
        }
      });
    });

    res.json({ data: results.slice(0, 12) });
  })
);

export default router;
