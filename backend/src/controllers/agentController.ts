import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { agentService } from '../services/agentService.js';
import { gitService } from '../git/GitService.js';
import { serverService } from '../server/ServerService.js';
import { prisma } from '../database/db.js';

export async function getAgents(req: AuthenticatedRequest, res: Response) {
  try {
    const agents = await agentService.getAllAgents();
    res.json({ agents });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAgentById(req: AuthenticatedRequest, res: Response) {
  try {
    const agent = await agentService.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json({ agent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAgent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId || (await prisma.user.findFirst())?.id;
    if (!userId) {
      return res.status(400).json({ error: 'User context missing' });
    }
    const agent = await agentService.createAgent(userId, req.body);
    res.status(201).json({ agent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateAgent(req: AuthenticatedRequest, res: Response) {
  try {
    const agent = await agentService.updateAgent(req.params.id, req.body, req.user?.userId);
    res.json({ agent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteAgent(req: AuthenticatedRequest, res: Response) {
  try {
    await agentService.deleteAgent(req.params.id, req.user?.userId);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function duplicateAgent(req: AuthenticatedRequest, res: Response) {
  try {
    const agent = await agentService.duplicateAgent(req.params.id, req.user?.userId);
    res.status(201).json({ agent });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function testRepository(req: AuthenticatedRequest, res: Response) {
  try {
    const { repositoryUrl, authMethod, gitToken } = req.body;
    let token = gitToken;

    if (!token && req.params.id) {
      const existingRepo = await prisma.agentRepository.findUnique({ where: { agentId: req.params.id } });
      token = existingRepo?.gitToken || undefined;
    }

    const result = await gitService.testConnection(repositoryUrl, authMethod || 'token', token);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function syncRepository(req: AuthenticatedRequest, res: Response) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.id },
      include: { repository: true }
    });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const result = await gitService.sync(
      agent.name,
      agent.repository?.branch || 'main',
      agent.repository?.repositoryUrl
    );

    await prisma.agentRepository.update({
      where: { agentId: agent.id },
      data: {
        lastSyncAt: new Date(),
        lastCommitHash: result.commit,
        status: 'connected'
      }
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function testServer(req: AuthenticatedRequest, res: Response) {
  try {
    const serverConfig = req.body;
    const result = await serverService.testConnection(serverConfig);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAgentExecutions(req: AuthenticatedRequest, res: Response) {
  try {
    const executions = await prisma.agentExecution.findMany({
      where: { agentId: req.params.id },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        fileChanges: true,
        logs: { orderBy: { timestamp: 'asc' } }
      },
      orderBy: { startedAt: 'desc' },
      take: 20
    });
    res.json({ executions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

