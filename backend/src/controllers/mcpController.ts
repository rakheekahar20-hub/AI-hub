import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { GitHubMCPService } from '../mcp/GitHubMCPService.js';

export async function getGitHubMCPStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: agentId } = req.params;
    const status = await GitHubMCPService.getStatus(agentId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve MCP status' });
  }
}

export async function connectGitHubMCP(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: agentId } = req.params;
    const { serverUrl, authMethod, apiKey, scopes } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        error: 'GitHub Personal Access Token (PAT) or OAuth token is required for authentication.'
      });
    }

    const result = await GitHubMCPService.connect(agentId, {
      serverUrl: serverUrl || 'npx -y @modelcontextprotocol/server-github',
      authMethod: authMethod || 'pat',
      apiKey: apiKey.trim(),
      scopes: scopes || 'repo,read:user'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to connect to GitHub MCP Server' });
  }
}

export async function testGitHubMCPConnection(req: AuthenticatedRequest, res: Response) {
  try {
    const { serverUrl, authMethod, apiKey, scopes } = req.body;

    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a GitHub Personal Access Token or OAuth token to test.'
      });
    }

    const result = await GitHubMCPService.testConnection({
      serverUrl: serverUrl || 'npx -y @modelcontextprotocol/server-github',
      authMethod: authMethod || 'pat',
      apiKey: apiKey.trim(),
      scopes: scopes || 'repo,read:user'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'MCP connection test encountered an internal error.'
    });
  }
}

export async function disconnectGitHubMCP(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: agentId } = req.params;
    const result = await GitHubMCPService.disconnect(agentId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to disconnect MCP server' });
  }
}

export async function reconnectGitHubMCP(req: AuthenticatedRequest, res: Response) {
  try {
    const { id: agentId } = req.params;
    const result = await GitHubMCPService.reconnect(agentId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reconnect to GitHub MCP Server' });
  }
}
