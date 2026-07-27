import { Router } from 'express';
import multer from 'multer';
import { getDb, id } from '../store.js';
import { canCreateAccountsForUser } from '../rbac.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const draftsRouter = Router();
draftsRouter.use(requireAuth);

draftsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const drafts = getDb().drafts.filter(
      (d) => !d.ownerId || d.ownerId === req.user.id || req.user.persona === 'rehrig'
    );
    res.json({ data: drafts });
  })
);

draftsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const draft = {
      id: req.body.id || id('draft'),
      ownerId: req.user.id,
      updatedAt: new Date().toISOString(),
      ...req.body,
    };
    const db = getDb();
    const index = db.drafts.findIndex((d) => d.id === draft.id);
    if (index >= 0) db.drafts[index] = draft;
    else db.drafts.push(draft);
    res.status(201).json({ data: draft });
  })
);

draftsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    getDb().drafts = getDb().drafts.filter((d) => d.id !== req.params.id);
    res.json({ ok: true });
  })
);

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

uploadsRouter.post(
  '/contract',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Upload a PDF or TXT contract file.' });
    }
    const name = req.file.originalname || 'contract';
    const text = req.file.buffer?.toString('utf8') || '';
    const extracted = {
      companyName:
        pick(text, /Company:\s*(.+)/i) ||
        name.replace(/\.(pdf|txt)$/i, '').replace(/[-_]/g, ' '),
      registrationNumber:
        pick(text, /Reg(?:istration)?(?:\s*Number)?:\s*(\w+)/i) ||
        `REG-${Date.now().toString().slice(-6)}`,
      contractValue: pick(text, /Value:\s*([\d,.]+)/i) || '250000',
      startDate: pick(text, /Start:\s*([\d-]+)/i) || new Date().toISOString().slice(0, 10),
      endDate: pick(text, /End:\s*([\d-]+)/i) || '2027-12-31',
      signatoryName: pick(text, /Signatory:\s*(.+)/i) || 'Contract Signatory',
      signatoryEmail: pick(text, /Email:\s*(\S+@\S+)/i) || 'contracts@example.com',
      serviceTypes: pick(text, /Services?:\s*(.+)/i) || 'Residential, Commercial',
      fileName: name,
    };
    res.json({ data: extracted });
  })
);

const router = Router();
router.use(requireAuth);
router.use('/drafts', draftsRouter);
router.use('/uploads', uploadsRouter);

router.post(
  '/accounts',
  asyncHandler(async (req, res) => {
    if (!canCreateAccountsForUser(req.user)) {
      return res.status(403).json({ message: 'You cannot create service provider accounts.' });
    }
    const form = req.body.form || req.body;
    const account = {
      id: id('acc'),
      name: form.companyName || form.name,
      uid: form.registrationNumber || form.uid || id('uid').slice(-6),
      type: form.type || 'Customer',
      industry: form.industry || 'Municipal',
      phone: form.phone || '',
      owner: req.user.alias || '',
      ownerName: req.user.name || '',
      website: form.website || '',
      description: form.description || 'Created from onboarding.',
      employees: Number(form.employees) || 0,
      serviceTypes: Array.isArray(form.serviceTypes)
        ? form.serviceTypes
        : String(form.serviceTypes || '')
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
      serviceModules: form.serviceModules || '',
      hardwareType: form.hardwareType || '',
      inactive: false,
      supportEmail: form.signatoryEmail || form.supportEmail || '',
      billing: form.billing || { country: '', street: '', city: '', state: '', zip: '' },
      shipping: form.shipping || form.billing || { country: '', street: '', city: '', state: '', zip: '' },
      paymentRequired: !!form.paymentRequired,
      apiIntegrated: !!form.apiIntegrated,
      onboardingComplete: true,
      residents: Number(form.residents) || 0,
      contract: form.contract || {
        value: form.contractValue,
        startDate: form.startDate,
        endDate: form.endDate,
        signatoryName: form.signatoryName,
      },
      addedDate: new Date().toISOString().slice(0, 10),
      createdBy: `${req.user.name}, ${new Date().toLocaleString()}`,
      lastModifiedBy: `${req.user.name}, ${new Date().toLocaleString()}`,
      ...(form.accountExtras || {}),
    };

    getDb().accounts.unshift(account);

    if (Array.isArray(form.contacts)) {
      form.contacts.forEach((c) => {
        getDb().contacts.unshift({
          id: id('con'),
          accountId: account.id,
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim(),
          ...c,
        });
      });
    }
    if (Array.isArray(form.routes)) {
      form.routes.forEach((r) => {
        getDb().routes.unshift({ id: id('rt'), accountId: account.id, ...r });
      });
    }
    if (req.body.fromDraftId || form.fromDraftId) {
      const draftId = req.body.fromDraftId || form.fromDraftId;
      getDb().drafts = getDb().drafts.filter((d) => d.id !== draftId);
    }

    res.status(201).json({ data: account });
  })
);

function pick(text, re) {
  const m = text.match(re);
  return m?.[1]?.trim() || '';
}

export default router;
