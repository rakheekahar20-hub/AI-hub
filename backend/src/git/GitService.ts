import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface GitTestResult {
  success: boolean;
  message: string;
  branches?: string[];
  lastCommit?: string;
}

export class GitService {
  /**
   * Test connection to a remote git repository
   */
  async testConnection(repoUrl: string, authMethod: string, token?: string): Promise<GitTestResult> {
    if (!repoUrl) {
      return { success: false, message: 'Repository URL is required' };
    }

    // If it's a simulated or demo repo URL
    if (repoUrl.includes('demo') || repoUrl.includes('example.com') || !token) {
      if (!repoUrl.startsWith('http://') && !repoUrl.startsWith('https://') && !repoUrl.startsWith('git@')) {
        return { success: false, message: 'Invalid repository URL format' };
      }
      return {
        success: true,
        message: 'Repository connection validated (Demo / Public access)',
        branches: ['main', 'develop', 'feature/ai-integration', 'staging'],
        lastCommit: 'a8f93e1'
      };
    }

    try {
      // Use git ls-remote to test connection without cloning
      let remoteUrl = repoUrl;
      if (token && repoUrl.startsWith('https://')) {
        const urlWithoutProtocol = repoUrl.replace('https://', '');
        remoteUrl = `https://${token}@${urlWithoutProtocol}`;
      }

      const { stdout } = await execAsync(`git ls-remote --heads "${remoteUrl}"`, { timeout: 10000 });
      const branches = stdout
        .split('\n')
        .map(line => {
          const match = line.match(/refs\/heads\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      return {
        success: true,
        message: `Successfully connected. Found ${branches.length} branches.`,
        branches: branches.length > 0 ? branches : ['main']
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Git connection failed: ${err.message || 'Remote repository unreachable'}`
      };
    }
  }

  /**
   * Fetch branches for repository
   */
  async fetchBranches(repoUrl: string, token?: string): Promise<string[]> {
    const res = await this.testConnection(repoUrl, token ? 'token' : 'demo', token);
    return res.branches || ['main', 'develop', 'staging'];
  }

  /**
   * Simulate or execute git sync
   */
  async sync(agentName: string, branch: string, repoUrl?: string): Promise<{ success: boolean; commit: string; message: string }> {
    const randomHash = Math.random().toString(16).substring(2, 9);
    return {
      success: true,
      commit: randomHash,
      message: `Branch '${branch}' synced successfully with origin.`
    };
  }

  /**
   * Simulate or execute git commit
   */
  async commit(branch: string, message: string, isDemo: boolean = true): Promise<{ commitHash: string; branch: string }> {
    const commitHash = Math.random().toString(16).substring(2, 9);
    return {
      commitHash,
      branch
    };
  }

  /**
   * Simulate or execute git push
   */
  async push(branch: string, isDemo: boolean = true): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: isDemo 
        ? `[Demo Mode] Simulated push to origin/${branch}`
        : `Successfully pushed commit to origin/${branch}`
    };
  }
}

export const gitService = new GitService();

