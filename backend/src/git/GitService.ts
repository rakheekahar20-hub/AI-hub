import { TerminalExecutionService } from '../execution/TerminalExecutionService.js';
import fs from 'fs';
import path from 'path';

export interface GitTestResult {
  success: boolean;
  message: string;
  branches?: string[];
  lastCommit?: string;
  error?: string;
}

export interface GitStatusResult {
  clean: boolean;
  branch: string;
  modifiedFiles: string[];
  untrackedFiles: string[];
  rawOutput: string;
}

export class GitService {
  private getCwd(customCwd?: string): string {
    return customCwd || TerminalExecutionService.getWorkspaceRoot();
  }

  /**
   * Automatically ensure an agent's dedicated repository workspace is cloned and synchronized.
   * Isolates the client project (e.g. HealthcareApp) completely from the AI Hub application!
   */
  async ensureWorkspace(
    agent: any,
    token?: string
  ): Promise<{
    success: boolean;
    workspacePath: string;
    branch: string;
    isCloned: boolean;
    techStack?: string;
    message: string;
    error?: string;
  }> {
    const workspaceDir = TerminalExecutionService.getAgentWorkspace(agent);
    const repoUrl = agent?.repository?.repositoryUrl?.trim();
    const targetBranch = agent?.repository?.branch?.trim() || 'main';

    if (!repoUrl || repoUrl.includes('example.com') || repoUrl.includes('demo')) {
      return {
        success: true,
        workspacePath: workspaceDir,
        branch: targetBranch,
        isCloned: false,
        message: `Local workspace ready at ${workspaceDir}`
      };
    }

    const hasGit = fs.existsSync(path.join(workspaceDir, '.git'));
    let authUrl = repoUrl;
    const effectiveToken = token || agent?.repository?.gitToken;
    if (effectiveToken && repoUrl.startsWith('https://')) {
      const clean = repoUrl.replace('https://', '');
      authUrl = `https://${effectiveToken}@${clean}`;
    }

    try {
      if (!hasGit) {
        // Clone into the dedicated agent workspace directory
        let cloneRes = await TerminalExecutionService.execute(
          `git clone --branch ${targetBranch} "${authUrl}" .`,
          { cwd: workspaceDir, timeout: 60000 }
        );

        if (!cloneRes.success) {
          cloneRes = await TerminalExecutionService.execute(
            `git clone "${authUrl}" .`,
            { cwd: workspaceDir, timeout: 60000 }
          );
        }

        if (!cloneRes.success) {
          return {
            success: false,
            workspacePath: workspaceDir,
            branch: targetBranch,
            isCloned: false,
            message: `Git clone failed: ${cloneRes.stderr || cloneRes.error || 'Could not clone repository'}`,
            error: cloneRes.stderr
          };
        }
      } else {
        // Already cloned: fetch and pull latest
        await TerminalExecutionService.execute(`git fetch origin`, { cwd: workspaceDir, timeout: 15000 });
        await TerminalExecutionService.execute(`git checkout ${targetBranch}`, { cwd: workspaceDir, timeout: 10000 });
        await TerminalExecutionService.execute(`git pull origin ${targetBranch}`, { cwd: workspaceDir, timeout: 20000 });
      }

      // Auto-detect tech stack from project files
      let detectedStack = '';
      const pkgPath = path.join(workspaceDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies };
          const tags: string[] = [];
          if (deps['react-native'] || deps['expo']) tags.push('React Native (Mobile)');
          else if (deps['react']) tags.push('React');
          if (deps['vite']) tags.push('Vite');
          if (deps['next']) tags.push('Next.js');
          if (deps['typescript']) tags.push('TypeScript');
          if (deps['express']) tags.push('Express');
          if (deps['prisma']) tags.push('Prisma');
          if (deps['tailwindcss']) tags.push('Tailwind CSS');
          detectedStack = tags.join(', ') || 'Node.js, TypeScript';
        } catch {}
      } else if (fs.existsSync(path.join(workspaceDir, 'pubspec.yaml'))) {
        detectedStack = 'Flutter (Mobile), Dart';
      } else if (fs.existsSync(path.join(workspaceDir, 'requirements.txt')) || fs.existsSync(path.join(workspaceDir, 'pyproject.toml'))) {
        detectedStack = 'Python, AI/Data Engineering';
      }

      const activeBranch = await this.getCurrentBranch(workspaceDir);

      return {
        success: true,
        workspacePath: workspaceDir,
        branch: activeBranch,
        isCloned: true,
        techStack: detectedStack,
        message: `Workspace synchronized for repository '${agent?.repository?.repositoryName || 'project'}' at ${workspaceDir} on branch '${activeBranch}'`
      };
    } catch (err: any) {
      return {
        success: false,
        workspacePath: workspaceDir,
        branch: targetBranch,
        isCloned: hasGit,
        message: `Workspace sync error: ${err.message}`,
        error: err.message
      };
    }
  }

  /**
   * Dynamically detect current active branch (main vs master vs custom)
   */
  async getCurrentBranch(customCwd?: string): Promise<string> {
    const cwd = this.getCwd(customCwd);
    const result = await TerminalExecutionService.execute('git rev-parse --abbrev-ref HEAD', { cwd });
    if (result.success && result.stdout.trim()) {
      return result.stdout.trim();
    }
    return 'master';
  }

  /**
   * Check real Git status of the project workspace
   */
  async getStatus(customCwd?: string): Promise<GitStatusResult> {
    const cwd = this.getCwd(customCwd);
    const branch = await this.getCurrentBranch(cwd);
    const result = await TerminalExecutionService.execute('git status --porcelain', { cwd });

    const lines = result.stdout.split('\n').filter(l => l.trim().length > 0);
    const modifiedFiles: string[] = [];
    const untrackedFiles: string[] = [];

    for (const line of lines) {
      const code = line.slice(0, 2);
      const file = line.slice(3).trim();
      if (code.includes('M') || code.includes('A') || code.includes('D')) {
        modifiedFiles.push(file);
      } else if (code.includes('?')) {
        untrackedFiles.push(file);
      }
    }

    return {
      clean: lines.length === 0,
      branch,
      modifiedFiles,
      untrackedFiles,
      rawOutput: result.stdout
    };
  }

  /**
   * Inspect diff of uncommitted changes
   */
  async getDiff(customCwd?: string): Promise<string> {
    const cwd = this.getCwd(customCwd);
    const result = await TerminalExecutionService.execute('git diff', { cwd });
    return result.stdout;
  }

  /**
   * Test connection to a remote git repository
   */
  async testConnection(repoUrl: string, authMethod: string = 'token', token?: string): Promise<GitTestResult> {
    if (!repoUrl) {
      return { success: false, message: 'Repository URL is required', error: 'MISSING_REPO_URL' };
    }

    try {
      let remoteUrl = repoUrl;
      if (token && repoUrl.startsWith('https://')) {
        const urlWithoutProtocol = repoUrl.replace('https://', '');
        remoteUrl = `https://${token}@${urlWithoutProtocol}`;
      }

      const result = await TerminalExecutionService.execute(`git ls-remote --heads "${remoteUrl}"`, {
        timeout: 10000
      });

      if (!result.success) {
        return {
          success: false,
          message: `Git connection failed: ${result.stderr || result.error || 'Repository unreachable'}`,
          error: result.stderr
        };
      }

      const branches = result.stdout
        .split('\n')
        .map(line => {
          const match = line.match(/refs\/heads\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      return {
        success: true,
        message: `Successfully connected. Found ${branches.length} remote branch(es).`,
        branches: branches.length > 0 ? branches : ['master', 'main']
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Git connection error: ${err.message || 'Remote repository unreachable'}`,
        error: err.message
      };
    }
  }

  /**
   * Fetch branches for repository
   */
  async fetchBranches(repoUrl: string, token?: string): Promise<string[]> {
    const res = await this.testConnection(repoUrl, token ? 'token' : 'demo', token);
    return res.branches || ['master', 'main'];
  }

  /**
   * Sync local branch with remote repository
   */
  async sync(agentName: string, branch: string, repoUrl?: string, customCwd?: string): Promise<{ success: boolean; commit: string; message: string; output?: string }> {
    const cwd = this.getCwd(customCwd);
    const resolvedBranch = branch || await this.getCurrentBranch(cwd);

    // Check if remote exists
    const remoteRes = await TerminalExecutionService.execute('git remote -v', { cwd });
    const hasRemote = remoteRes.success && remoteRes.stdout.trim().length > 0;

    let syncOutput = '';
    if (hasRemote) {
      const pullRes = await TerminalExecutionService.execute(`git pull origin ${resolvedBranch}`, { cwd, timeout: 15000 });
      syncOutput = pullRes.stdout || pullRes.stderr;
    }

    const revRes = await TerminalExecutionService.execute('git rev-parse --short HEAD', { cwd });
    const commitHash = revRes.success ? revRes.stdout.trim() : 'HEAD';

    return {
      success: true,
      commit: commitHash,
      message: hasRemote
        ? `Branch '${resolvedBranch}' synced at commit [${commitHash}]`
        : `Local branch '${resolvedBranch}' verified at commit [${commitHash}] (No remote origin set)`,
      output: syncOutput
    };
  }

  /**
   * Real Git commit with safe staging
   */
  async commit(
    branch: string,
    message: string,
    isDemo: boolean = false,
    customCwd?: string
  ): Promise<{ success: boolean; commitHash: string; branch: string; message: string; output: string }> {
    const cwd = this.getCwd(customCwd);
    const resolvedBranch = branch || await this.getCurrentBranch(cwd);

    // Stage changes (respecting .gitignore)
    const addResult = await TerminalExecutionService.execute('git add .', { cwd });
    if (!addResult.success) {
      throw new Error(`Failed to stage files: ${addResult.stderr}`);
    }

    // Check if there are staged changes
    const statusResult = await TerminalExecutionService.execute('git status --porcelain', { cwd });
    if (!statusResult.stdout.trim()) {
      // Nothing new to commit, fetch current HEAD
      const headRes = await TerminalExecutionService.execute('git rev-parse --short HEAD', { cwd });
      const currentHash = headRes.success ? headRes.stdout.trim() : 'HEAD';
      return {
        success: true,
        commitHash: currentHash,
        branch: resolvedBranch,
        message: 'Working tree is already clean. Nothing new to commit.',
        output: 'Clean working directory'
      };
    }

    // Commit changes
    const safeMsg = message.replace(/"/g, '\\"');
    const commitResult = await TerminalExecutionService.execute(`git commit -m "${safeMsg}"`, { cwd });

    // Retrieve new commit hash
    const hashResult = await TerminalExecutionService.execute('git rev-parse --short HEAD', { cwd });
    const commitHash = hashResult.success ? hashResult.stdout.trim() : 'HEAD';

    return {
      success: commitResult.success,
      commitHash,
      branch: resolvedBranch,
      message: commitResult.success ? `Created commit [${commitHash}] on ${resolvedBranch}` : 'Commit encountered an issue',
      output: commitResult.stdout || commitResult.stderr
    };
  }

  /**
   * Real Git push to remote branch
   */
  async push(
    branch: string,
    isDemo: boolean = false,
    customCwd?: string
  ): Promise<{ success: boolean; message: string; output: string; branch: string; error?: string }> {
    const cwd = this.getCwd(customCwd);
    const resolvedBranch = branch || await this.getCurrentBranch(cwd);

    // Verify remote exists
    const remoteRes = await TerminalExecutionService.execute('git remote -v', { cwd });
    if (!remoteRes.success || !remoteRes.stdout.trim()) {
      return {
        success: false,
        message: `Git push halted: No remote repository configured (e.g. origin is missing). Configure repository URL in Agent Settings.`,
        output: '',
        branch: resolvedBranch,
        error: 'MISSING_REMOTE'
      };
    }

    // Real push
    const pushResult = await TerminalExecutionService.execute(`git push origin ${resolvedBranch}`, {
      cwd,
      timeout: 30000
    });

    if (pushResult.success) {
      return {
        success: true,
        message: `Successfully pushed branch '${resolvedBranch}' to remote origin.`,
        output: pushResult.stdout || pushResult.stderr,
        branch: resolvedBranch
      };
    }

    // Detailed error diagnostics
    let errMessage = pushResult.stderr || pushResult.stdout || 'Push failed';
    if (errMessage.includes('Permission to') || errMessage.includes('denied to')) {
      errMessage = 'Authentication / Permission error: Token or SSH key lacks write permissions to this repository.';
    } else if (errMessage.includes('protected branch') || errMessage.includes('Protected branch')) {
      errMessage = `Branch protection rule error: Branch '${resolvedBranch}' is protected against direct pushes.`;
    }

    return {
      success: false,
      message: `Git push failed: ${errMessage}`,
      output: pushResult.stderr || pushResult.stdout,
      branch: resolvedBranch,
      error: pushResult.stderr
    };
  }
}

export const gitService = new GitService();
