import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../database/db.js';
import { AIProviderFactory } from '../ai/AIProviderFactory.js';

export async function getConversations(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const conversations = await prisma.conversation.findMany({
      where: userId ? { userId } : {},
      include: {
        agent: { select: { id: true, name: true, icon: true, status: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ conversations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getConversationById(req: AuthenticatedRequest, res: Response) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        agent: {
          include: {
            repository: true,
            servers: true,
            aiConfig: true,
            executionConfig: true,
            testingConfig: true,
            deploymentConfig: true
          }
        },
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createConversation(req: AuthenticatedRequest, res: Response) {
  try {
    const { agentId, title } = req.body;
    let userId = req.user?.userId;
    if (!userId) {
      const defaultUser = await prisma.user.findFirst();
      userId = defaultUser?.id;
    }

    if (!agentId || !userId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        agentId,
        userId,
        title: title || 'New Conversation'
      },
      include: {
        agent: true,
        messages: true
      }
    });

    res.status(201).json({ conversation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function addMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { content, sender = 'user', executionId } = req.body;
    const { id } = req.params;

    if (!content) return res.status(400).json({ error: 'Message content required' });

    const userMsg = await prisma.message.create({
      data: {
        conversationId: id,
        sender,
        content,
        executionId
      }
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message: userMsg });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteConversation(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await prisma.conversation.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

