import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface CommandExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  command: string;
  error?: string;
}

export class TerminalExecutionService {
  /**
   * Resolve the AI Hub root directory (platform dashboard)
   */
  static getWorkspaceRoot(): string {
    const cwd = process.cwd();
    if (cwd.endsWith('/backend') || cwd.endsWith('\\backend')) {
      return path.resolve(cwd, '..');
    }
    return cwd;
  }

  /**
   * Resolve the dedicated, isolated workspace directory for a specific agent and its Git repository.
   * Keeps client project repositories (e.g. HealthcareApp, mobile app repos) completely separated from AI Hub!
   */
  static getAgentWorkspace(agent?: { id?: string; name?: string; repository?: { repositoryName?: string; repositoryUrl?: string } | null } | null): string {
    const hubRoot = this.getWorkspaceRoot();
    let folderName = '';

    if (agent?.repository?.repositoryUrl) {
      const url = agent.repository.repositoryUrl.trim().replace(/\.git$/, '');
      const match = url.match(/github\.com[/:]([^/]+)\/([^/]+)/i);
      if (match && match[2] && match[2] !== 'AI-hub' && match[2] !== 'AI hub') {
        folderName = match[2];
      } else {
        const parts = url.split('/');
        const extracted = parts[parts.length - 1];
        if (extracted && extracted !== 'AI-hub' && extracted !== 'AI hub') {
          folderName = extracted;
        }
      }
    }

    if (!folderName && agent?.repository?.repositoryName && agent.repository.repositoryName !== 'core-service' && agent.repository.repositoryName !== 'AI-hub') {
      folderName = agent.repository.repositoryName;
    }

    if (!folderName && agent?.id) {
      folderName = `agent_${agent.id.slice(0, 8)}`;
    }

    if (!folderName) {
      folderName = 'default_project';
    }

    const sanitized = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const agentWorkspacePath = path.join(hubRoot, 'workspaces', sanitized);

    if (!fs.existsSync(agentWorkspacePath)) {
      fs.mkdirSync(agentWorkspacePath, { recursive: true });
    }

    return agentWorkspacePath;
  }

  /**
   * Check if a command is blocked by security policy
   */
  static isCommandBlocked(command: string, blockedListStr?: string): boolean {
    const defaultBlocked = ['rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=/dev/zero', ':(){ :|:& };:', 'chmod -R 777 /'];
    const customBlocked = (blockedListStr || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const fullBlocked = [...defaultBlocked, ...customBlocked];
    const normalized = command.toLowerCase().trim();

    return fullBlocked.some(blocked => normalized.includes(blocked));
  }

  /**
   * Mask sensitive tokens and secrets in command output
   */
  static maskSecrets(text: string): string {
    if (!text) return '';
    return text
      .replace(/(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}/g, '$1_********************')
      .replace(/(AIzaSy)[A-Za-z0-9_-]{30,}/g, '$1********************')
      .replace(/(sk-proj-|sk-)[A-Za-z0-9_-]{20,}/g, 'sk-********************')
      .replace(/password[:=]\s*["']?[^"'\s]+["']?/gi, 'password=********');
  }

  /**
   * Execute shell command in the project environment
   */
  static async execute(
    command: string,
    options: {
      cwd?: string;
      timeout?: number;
      env?: Record<string, string>;
      blockedCommands?: string;
    } = {}
  ): Promise<CommandExecutionResult> {
    const cwd = options.cwd || this.getWorkspaceRoot();
    const timeout = options.timeout || 60000; // 60s default timeout
    const startTime = Date.now();

    if (this.isCommandBlocked(command, options.blockedCommands)) {
      return {
        success: false,
        stdout: '',
        stderr: `Security Exception: Command blocked by agent security policy.`,
        exitCode: 1,
        durationMs: Date.now() - startTime,
        command,
        error: 'BLOCKED_BY_POLICY'
      };
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: { ...process.env, ...options.env }
      });

      return {
        success: true,
        stdout: this.maskSecrets(stdout),
        stderr: this.maskSecrets(stderr),
        exitCode: 0,
        durationMs: Date.now() - startTime,
        command
      };
    } catch (err: any) {
      const exitCode = typeof err.code === 'number' ? err.code : 1;
      const stdout = this.maskSecrets(err.stdout || '');
      const stderr = this.maskSecrets(err.stderr || err.message || 'Execution failed');

      return {
        success: false,
        stdout,
        stderr,
        exitCode,
        durationMs: Date.now() - startTime,
        command,
        error: err.message
      };
    }
  }
}

