import { Router } from 'express';
import {
  getExecutionById,
  streamExecutionEvents,
  approveExecution,
  rejectExecution,
  commitExecution,
  pushExecution,
  deployExecution,
  getExecutionLogs
} from '../controllers/executionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Stream endpoint does not require strict bearer header if SSE is used from EventSource,
// but can authenticate via query or pass-through
router.get('/:id/stream', streamExecutionEvents);

router.use(authenticate);

router.get('/:id', getExecutionById);
router.post('/:id/approve', approveExecution);
router.post('/:id/reject', rejectExecution);
router.post('/:id/commit', commitExecution);
router.post('/:id/push', pushExecution);
router.post('/:id/deploy', deployExecution);
router.get('/:id/logs', getExecutionLogs);

export default router;

