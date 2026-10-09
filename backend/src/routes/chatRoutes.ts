import { Router } from 'express';
import { handleChat } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.post('/', handleChat);

export default router;

