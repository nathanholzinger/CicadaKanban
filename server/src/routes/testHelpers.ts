import { Router } from 'express';
import { resetTestDb } from '../db/resetTestDb.js';

const router = Router();

// Truncate all user data and re-seed via the standard migration seed logic.
// Only mounted when ENABLE_TEST_ROUTES=true — never exposed in production.
router.post('/reset', (_req, res) => {
  resetTestDb();
  res.json({ ok: true });
});

export default router;
