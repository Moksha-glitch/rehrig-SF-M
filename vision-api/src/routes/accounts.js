import { Router } from 'express';
import { getDb, id } from '../store.js';
import { canCreateAccountsForUser } from '../rbac.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

function visibleAccounts(user) {
  if (user.accountIds?.length) {
    return getDb().accounts.filter((a) => user.accountIds.includes(a.id));
  }
  return getDb().accounts;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ data: visibleAccounts(req.user) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    if (!canCreateAccountsForUser(req.user)) {
      return res.status(403).json({ message: 'You cannot create service provider accounts.' });
    }
    const account = {
      id: req.body.id || id('acc'),
      inactive: false,
      addedDate: new Date().toISOString().slice(0, 10),
      createdBy: `${req.user.name}, ${new Date().toLocaleString()}`,
      lastModifiedBy: `${req.user.name}, ${new Date().toLocaleString()}`,
      billing: { country: '', street: '', city: '', state: '', zip: '' },
      shipping: { country: '', street: '', city: '', state: '', zip: '' },
      ...req.body,
    };
    delete account.fromDraftId;
    getDb().accounts.unshift(account);
    if (req.body.fromDraftId) {
      getDb().drafts = getDb().drafts.filter((d) => d.id !== req.body.fromDraftId);
    }
    res.status(201).json({ data: account });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const account = getDb().accounts.find((a) => a.id === req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found.' });
    if (req.user.accountIds?.length && !req.user.accountIds.includes(account.id)) {
      return res.status(403).json({ message: 'You do not have access to this account.' });
    }
    const db = getDb();
    res.json({
      data: account,
      contacts: db.contacts.filter((c) => c.accountId === account.id),
      segments: db.segments.filter((s) => s.accountId === account.id),
      routes: db.routes.filter((r) => r.accountId === account.id),
      products: db.productsByAccount[account.id] || [],
      customers: db.users.filter(
        (u) => u.persona === 'customer' && u.accountIds?.includes(account.id)
      ),
    });
  })
);

export default router;
