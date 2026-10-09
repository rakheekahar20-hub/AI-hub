import { AIProvider, AIProviderContext, GeneratedFileChange, GeneratedPlan } from './AIProvider.js';

export class MockAIProvider implements AIProvider {
  name = 'Demo Intelligent Provider (Simulated)';

  async generatePlan(context: AIProviderContext): Promise<GeneratedPlan> {
    const prompt = context.prompt.toLowerCase();
    
    let steps = [
      {
        stepNumber: 1,
        title: 'Inspect Repository Architecture & Dependencies',
        description: `Analyze project structure for ${context.technologyStack || 'TypeScript/Node.js'} repository.`,
        filesToModify: ['package.json']
      },
      {
        stepNumber: 2,
        title: 'Design Implementation Strategy',
        description: `Formulate architectural changes according to rules: ${context.architectureRules || 'Modular service design'}.`
      },
      {
        stepNumber: 3,
        title: 'Apply Core Code Modifications',
        description: `Implement the requested functionality for: "${context.prompt.slice(0, 80)}..."`,
        filesToModify: prompt.includes('auth') 
          ? ['src/services/authService.ts', 'src/middleware/auth.ts']
          : prompt.includes('user') || prompt.includes('profile')
          ? ['src/controllers/userController.ts', 'src/types/user.ts']
          : prompt.includes('ui') || prompt.includes('component')
          ? ['src/components/DashboardView.tsx', 'src/styles/theme.css']
          : ['src/services/coreService.ts', 'src/types/index.ts']
      },
      {
        stepNumber: 4,
        title: 'Implement Automated Unit Tests',
        description: 'Verify new logic with edge case coverage and assertion validation.',
        filesToModify: ['tests/unit/core.test.ts'],
        commandToRun: 'npm test'
      },
      {
        stepNumber: 5,
        title: 'Execute Quality Assurance Checks',
        description: 'Run build compilation, linter and typecheck verification.',
        commandToRun: 'npm run build'
      }
    ];

    return {
      summary: `Automated plan for "${context.prompt.slice(0, 100)}" targeting branch ${context.repositoryContext?.branch || 'main'}.`,
      steps,
      riskAssessment: prompt.includes('delete') || prompt.includes('drop') ? 'high' : prompt.includes('auth') ? 'medium' : 'low',
      estimatedFilesCount: steps.reduce((acc, s) => acc + (s.filesToModify?.length || 0), 0)
    };
  }

  async generateCodeChanges(context: AIProviderContext, plan: GeneratedPlan): Promise<GeneratedFileChange[]> {
    const prompt = context.prompt.toLowerCase();

    if (prompt.includes('auth') || prompt.includes('login') || prompt.includes('jwt')) {
      return [
        {
          filePath: 'src/services/authService.ts',
          changeType: 'modified',
          additions: 24,
          deletions: 4,
          diff: `--- a/src/services/authService.ts\n+++ b/src/services/authService.ts\n@@ -12,4 +12,24 @@\n-  export function verifySession(token: string) {\n-    return false;\n-  }\n+  export interface TokenPayload {\n+    userId: string;\n+    role: string;\n+    exp: number;\n+  }\n+\n+  export function verifySession(token: string): TokenPayload | null {\n+    try {\n+      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');\n+      return decoded as TokenPayload;\n+    } catch (err) {\n+      logger.warn('Token verification failed', { error: err.message });\n+      return null;\n+    }\n+  }\n+\n+  export async function refreshSession(refreshToken: string) {\n+    // Validate refresh token and issue new session token\n+    return tokenService.rotate(refreshToken);\n+  }`,
          originalContent: `export function verifySession(token: string) {\n  return false;\n}`,
          modifiedContent: `export interface TokenPayload {\n  userId: string;\n  role: string;\n  exp: number;\n}\n\nexport function verifySession(token: string): TokenPayload | null {\n  try {\n    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');\n    return decoded as TokenPayload;\n  } catch (err) {\n    logger.warn('Token verification failed', { error: err.message });\n    return null;\n  }\n}\n\nexport async function refreshSession(refreshToken: string) {\n  return tokenService.rotate(refreshToken);\n}`
        },
        {
          filePath: 'src/middleware/auth.ts',
          changeType: 'added',
          additions: 18,
          deletions: 0,
          diff: `--- /dev/null\n+++ b/src/middleware/auth.ts\n@@ -0,0 +1,18 @@\n+import { Request, Response, NextFunction } from 'express';\n+import { verifySession } from '../services/authService.js';\n+\n+export function requireAuth(req: Request, res: Response, next: NextFunction) {\n+  const authHeader = req.headers.authorization;\n+  if (!authHeader?.startsWith('Bearer ')) {\n+    return res.status(401).json({ error: 'Authorization header missing or invalid' });\n+  }\n+  const token = authHeader.split(' ')[1];\n+  const session = verifySession(token);\n+  if (!session) {\n+    return res.status(401).json({ error: 'Session expired or invalid' });\n+  }\n+  req.user = session;\n+  next();\n+}`,
          originalContent: '',
          modifiedContent: `import { Request, Response, NextFunction } from 'express';\nimport { verifySession } from '../services/authService.js';\n\nexport function requireAuth(req: Request, res: Response, next: NextFunction) {\n  const authHeader = req.headers.authorization;\n  if (!authHeader?.startsWith('Bearer ')) {\n    return res.status(401).json({ error: 'Authorization header missing or invalid' });\n  }\n  const token = authHeader.split(' ')[1];\n  const session = verifySession(token);\n  if (!session) {\n    return res.status(401).json({ error: 'Session expired or invalid' });\n  }\n  req.user = session;\n  next();\n}`
        }
      ];
    }

    if (prompt.includes('ui') || prompt.includes('button') || prompt.includes('modal') || prompt.includes('component')) {
      return [
        {
          filePath: 'src/components/ActionBar.tsx',
          changeType: 'modified',
          additions: 16,
          deletions: 2,
          diff: `--- a/src/components/ActionBar.tsx\n+++ b/src/components/ActionBar.tsx\n@@ -8,2 +8,16 @@\n-  export const ActionBar = () => <div>Actions</div>;\n+  export const ActionBar: React.FC<ActionBarProps> = ({ onExecute, onCancel, isBusy }) => {\n+    return (\n+      <div className="flex items-center gap-3 py-2 px-4 border-t border-slate-800 bg-slate-900/60">\n+        <button\n+          onClick={onExecute}\n+          disabled={isBusy}\n+          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors"\n+        >\n+          {isBusy ? 'Processing...' : 'Execute Changes'}\n+        </button>\n+        <button onClick={onCancel} className="px-3 py-2 border border-slate-700 hover:bg-slate-800 rounded text-sm text-slate-300">\n+          Cancel\n+        </button>\n+      </div>\n+    );\n+  };`,
          originalContent: `export const ActionBar = () => <div>Actions</div>;`,
          modifiedContent: `export const ActionBar: React.FC<ActionBarProps> = ({ onExecute, onCancel, isBusy }) => {\n  return (\n    <div className="flex items-center gap-3 py-2 px-4 border-t border-slate-800 bg-slate-900/60">\n      <button onClick={onExecute} disabled={isBusy} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors">\n        {isBusy ? 'Processing...' : 'Execute Changes'}\n      </button>\n      <button onClick={onCancel} className="px-3 py-2 border border-slate-700 hover:bg-slate-800 rounded text-sm text-slate-300">Cancel</button>\n    </div>\n  );\n};`
        }
      ];
    }

    // Default code change
    return [
      {
        filePath: 'src/services/featureService.ts',
        changeType: 'modified',
        additions: 32,
        deletions: 5,
        diff: `--- a/src/services/featureService.ts\n+++ b/src/services/featureService.ts\n@@ -10,5 +10,32 @@\n-  export function processRequest() {\n-    return false;\n-  }\n+  export interface FeatureOptions {\n+    enableTelemetry?: boolean;\n+    timeoutMs?: number;\n+  }\n+\n+  export async function processRequest(options: FeatureOptions = {}) {\n+    const timeout = options.timeoutMs ?? 5000;\n+    const start = Date.now();\n+    try {\n+      // Executing request according to agent rules\n+      const result = await executePipeline({\n+        timestamp: new Date().toISOString(),\n+        timeout,\n+      });\n+      if (options.enableTelemetry) {\n+        metrics.recordDuration('feature_processing_duration', Date.now() - start);\n+      }\n+      return { success: true, data: result };\n+    } catch (error) {\n+      logger.error('Failed to process request', { error });\n+      return { success: false, error: (error as Error).message };\n+    }\n+  }`,
        originalContent: `export function processRequest() {\n  return false;\n}`,
        modifiedContent: `export interface FeatureOptions {\n  enableTelemetry?: boolean;\n  timeoutMs?: number;\n}\n\nexport async function processRequest(options: FeatureOptions = {}) {\n  const timeout = options.timeoutMs ?? 5000;\n  const start = Date.now();\n  try {\n    const result = await executePipeline({\n      timestamp: new Date().toISOString(),\n      timeout,\n    });\n    if (options.enableTelemetry) {\n      metrics.recordDuration('feature_processing_duration', Date.now() - start);\n    }\n    return { success: true, data: result };\n  } catch (error) {\n    logger.error('Failed to process request', { error });\n    return { success: false, error: (error as Error).message };\n  }\n}`
      },
      {
        filePath: 'tests/unit/featureService.test.ts',
        changeType: 'added',
        additions: 22,
        deletions: 0,
        diff: `--- /dev/null\n+++ b/tests/unit/featureService.test.ts\n@@ -0,0 +1,22 @@\n+import { describe, it, expect } from 'vitest';\n+import { processRequest } from '../../src/services/featureService.js';\n+\n+describe('processRequest', () => {\n+  it('should complete successfully with default options', async () => {\n+    const result = await processRequest();\n+    expect(result.success).toBe(true);\n+  });\n+\n+  it('should respect custom timeout limit', async () => {\n+    const result = await processRequest({ timeoutMs: 1000 });\n+    expect(result.success).toBe(true);\n+  });\n+});`,
        originalContent: '',
        modifiedContent: `import { describe, it, expect } from 'vitest';\nimport { processRequest } from '../../src/services/featureService.js';\n\ndescribe('processRequest', () => {\n  it('should complete successfully with default options', async () => {\n    const result = await processRequest();\n    expect(result.success).toBe(true);\n  });\n\n  it('should respect custom timeout limit', async () => {\n    const result = await processRequest({ timeoutMs: 1000 });\n    expect(result.success).toBe(true);\n  });\n});`
      }
    ];
  }

  async chat(message: string, history: Array<{ sender: string; content: string }>, context: AIProviderContext): Promise<string> {
    const lower = message.trim().toLowerCase();

    // 1. Casual greetings
    if (
      lower === 'hello' ||
      lower === 'hi' ||
      lower === 'hey' ||
      lower.startsWith('hello') ||
      lower.startsWith('hi ') ||
      lower.startsWith('hey ')
    ) {
      return `Hello! 👋 I am your AI Development Assistant.\n\nI'm ready to help you with your workspace and technology stack (**${context.technologyStack || 'TypeScript, Node.js, React'}**).\n\nYou can ask me questions, discuss design patterns, generate code snippets, or plan features.\n\n*💡 Tip: You can connect live Google Gemini or OpenAI by adding \`GEMINI_API_KEY\` or \`OPENAI_API_KEY\` to \`backend/.env\` or in Agent Settings.* What are you building today?`;
    }

    // 2. Capabilities & Identity
    if (lower.includes('who are you') || lower.includes('what can you do') || lower === 'help') {
      return `I am an AI Coding Agent in **AI Hub**.\n\nHere is what I can help you with:\n1. 💬 **Interactive Chat**: Answer coding questions, explain architectural concepts, inspect connection status, and plan implementations.\n2. 🛠️ **Code Implementation**: Write components, backend services, API endpoints, and database models.\n3. 🔍 **Repository Guidance**: Review changes, Git branches, and repository architecture.\n4. 🚀 **Pipelines & Deployment**: Build, test, lint, and deploy your project via the "Run Agent" trigger.\n\nFeel free to ask a question or describe a feature you'd like to build!`;
    }

    // 3. GitHub / MCP Connection Status Check
    if (
      lower.includes('connect with git hub') ||
      lower.includes('connect with github') ||
      lower.includes('connected with github') ||
      lower.includes('connected to github') ||
      lower.includes('is github connected') ||
      lower.includes('github status') ||
      lower.includes('git status')
    ) {
      const isMcpConnected = context.mcpContext?.status === 'connected';
      const isRepoConnected = context.repositoryContext?.status === 'connected' || Boolean(context.repositoryContext?.owner);
      const repoName = context.repositoryContext ? `${context.repositoryContext.owner}/${context.repositoryContext.name}` : 'Not configured';
      const branch = context.repositoryContext?.branch || 'main';

      if (isMcpConnected || isRepoConnected) {
        return `### 🐙 GitHub Connection Status\n\nYes, GitHub is connected!\n\n- **GitHub MCP Server**: \`${context.mcpContext?.status || 'connected'}\` (${context.mcpContext?.authMethod?.toUpperCase() || 'PAT'} authenticated)\n- **Repository**: \`${repoName}\`\n- **Active Target Branch**: \`${branch}\`\n- **MCP Tool Discovery**: ${context.mcpContext?.hasDiscoveredTools ? '✅ Active (official GitHub tools loaded)' : 'Ready'}\n\nYou can inspect tools and connection settings anytime in **Agent Settings > GitHub MCP Server**.`;
      } else {
        return `### 🐙 GitHub Connection Status\n\nGitHub is currently **Not Connected**.\n\nTo connect:\n1. Open **Agent Settings**.\n2. Select **Tab 14: GitHub MCP Server**.\n3. Enter your Personal Access Token (PAT) with \`repo\` scope and click **Connect GitHub**.\n\nOnce connected, I will be able to inspect repositories, manage branches, and interact with GitHub via MCP tools.`;
      }
    }

    // 4. Explanation for "why agent not simple question to simple answer"
    if (
      lower.includes('simple quiestion') ||
      lower.includes('simple question') ||
      lower.includes('simple answer')
    ) {
      return `### 💬 Conversational Mode Enabled\n\nI understand your concern! Previously, my system ran full autonomous build, test, and deployment pipelines whenever development keywords like 'git' or 'deploy' were detected—even for simple questions.\n\n**This has now been fixed**:\n- **Simple Questions & Chat**: When you ask a question (like checking GitHub status, asking about architecture, or saying hello), I will answer you directly and conversationally without executing pipelines.\n- **Autonomous Execution**: Only explicit commands to modify code, build, or deploy (e.g. *"Add a health endpoint in backend"*, *"Fix the typescript error"*, *"Deploy to main"*) will trigger the execution engine.\n\nYou can now ask any question directly!`;
    }

    // 5. Explanation for "why failed deployment"
    if (
      lower.includes('why fail') ||
      lower.includes('why did deployment fail') ||
      lower.includes('deployment status')
    ) {
      const deployStatus = context.deploymentContext?.status || 'approval_required';
      const healthCheck = context.deploymentContext?.healthCheckUrl || 'http://localhost:5001/api/health';
      return `### ℹ️ Deployment Status & Failure Analysis\n\nDeployments in this project follow strict safety and verification policies:\n\n1. **Deployment Policy**: Current strategy is set to **${context.deploymentContext?.strategy || 'approval_required'}**. In this mode, deployments will pause with an \`Approval_required\` status until explicitly approved or switched to \`automatic\`.\n2. **Health Check Verification**: After deployment steps run, an automated health check is performed against \`${healthCheck}\`. If the service is unreachable or does not return HTTP 200, the deployment marks as failed.\n3. **Target Branch Alignment**: Changes must be staged on \`${context.repositoryContext?.branch || 'main'}\` and tracked cleanly on the remote repository.\n\nYou can configure the deployment strategy, pre/post deployment commands, and health check URL in **Agent Settings > Deployment**.`;
    }

    // 6. Auth and common coding questions
    if (lower.includes('auth') || lower.includes('jwt') || lower.includes('login')) {
      return `Here is a recommended approach for implementing authentication in **${context.technologyStack || 'TypeScript & Node.js'}**:\n\n### Authentication Architecture\n1. **JWT Access Tokens**: Sign tokens with an expiration time for stateless session verification.\n2. **Middleware Guard**: Validate incoming Bearer tokens on protected routes.\n3. **Password Security**: Hash passwords using \`bcrypt\` with appropriate salt rounds.\n\n\`\`\`typescript\nimport { Request, Response, NextFunction } from 'express';\nimport jwt from 'jsonwebtoken';\n\nexport function authMiddleware(req: Request, res: Response, next: NextFunction) {\n  const authHeader = req.headers.authorization;\n  if (!authHeader?.startsWith('Bearer ')) {\n    return res.status(401).json({ error: 'Unauthorized: Missing token' });\n  }\n  const token = authHeader.split(' ')[1];\n  try {\n    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');\n    (req as any).user = decoded;\n    next();\n  } catch (err) {\n    return res.status(403).json({ error: 'Invalid or expired token' });\n  }\n}\n\`\`\`\n\nWould you like me to provide the registration and login controller methods as well?`;
    }

    // 7. General concept questions (what is X, how does X work)
    if (lower.startsWith('what is ') || lower.startsWith('what are ') || lower.startsWith('how does ')) {
      return `### 💡 Question: "${message}"\n\nI can help explain that!\n- In your project stack (**${context.technologyStack || 'TypeScript, Node.js, React'}**), architecture components are modularly decoupled.\n- For repositories, your active target is **${context.repositoryContext?.owner || 'owner'}/${context.repositoryContext?.name || 'repo'}** on branch **${context.repositoryContext?.branch || 'main'}**.\n\nLet me know if you would like code examples, architectural diagrams, or step-by-step guidance on this topic.`;
    }

    // 8. Default conversational response
    return `I received your message:\n\n> "${message}"\n\nI am your AI assistant for **${context.technologyStack || 'TypeScript, Node.js, React'}**.\n\n- Feel free to ask any question or ask for explanations—I'll respond conversationally.\n- If you'd like me to implement changes or run a build/test pipeline, simply give me an actionable instruction (e.g., *"Add a health endpoint in backend"* or *"Fix the typescript error"*).`;
  }

  async chatStream(
    message: string,
    history: Array<{ sender: string; content: string }>,
    context: AIProviderContext,
    onChunk: (token: string) => void
  ): Promise<string> {
    const fullText = await this.chat(message, history, context);
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      onChunk(chunk);
      await new Promise(r => setTimeout(r, 12));
    }
    return fullText;
  }
}

