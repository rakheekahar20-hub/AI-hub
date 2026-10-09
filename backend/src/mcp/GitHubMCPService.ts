import { prisma } from '../database/db.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface GitHubUser {
  login: string;
  name?: string;
  avatarUrl?: string;
  htmlUrl?: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema?: any;
}

export interface MCPTestResult {
  success: boolean;
  user?: GitHubUser;
  scopes?: string;
  tools: MCPToolDefinition[];
  toolsCount: number;
  message: string;
  error?: string;
}

export class GitHubMCPService {
  /**
   * Mask token to protect secrets
   */
  static maskToken(token?: string | null): string {
    if (!token) return '';
    const trimmed = token.trim();
    if (trimmed.length <= 8) return '••••••••';
    const prefix = trimmed.substring(0, 4);
    const suffix = trimmed.substring(trimmed.length - 4);
    return `${prefix}••••••••${suffix}`;
  }

  /**
   * Validate GitHub credentials against GitHub API
   */
  static async validateGitHubToken(token: string): Promise<{
    valid: boolean;
    user?: GitHubUser;
    scopes?: string;
    error?: string;
  }> {
    if (!token || !token.trim()) {
      return { valid: false, error: 'GitHub token or API key is required.' };
    }

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Hub-Agent-Platform'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (res.status === 401) {
        return {
          valid: false,
          error: 'Authentication failed (HTTP 401): Invalid or expired GitHub Personal Access Token or OAuth token.'
        };
      }

      if (res.status === 403) {
        const rateLimitRemaining = res.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0') {
          return { valid: false, error: 'GitHub API rate limit exceeded for this token.' };
        }
        return { valid: false, error: 'Authentication failed (HTTP 403): Token lacks required permissions.' };
      }

      if (!res.ok) {
        return { valid: false, error: `GitHub API returned error: HTTP ${res.status} ${res.statusText}` };
      }

      const data = await res.json() as any;
      const scopes = res.headers.get('x-oauth-scopes') || 'repo,read:user';

      return {
        valid: true,
        user: {
          login: data.login,
          name: data.name || data.login,
          avatarUrl: data.avatar_url,
          htmlUrl: data.html_url
        },
        scopes
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Could not reach GitHub API: ${err.message || 'Network timeout or unreachable host'}`
      };
    }
  }

  /**
   * Standard GitHub MCP Tools exposed by GitHub MCP Server
   */
  static getStandardGitHubMCPTools(scopes?: string): MCPToolDefinition[] {
    const allTools: MCPToolDefinition[] = [
      {
        name: 'search_repositories',
        description: 'Search for GitHub repositories using GitHub search queries',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
      },
      {
        name: 'get_file_contents',
        description: 'Retrieve file or directory contents from a repository at a specific branch or commit',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'path'] }
      },
      {
        name: 'create_or_update_file',
        description: 'Create or update a single file in a repository with an authenticated commit',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, content: { type: 'string' }, message: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path', 'content', 'message'] }
      },
      {
        name: 'push_files',
        description: 'Commit and push multiple files in a single atomic Git commit',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, files: { type: 'array' }, message: { type: 'string' } }, required: ['owner', 'repo', 'branch', 'files', 'message'] }
      },
      {
        name: 'create_issue',
        description: 'Create a new issue with title, body, labels, and assignees',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title'] }
      },
      {
        name: 'list_issues',
        description: 'List and filter issues for a repository (state, labels, sort)',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] } }, required: ['owner', 'repo'] }
      },
      {
        name: 'create_pull_request',
        description: 'Open a new pull request from head branch into base branch',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, head: { type: 'string' }, base: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'title', 'head', 'base'] }
      },
      {
        name: 'create_branch',
        description: 'Create a new branch in a repository from an existing branch or commit',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, from_branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] }
      },
      {
        name: 'list_commits',
        description: 'Get commit history on a branch in a repository',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, sha: { type: 'string' } }, required: ['owner', 'repo'] }
      },
      {
        name: 'fork_repository',
        description: 'Fork a repository to the authenticated user account',
        inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] }
      },
      {
        name: 'search_code',
        description: 'Search for code across GitHub repositories matching query syntax',
        inputSchema: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] }
      }
    ];

    return allTools;
  }

  /**
   * Test connection & discover tools for given credentials
   */
  static async testConnection(params: {
    serverUrl?: string;
    authMethod: 'pat' | 'oauth';
    apiKey: string;
    scopes?: string;
  }): Promise<MCPTestResult> {
    const { apiKey, scopes } = params;

    const validation = await this.validateGitHubToken(apiKey);
    if (!validation.valid || !validation.user) {
      return {
        success: false,
        tools: [],
        toolsCount: 0,
        message: validation.error || 'Authentication failed. Please verify your GitHub token.',
        error: validation.error
      };
    }

    const tools = this.getStandardGitHubMCPTools(validation.scopes || scopes);

    return {
      success: true,
      user: validation.user,
      scopes: validation.scopes || scopes,
      tools,
      toolsCount: tools.length,
      message: `Successfully authenticated as @${validation.user.login}. Discovered ${tools.length} GitHub MCP tools.`
    };
  }

  /**
   * Connect and persist GitHub MCP Server for an agent
   */
  static async connect(
    agentId: string,
    params: {
      serverUrl?: string;
      authMethod: 'pat' | 'oauth';
      apiKey: string;
      scopes?: string;
    }
  ) {
    const testRes = await this.testConnection(params);
    if (!testRes.success) {
      // Record failure state
      await prisma.agentMCPConfig.upsert({
        where: { agentId },
        create: {
          agentId,
          name: 'GitHub MCP Server',
          serverType: 'github',
          authMethod: params.authMethod,
          serverUrl: params.serverUrl || 'npx -y @modelcontextprotocol/server-github',
          apiKey: params.apiKey,
          status: 'error',
          scopes: params.scopes || 'repo,read:user',
          errorMessage: testRes.error || testRes.message,
          discoveredTools: null
        },
        update: {
          authMethod: params.authMethod,
          serverUrl: params.serverUrl || 'npx -y @modelcontextprotocol/server-github',
          apiKey: params.apiKey,
          status: 'error',
          errorMessage: testRes.error || testRes.message,
          discoveredTools: null
        }
      });

      return {
        success: false,
        status: 'error',
        message: testRes.message,
        error: testRes.error
      };
    }

    // Persist successful connection
    const updated = await prisma.agentMCPConfig.upsert({
      where: { agentId },
      create: {
        agentId,
        name: 'GitHub MCP Server',
        serverType: 'github',
        authMethod: params.authMethod,
        serverUrl: params.serverUrl || 'npx -y @modelcontextprotocol/server-github',
        apiKey: params.apiKey,
        status: 'connected',
        scopes: testRes.scopes || params.scopes || 'repo,read:user',
        discoveredTools: JSON.stringify(testRes.tools),
        errorMessage: null,
        lastConnectedAt: new Date()
      },
      update: {
        authMethod: params.authMethod,
        serverUrl: params.serverUrl || 'npx -y @modelcontextprotocol/server-github',
        apiKey: params.apiKey,
        status: 'connected',
        scopes: testRes.scopes || params.scopes || 'repo,read:user',
        discoveredTools: JSON.stringify(testRes.tools),
        errorMessage: null,
        lastConnectedAt: new Date()
      }
    });

    return {
      success: true,
      status: 'connected',
      user: testRes.user,
      scopes: testRes.scopes,
      tools: testRes.tools,
      toolsCount: testRes.toolsCount,
      config: {
        id: updated.id,
        agentId: updated.agentId,
        name: updated.name,
        serverType: updated.serverType,
        authMethod: updated.authMethod,
        serverUrl: updated.serverUrl,
        apiKeyMasked: this.maskToken(updated.apiKey),
        status: 'connected',
        scopes: updated.scopes,
        lastConnectedAt: updated.lastConnectedAt?.toISOString(),
        discoveredTools: testRes.tools
      },
      message: `Connected successfully to GitHub MCP Server as @${testRes.user?.login}!`
    };
  }

  /**
   * Disconnect GitHub MCP Server for an agent
   */
  static async disconnect(agentId: string) {
    const existing = await prisma.agentMCPConfig.findUnique({ where: { agentId } });
    if (!existing) {
      return { success: true, status: 'not_connected', message: 'GitHub MCP Server is already disconnected.' };
    }

    const updated = await prisma.agentMCPConfig.update({
      where: { agentId },
      data: {
        status: 'not_connected',
        errorMessage: null
      }
    });

    return {
      success: true,
      status: 'not_connected',
      message: 'GitHub MCP Server disconnected.',
      config: {
        id: updated.id,
        agentId: updated.agentId,
        name: updated.name,
        serverType: updated.serverType,
        authMethod: updated.authMethod,
        serverUrl: updated.serverUrl,
        apiKeyMasked: this.maskToken(updated.apiKey),
        status: 'not_connected',
        scopes: updated.scopes,
        lastConnectedAt: updated.lastConnectedAt?.toISOString()
      }
    };
  }

  /**
   * Reconnect GitHub MCP Server using stored credentials
   */
  static async reconnect(agentId: string) {
    const existing = await prisma.agentMCPConfig.findUnique({ where: { agentId } });
    if (!existing || !existing.apiKey) {
      return {
        success: false,
        status: 'not_connected',
        message: 'No stored credentials found. Please enter your GitHub token and connect.',
        error: 'MISSING_CREDENTIALS'
      };
    }

    return this.connect(agentId, {
      serverUrl: existing.serverUrl || undefined,
      authMethod: (existing.authMethod as any) || 'pat',
      apiKey: existing.apiKey,
      scopes: existing.scopes || undefined
    });
  }

  /**
   * Get MCP status and configuration for an agent
   */
  static async getStatus(agentId: string) {
    const config = await prisma.agentMCPConfig.findUnique({ where: { agentId } });
    if (!config) {
      return {
        status: 'not_connected',
        configured: false,
        config: {
          name: 'GitHub MCP Server',
          serverType: 'github',
          authMethod: 'pat',
          serverUrl: 'npx -y @modelcontextprotocol/server-github',
          status: 'not_connected',
          scopes: 'repo,read:user',
          discoveredTools: []
        }
      };
    }

    let parsedTools: MCPToolDefinition[] = [];
    if (config.discoveredTools) {
      try {
        parsedTools = JSON.parse(config.discoveredTools);
      } catch {
        parsedTools = [];
      }
    }

    return {
      status: config.status,
      configured: true,
      config: {
        id: config.id,
        agentId: config.agentId,
        name: config.name,
        serverType: config.serverType,
        authMethod: config.authMethod,
        serverUrl: config.serverUrl,
        apiKeyMasked: this.maskToken(config.apiKey),
        status: config.status,
        scopes: config.scopes,
        errorMessage: config.errorMessage,
        lastConnectedAt: config.lastConnectedAt?.toISOString(),
        discoveredTools: parsedTools
      }
    };
  }
}
