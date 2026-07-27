import { Router } from 'express';
import { getDb, id } from '../store.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

const CONFIG_LISTS = ['serviceTypes', 'locationTypes', 'assetTypes', 'productTypes'];

router.get(
  '/:list',
  asyncHandler(async (req, res) => {
    if (!CONFIG_LISTS.includes(req.params.list)) {
      return res.status(404).json({ message: 'Unknown config list.' });
    }
    res.json({ data: getDb().config[req.params.list] });
  })
);

router.post(
  '/:list',
  asyncHandler(async (req, res) => {
    if (!CONFIG_LISTS.includes(req.params.list)) {
      return res.status(404).json({ message: 'Unknown config list.' });
    }
    if (req.user.persona !== 'rehrig') {
      return res.status(403).json({ message: 'Only Rehrig admins may edit platform config.' });
    }
    const item = { id: req.body.id || id(req.params.list), ...req.body };
    getDb().config[req.params.list].unshift(item);
    res.status(201).json({ data: item });
  })
);

router.delete(
  '/:list/:id',
  asyncHandler(async (req, res) => {
    if (!CONFIG_LISTS.includes(req.params.list)) {
      return res.status(404).json({ message: 'Unknown config list.' });
    }
    if (req.user.persona !== 'rehrig') {
      return res.status(403).json({ message: 'Only Rehrig admins may edit platform config.' });
    }
    const list = getDb().config[req.params.list];
    const index = list.findIndex((x) => x.id === req.params.id);
    if (index < 0) return res.status(404).json({ message: 'Config item not found.' });
    const [removed] = list.splice(index, 1);
    res.json({ data: removed });
  })
);

export default router;
