import { Router } from 'express';
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  duplicateAgent,
  testRepository,
  syncRepository,
  testServer,
  getAgentExecutions
} from '../controllers/agentController.js';
import { executeAgent } from '../controllers/executionController.js';
import {
  getGitHubMCPStatus,
  connectGitHubMCP,
  testGitHubMCPConnection,
  disconnectGitHubMCP,
  reconnectGitHubMCP
} from '../controllers/mcpController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getAgents);
router.post('/', createAgent);
router.get('/:id', getAgentById);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);
router.post('/:id/duplicate', duplicateAgent);

// Repo operations
router.post('/:id/repository/test', testRepository);
router.post('/repository/test', testRepository);
router.post('/:id/repository/sync', syncRepository);

// Server operations
router.post('/:id/servers/test', testServer);
router.post('/servers/test', testServer);

// GitHub MCP Server operations
router.get('/:id/mcp/github', getGitHubMCPStatus);
router.post('/:id/mcp/github/connect', connectGitHubMCP);
router.post('/:id/mcp/github/test', testGitHubMCPConnection);
router.post('/mcp/github/test', testGitHubMCPConnection);
router.post('/:id/mcp/github/disconnect', disconnectGitHubMCP);
router.post('/:id/mcp/github/reconnect', reconnectGitHubMCP);

// Executions for this agent
router.post('/:id/execute', executeAgent);
router.get('/:id/executions', getAgentExecutions);

export default router;

