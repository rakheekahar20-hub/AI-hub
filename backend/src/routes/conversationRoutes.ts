import { Router } from 'express';
import { getConversations, getConversationById, createConversation, addMessage, deleteConversation } from '../controllers/conversationController.js';
import { authenticate } from '../middleware/auth.js';

import { handleChat } from '../controllers/chatController.js';

const router = Router();
router.use(authenticate);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversationById);
router.delete('/:id', deleteConversation);
router.post('/:id/messages', addMessage);
router.post('/:id/chat', handleChat);

export default router;

