import { Router } from 'express';
import { getDb, id, RECORD_SCHEMAS, scopeByUser } from '../store.js';
import { canCreateRecordsForUser } from '../rbac.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

const KINDS = Object.keys(RECORD_SCHEMAS);

function ensureKind(kind) {
  if (!KINDS.includes(kind)) {
    const err = new Error(`Unknown record kind: ${kind}`);
    err.status = 404;
    throw err;
  }
}

router.get(
  '/:kind',
  asyncHandler(async (req, res) => {
    ensureKind(req.params.kind);
    let rows = scopeByUser(req.user, getDb().operationalRecords[req.params.kind] || []);
    if (req.query.accountId) {
      rows = rows.filter((r) => r.accountId === req.query.accountId);
    }
    if (req.user.persona === 'customer' && req.user.customerId) {
      rows = rows.filter(
        (r) => !r.customerId || r.customerId === req.user.customerId
      );
    }
    res.json({ data: rows, schema: RECORD_SCHEMAS[req.params.kind] });
  })
);

router.post(
  '/:kind',
  asyncHandler(async (req, res) => {
    ensureKind(req.params.kind);
    const customerWo =
      req.user.persona === 'customer' && req.params.kind === 'workOrders';
    if (!customerWo && !canCreateRecordsForUser(req.user)) {
      return res.status(403).json({ message: 'You cannot create these records.' });
    }
    const record = {
      id: id(req.params.kind),
      ...req.body,
    };
    if (!record.accountId && record.account) {
      const account = getDb().accounts.find((a) => a.name === record.account);
      if (account) record.accountId = account.id;
    }
    if (req.user.persona === 'customer') {
      record.customerId = req.user.customerId;
      record.accountId = req.user.accountIds?.[0];
    }
    getDb().operationalRecords[req.params.kind].unshift(record);
    res.status(201).json({ data: record });
  })
);

router.patch(
  '/:kind/:id',
  asyncHandler(async (req, res) => {
    ensureKind(req.params.kind);
    const list = getDb().operationalRecords[req.params.kind];
    const index = list.findIndex((r) => r.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: 'Record not found.' });
    list[index] = { ...list[index], ...req.body, id: list[index].id };
    res.json({ data: list[index] });
  })
);

router.delete(
  '/:kind/:id',
  asyncHandler(async (req, res) => {
    ensureKind(req.params.kind);
    const list = getDb().operationalRecords[req.params.kind];
    const index = list.findIndex((r) => r.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: 'Record not found.' });
    const [removed] = list.splice(index, 1);
    res.json({ data: removed });
  })
);

export default router;
