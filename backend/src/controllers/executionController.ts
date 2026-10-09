import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { executionEngine } from '../execution/ExecutionEngine.js';
import { prisma } from '../database/db.js';
import { gitService } from '../git/GitService.js';
import { deploymentService } from '../deployment/DeploymentService.js';

export async function executeAgent(req: AuthenticatedRequest, res: Response) {
  try {
    const { prompt, isDemo } = req.body;
    const agentId = req.params.id;

    if (!prompt) {
      return res.status(400).json({ error: 'Execution prompt is required' });
    }

    const execution = await executionEngine.startExecution(agentId, prompt, isDemo);
    res.status(201).json({ execution });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getExecutionById(req: AuthenticatedRequest, res: Response) {
  try {
    const execution = await prisma.agentExecution.findUnique({
      where: { id: req.params.id },
      include: {
        agent: {
          select: { id: true, name: true, icon: true, environment: true, status: true, isDemo: true }
        },
        steps: { orderBy: { stepNumber: 'asc' } },
        fileChanges: true,
        logs: { orderBy: { timestamp: 'asc' } }
      }
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * SSE live stream endpoint
 */
export async function streamExecutionEvents(req: Request, res: Response) {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', executionId: id })}\n\n`);

  const unsubscribe = executionEngine.subscribe(id, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
}

export async function approveExecution(req: AuthenticatedRequest, res: Response) {
  try {
    const { fileIds, approveAll } = req.body;
    const result = await executionEngine.approveExecution(req.params.id, {
      approveAllFiles: approveAll,
      fileIds
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function rejectExecution(req: AuthenticatedRequest, res: Response) {
  try {
    const { fileIds, reason } = req.body;
    const result = await executionEngine.rejectExecution(req.params.id, {
      fileIds,
      reason
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function commitExecution(req: AuthenticatedRequest, res: Response) {
  try {
    const { commitMessage } = req.body;
    const execution = await prisma.agentExecution.findUnique({
      where: { id: req.params.id },
      include: { agent: { include: { repository: true } } }
    });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });

    const branch = execution.agent.repository?.branch || 'main';
    const msg = commitMessage || execution.commitMessage || `feat: updates applied by ${execution.agent.name}`;
    const result = await gitService.commit(branch, msg, execution.isDemo);

    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: { commitHash: result.commitHash, commitMessage: msg }
    });

    res.json({ success: true, commitHash: result.commitHash, branch: result.branch });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function pushExecution(req: AuthenticatedRequest, res: Response) {
  try {
    const execution = await prisma.agentExecution.findUnique({
      where: { id: req.params.id },
      include: { agent: { include: { repository: true } } }
    });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });

    const branch = execution.agent.repository?.branch || 'main';
    const result = await gitService.push(branch, execution.isDemo);

    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: { pushedBranch: branch }
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deployExecution(req: AuthenticatedRequest, res: Response) {
  try {
    const execution = await prisma.agentExecution.findUnique({
      where: { id: req.params.id },
      include: { agent: { include: { deploymentConfig: true } } }
    });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });

    const deployConfig = execution.agent.deploymentConfig;
    if (!deployConfig || !deployConfig.deploymentCommand) {
      return res.status(400).json({ error: 'Deployment command not configured for this agent' });
    }

    const result = await deploymentService.deploy({
      provider: deployConfig.provider,
      deploymentCommand: deployConfig.deploymentCommand,
      preDeploymentCommand: deployConfig.preDeploymentCommand,
      postDeploymentCommand: deployConfig.postDeploymentCommand,
      healthCheckUrl: deployConfig.healthCheckUrl,
      rollbackCommand: deployConfig.rollbackCommand,
      isDemo: execution.isDemo
    });

    await prisma.agentExecution.update({
      where: { id: execution.id },
      data: {
        deploymentOutput: result.deploymentOutput,
        healthCheckStatus: result.healthCheckStatus
      }
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getExecutionLogs(req: AuthenticatedRequest, res: Response) {
  try {
    const logs = await prisma.agentExecutionLog.findMany({
      where: { executionId: req.params.id },
      orderBy: { timestamp: 'asc' }
    });
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

