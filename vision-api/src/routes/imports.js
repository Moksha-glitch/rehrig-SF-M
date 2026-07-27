import { Router } from 'express';
import { getDb, id } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const OBJECT_MAP = {
  'Work Orders': { mode: 'operational', kind: 'workOrders' },
  Locations: { mode: 'operational', kind: 'locations' },
  Assets: { mode: 'operational', kind: 'assets' },
  Contacts: { mode: 'contact' },
  Routes: { mode: 'route' },
};

const router = Router();
router.use(requireAuth);

router.post(
  '/:object',
  asyncHandler(async (req, res) => {
    const objectName = decodeURIComponent(req.params.object);
    const meta = OBJECT_MAP[objectName];
    if (!meta) return res.status(400).json({ message: `Unsupported import object: ${objectName}` });

    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const accountIdByName = Object.fromEntries(getDb().accounts.map((a) => [a.name, a.id]));
    let imported = 0;
    let failed = 0;
    const created = [];

    rows.forEach((row) => {
      const accountId = accountIdByName[row.account];
      if (!accountId) {
        failed += 1;
        return;
      }
      try {
        if (meta.mode === 'operational') {
          const record = { id: id(meta.kind), ...row, accountId };
          getDb().operationalRecords[meta.kind].unshift(record);
          created.push(record);
        } else if (meta.mode === 'contact') {
          const contact = {
            id: id('con'),
            accountId,
            firstName: row.firstName,
            lastName: row.lastName,
            name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
            email: row.email,
            phone: row.phone,
          };
          getDb().contacts.unshift(contact);
          created.push(contact);
        } else if (meta.mode === 'route') {
          const route = {
            id: id('rt'),
            accountId,
            routeNumber: row.routeNumber,
            truck: row.truck,
            driver: row.driver,
            status: row.status || 'Planned',
            recordType: 'Collection',
          };
          getDb().routes.unshift(route);
          created.push(route);
        }
        imported += 1;
      } catch {
        failed += 1;
      }
    });

    res.json({ imported, failed, data: created });
  })
);

export default router;
