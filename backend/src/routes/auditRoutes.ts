import { Router } from 'express';
import { auditService } from '../services/auditService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const logs = await auditService.getLogs(req.query.agentId as string);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

