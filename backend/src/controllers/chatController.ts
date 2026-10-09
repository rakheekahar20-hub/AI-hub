import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../database/db.js';
import { AIProviderFactory } from '../ai/AIProviderFactory.js';

export async function handleChat(req: AuthenticatedRequest, res: Response) {
  try {
    const { message, image, conversationId, agentId, stream = false, provider: reqProvider, model: reqModel } = req.body;
    const targetConversationId = conversationId || req.params.id;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const trimmedPrompt = message.trim();
    let conversation: any = null;
    let agent: any = null;

    if (targetConversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: targetConversationId },
        include: {
          agent: {
            include: {
              aiConfig: true,
              instruction: true,
              repository: true
            }
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20
          }
        }
      });
      if (conversation) {
        agent = conversation.agent;
      }
    }

    // If conversation not found but agentId provided, find agent
    if (!agent && agentId) {
      agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          aiConfig: true,
          instruction: true,
          repository: true
        }
      });
    }

    // If still no agent, pick first available agent
    if (!agent) {
      agent = await prisma.agent.findFirst({
        include: {
          aiConfig: true,
          instruction: true,
          repository: true
        }
      });
    }

    if (!agent) {
      return res.status(404).json({ error: 'No active AI agent found. Please create an agent first.' });
    }

    // Ensure conversation exists or create one
    let convId = targetConversationId;
    if (!convId || !conversation) {
      let userId = req.user?.userId;
      if (!userId) {
        const defaultUser = await prisma.user.findFirst();
        userId = defaultUser?.id;
      }
      if (!userId) {
        return res.status(401).json({ error: 'User context required to create conversation' });
      }

      const newConv = await prisma.conversation.create({
        data: {
          agentId: agent.id,
          userId,
          title: trimmedPrompt.slice(0, 40)
        }
      });
      convId = newConv.id;
    }

    // Prepare message content to store in database
    let messageToSave = trimmedPrompt;
    if (image?.dataUrl && !trimmedPrompt.includes('data:image/')) {
      const altText = image.name || 'Screenshot';
      messageToSave = `![${altText}](${image.dataUrl})\n\n${trimmedPrompt}`;
    }

    // Save user message to database
    const userMsg = await prisma.message.create({
      data: {
        conversationId: convId,
        sender: 'user',
        content: messageToSave
      }
    });

    // Prepare AI context & resolve provider/model
    const platformDefaultProvider = (process.env.DEFAULT_AI_PROVIDER || 'gemini') as 'openai' | 'gemini' | 'anthropic';
    const platformDefaultModel = platformDefaultProvider === 'openai'
      ? (process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o')
      : (process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.5-flash');

    const providerType = (reqProvider || (agent?.aiConfig?.apiKey ? agent.aiConfig.provider : platformDefaultProvider) || 'gemini') as 'openai' | 'gemini' | 'anthropic';
    const model = reqModel || (agent?.aiConfig?.apiKey ? agent.aiConfig.model : platformDefaultModel) || (providerType === 'openai' ? 'gpt-4o' : 'gemini-3.5-flash');
    const apiKey = agent?.aiConfig?.apiKey || '';
    const isDemo = Boolean(agent?.isDemo);

    const aiProvider = AIProviderFactory.getProvider({
      provider: providerType,
      model,
      apiKey,
      isDemo
    });

    // Resolve attached image
    let attachedImage = image;
    if (!attachedImage && trimmedPrompt.includes('data:image/')) {
      const match = trimmedPrompt.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
      if (match) {
        attachedImage = { dataUrl: match[1] };
      }
    }

    const aiContext = {
      prompt: trimmedPrompt,
      systemInstructions: agent.instruction?.systemInstructions || `You are ${agent.name}, an expert AI software engineer. Answer user questions conversationally, inspect screenshots and images when provided, write clean code, and discuss architecture.`,
      technologyStack: agent.instruction?.technologyStack,
      codingStandards: agent.instruction?.codingStandards,
      architectureRules: agent.instruction?.architectureRules,
      projectKnowledge: agent.instruction?.projectKnowledge,
      repositoryContext: agent.repository ? {
        owner: agent.repository.repositoryOwner,
        name: agent.repository.repositoryName,
        branch: agent.repository.branch
      } : undefined,
      image: attachedImage
    };

    const history = (conversation?.messages || []).map((m: any) => ({
      sender: m.sender,
      content: m.content
    }));

    // If SSE streaming requested:
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let fullResponse = '';

      if (aiProvider.chatStream) {
        fullResponse = await aiProvider.chatStream(trimmedPrompt, history, aiContext, (chunk: string) => {
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        });
      } else {
        fullResponse = await aiProvider.chat(trimmedPrompt, history, aiContext);
        res.write(`data: ${JSON.stringify({ chunk: fullResponse, done: false })}\n\n`);
      }

      // Save assistant message to database
      const assistantMsg = await prisma.message.create({
        data: {
          conversationId: convId,
          sender: 'agent',
          content: fullResponse
        }
      });

      await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() }
      });

      res.write(`data: ${JSON.stringify({ chunk: '', done: true, message: assistantMsg })}\n\n`);
      res.end();
      return;
    }

    // Non-streaming response
    const fullResponse = await aiProvider.chat(trimmedPrompt, history, aiContext);

    // Save assistant message to database
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: convId,
        sender: 'agent',
        content: fullResponse
      }
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() }
    });

    res.json({
      reply: fullResponse,
      userMessage: userMsg,
      message: assistantMsg,
      conversationId: convId,
      agentId: agent.id
    });

  } catch (err: any) {
    console.error('handleChat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Chat generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message, done: true })}\n\n`);
      res.end();
    }
  }
}

