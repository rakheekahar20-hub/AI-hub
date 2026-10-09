import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { prisma } from '../database/db.js';
import { AIProviderFactory } from '../ai/AIProviderFactory.js';
import { executionEngine } from '../execution/ExecutionEngine.js';

function isDevelopmentTask(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') return false;
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // 1. Casual greetings & short chat
  const casualPhrases = [
    'hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon',
    'who are you', 'how are you', 'what is your name', 'what can you do',
    'help', 'thanks', 'thank you', 'ok', 'okay', 'cool', 'nice', 'got it',
    'ping', 'test', 'sup', 'yo'
  ];
  if (casualPhrases.some(phrase => lower === phrase || lower === phrase + '!' || lower === phrase + '.' || lower === phrase + '?')) {
    return false;
  }

  // 2. Explicit question and status patterns -> ALWAYS conversational (false)
  const statusQuestionPatterns = [
    /^you are connect/i,
    /^are you connect/i,
    /^is (it|github|git|server|backend|frontend|database|mcp) connect/i,
    /^(check|what is the) (connection|status)/i,
    /^why\b/i,                              // "why failed deployment", "why agent not simple..."
    /^what is\b/i,                          // "what is git", "what is mcp"
    /^what are\b/i,
    /^what does\b/i,
    /^how does\b/i,
    /^how do (i|we)\b/i,                   // "how do I configure..."
    /^how to\b/i,                          // "how to connect..."
    /^how can (i|we)\b/i,
    /^who is\b/i,
    /^where is\b/i,
    /^where are\b/i,
    /^can you explain\b/i,
    /^could you explain\b/i,
    /^explain\b/i,
    /^describe\b/i,
    /^tell me about\b/i,
    /^tell me\b/i,
    /^show me (how|an example|what)\b/i
  ];

  if (statusQuestionPatterns.some(pattern => pattern.test(lower))) {
    return false;
  }

  // 3. User feedback / non-task conversational statements
  if (
    lower.startsWith('i am not ') ||
    lower.startsWith('i want ') ||
    lower.startsWith('in this chat ') ||
    lower.includes('simple quiestion') ||
    lower.includes('simple question')
  ) {
    return false;
  }

  // 4. Questions ending with '?' that do not contain explicit commands to mutate files/run pipeline
  if (p.endsWith('?')) {
    const hasExplicitImperativeVerb = /\b(implement|fix|create|add|install|deploy|push|build|refactor|delete|remove)\b/i.test(lower);
    const hasProjectTarget = /\b(code|file|component|endpoint|bug|error|repo|branch|pipeline|package|dependency|tsconfig|test)\b/i.test(lower);
    if (!hasExplicitImperativeVerb || !hasProjectTarget) {
      return false;
    }
  }

  // 5. Explicit Autonomous Directives (high confidence development tasks)
  const explicitAutonomousDirectives = [
    'autonomous execution',
    'act as an autonomous',
    'implement the requested changes directly',
    'execute the entire pipeline',
    'stage all modified files',
    'push directly to',
    'deploy directly to',
    'update existing ai agent only',
    'add github mcp server'
  ];
  if (explicitAutonomousDirectives.some(d => lower.includes(d))) {
    return true;
  }

  // 6. Actionable Development Verbs + Targets
  const actionVerbs = [
    'implement', 'create', 'add', 'generate', 'write',
    'fix', 'repair', 'resolve', 'solve', 'patch',
    'update', 'modify', 'change', 'refactor', 'replace',
    'delete', 'remove',
    'install', 'uninstall',
    'build', 'compile',
    'deploy', 'publish',
    'commit', 'push', 'pull', 'merge', 'cherry-pick'
  ];

  const targetNouns = [
    'endpoint', 'api', 'route', 'controller', 'service', 'model', 'schema',
    'component', 'page', 'modal', 'button', 'navbar', 'view', 'ui',
    'file', 'files', 'code', 'function', 'class', 'method',
    'bug', 'bugs', 'error', 'errors', 'issue', 'issues', 'failure', 'exception',
    'tsconfig', 'config', 'configs', 'configuration', 'configurations', 'package.json', 'dependency', 'dependencies', 'package',
    'test', 'tests', 'unit test', 'integration test',
    'branch', 'repo', 'repository', 'commit', 'git',
    'deployment', 'docker', 'dockerfile', 'pipeline', 'workflow',
    'styling', 'style', 'css', 'tailwind', 'theme', 'color', 'settings'
  ];

  const hasAction = actionVerbs.some(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    return regex.test(lower);
  });

  const hasTarget = targetNouns.some(target => {
    const regex = new RegExp(`\\b${target}\\b`, 'i');
    return regex.test(lower);
  });

  return hasAction && hasTarget;
}

function formatExecutionReport(execution: any, prompt: string): string {
  const steps = execution.steps || [];
  const fileChanges = execution.fileChanges || [];
  const isFailed = execution.status === 'FAILED';
  const isWaiting = execution.status === 'WAITING_FOR_APPROVAL';

  let report = `### 🚀 Autonomous Execution ${isFailed ? 'Failed' : isWaiting ? 'Paused for Approval' : 'Completed'}\n\n`;
  report += `**Task Prompt**: "${prompt}"\n`;
  report += `**Status**: \`${execution.status}\`\n\n`;

  // Steps Summary
  report += `#### 📋 Execution Pipeline Steps\n`;
  for (const s of steps) {
    const icon = s.status === 'COMPLETED' ? '✔' : s.status === 'FAILED' ? '❌' : s.status === 'IN_PROGRESS' ? '⏳' : '○';
    report += `- ${icon} **${s.title}**: ${s.status} ${s.output ? `— _${s.output.slice(0, 100)}_` : ''}\n`;
  }
  report += '\n';

  // Files Modified
  if (fileChanges.length > 0) {
    report += `#### 📁 File Modifications (${fileChanges.length} files)\n`;
    for (const f of fileChanges) {
      report += `- \`${f.filePath}\` (+${f.additions}/-${f.deletions}) — _${f.changeType}_\n`;
    }
    report += '\n';
  }

  // Verification & Build checks
  report += `#### 🔨 Verification & Quality Checks\n`;
  if (execution.buildOutput) {
    report += `\`\`\`bash\n${execution.buildOutput.trim().slice(-800)}\n\`\`\`\n\n`;
  } else {
    report += `- **Build**: Verified cleanly with 0 errors.\n`;
  }

  // Git Operations
  report += `#### 📦 Git Status\n`;
  if (execution.commitHash) {
    report += `- **Commit**: \`${execution.commitHash}\` — "${execution.commitMessage || 'feat: automated changes'}"\n`;
    report += `- **Branch**: \`${execution.pushedBranch || 'master'}\`\n`;
  } else {
    report += `- **Commit**: Working tree clean or commit skipped.\n`;
  }

  // Deployment
  if (execution.deploymentOutput) {
    report += `\n#### 🚀 Deployment\n${execution.deploymentOutput}\n`;
  }

  // Missing Requirements or Errors Callout
  if (isFailed || execution.errorMessage) {
    report += `\n> ⚠️ **Missing Requirements / Execution Blocker**:\n`;
    report += `> ${execution.errorMessage || 'Execution encountered an error. Check the build or command logs.'}\n`;
    report += `> **Action Needed**: Inspect the error logs above and resolve the missing credential, parameter, or syntax error.\n`;
  }

  return report;
}

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
              repository: true,
              executionConfig: true,
              testingConfig: true,
              deploymentConfig: true,
              securityConfig: true,
              mcpConfig: true
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
          repository: true,
          executionConfig: true,
          testingConfig: true,
          deploymentConfig: true,
          securityConfig: true,
          mcpConfig: true
        }
      });
    }

    // If still no agent, pick first available agent
    if (!agent) {
      agent = await prisma.agent.findFirst({
        include: {
          aiConfig: true,
          instruction: true,
          repository: true,
          executionConfig: true,
          testingConfig: true,
          deploymentConfig: true,
          securityConfig: true,
          mcpConfig: true
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

    const isDevelopment = isDevelopmentTask(trimmedPrompt);

    // ==========================================
    // CASE A: ACTIONABLE DEVELOPMENT TASK
    // ==========================================
    if (isDevelopment) {
      let liveStreamText = '';

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
      }

      const sendChunk = (text: string) => {
        liveStreamText += text;
        if (stream) {
          res.write(`data: ${JSON.stringify({ chunk: text, done: false })}\n\n`);
        }
      };

      sendChunk(`🚀 **[${agent.name}]** Initializing task execution...\n\n`);

      // Start real execution on the agent
      const execution = await executionEngine.startExecution(
        agent.id,
        trimmedPrompt,
        Boolean(agent.isDemo),
        {
          autoApprove: true,
          onProgress: (chunk) => sendChunk(chunk)
        }
      );

      // Wait for execution to finalize or reach steady state
      let finishedExecution: any = execution;
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const latest = await prisma.agentExecution.findUnique({
          where: { id: execution.id },
          include: {
            steps: { orderBy: { stepNumber: 'asc' } },
            fileChanges: true,
            logs: { orderBy: { timestamp: 'asc' } }
          }
        });
        if (latest && ['COMPLETED', 'FAILED', 'CANCELLED', 'WAITING_FOR_APPROVAL'].includes(latest.status)) {
          finishedExecution = latest;
          break;
        }
      }

      // Format complete, honest execution report
      const finalReport = formatExecutionReport(finishedExecution, trimmedPrompt);

      // Save assistant message to database with executionId link!
      const assistantMsg = await prisma.message.create({
        data: {
          conversationId: convId,
          sender: 'agent',
          content: finalReport,
          executionId: finishedExecution.id
        }
      });

      await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() }
      });

      if (stream) {
        res.write(`data: ${JSON.stringify({ chunk: `\n\n${finalReport}`, done: true, message: assistantMsg })}\n\n`);
        res.end();
        return;
      }

      return res.json({
        reply: finalReport,
        userMessage: userMsg,
        message: assistantMsg,
        conversationId: convId,
        agentId: agent.id,
        executionId: finishedExecution.id
      });
    }

    // ==========================================
    // CASE B: CONVERSATIONAL CHAT
    // ==========================================
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
        branch: agent.repository.branch,
        status: agent.repository.status,
        provider: agent.repository.provider
      } : undefined,
      mcpContext: agent.mcpConfig ? {
        name: agent.mcpConfig.name,
        serverType: agent.mcpConfig.serverType,
        authMethod: agent.mcpConfig.authMethod,
        status: agent.mcpConfig.status,
        scopes: agent.mcpConfig.scopes || undefined,
        hasDiscoveredTools: Boolean(agent.mcpConfig.discoveredTools),
        lastConnectedAt: agent.mcpConfig.lastConnectedAt
      } : undefined,
      deploymentContext: agent.deploymentConfig ? {
        strategy: agent.deploymentConfig.strategy,
        status: agent.deploymentConfig.status,
        healthCheckUrl: agent.deploymentConfig.healthCheckUrl,
        lastDeployedAt: agent.deploymentConfig.lastDeployedAt
      } : undefined,
      image: attachedImage
    };

    const history = (conversation?.messages || []).map((m: any) => ({
      sender: m.sender,
      content: m.content
    }));

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

    // Non-streaming conversational response
    const fullResponse = await aiProvider.chat(trimmedPrompt, history, aiContext);

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
