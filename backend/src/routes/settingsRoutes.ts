import { Router } from 'express';
import { getAISettings, saveAISettings, testAIConnection } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/ai', getAISettings);
router.post('/ai', saveAISettings);
router.post('/test', testAIConnection);

export default router;

