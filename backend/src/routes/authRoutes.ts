import { Router } from 'express';
import { login, register, demoLogin, firebaseAuth, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/demo', demoLogin);
router.post('/firebase', firebaseAuth);
router.get('/me', authenticate, getMe);

export default router;

