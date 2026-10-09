import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

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
   * Resolve the authorized root workspace directory
   */
  static getWorkspaceRoot(): string {
    const cwd = process.cwd();
    if (cwd.endsWith('/backend') || cwd.endsWith('\\backend')) {
      return path.resolve(cwd, '..');
    }
    return cwd;
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
