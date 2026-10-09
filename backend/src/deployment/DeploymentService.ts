import { TerminalExecutionService } from '../execution/TerminalExecutionService.js';

export interface DeploymentResult {
  success: boolean;
  deploymentOutput: string;
  healthCheckStatus: 'healthy' | 'unhealthy' | 'unreachable' | 'not_configured';
  message: string;
  error?: string;
}

export class DeploymentService {
  /**
   * Run real deployment flow
   */
  async deploy(config: {
    provider?: string;
    deploymentCommand?: string | null;
    preDeploymentCommand?: string | null;
    postDeploymentCommand?: string | null;
    healthCheckUrl?: string | null;
    rollbackCommand?: string | null;
    isDemo?: boolean;
    cwd?: string;
  }): Promise<DeploymentResult> {
    if (!config.deploymentCommand || !config.deploymentCommand.trim()) {
      return {
        success: false,
        deploymentOutput: 'Notice: No deployment command configured for this agent.',
        healthCheckStatus: 'not_configured',
        message: 'Deployment command is not configured on this agent. Please set deployment command in Agent Settings > Deployment.'
      };
    }

    const cwd = config.cwd || TerminalExecutionService.getWorkspaceRoot();
    let combinedOutput = '';

    // 1. Pre-deployment command
    if (config.preDeploymentCommand && config.preDeploymentCommand.trim()) {
      combinedOutput += `> Pre-deployment: ${config.preDeploymentCommand}\n`;
      const preRes = await TerminalExecutionService.execute(config.preDeploymentCommand, { cwd, timeout: 60000 });
      combinedOutput += preRes.stdout ? `${preRes.stdout}\n` : '';
      if (!preRes.success) {
        combinedOutput += `Pre-deployment error: ${preRes.stderr}\n`;
        return {
          success: false,
          deploymentOutput: combinedOutput,
          healthCheckStatus: 'unhealthy',
          message: `Pre-deployment step failed: ${preRes.stderr || 'Command exited with error'}`,
          error: preRes.stderr
        };
      }
    }

    // 2. Main deployment command
    combinedOutput += `> Executing Deployment: ${config.deploymentCommand}\n`;
    const deployRes = await TerminalExecutionService.execute(config.deploymentCommand, { cwd, timeout: 120000 });
    combinedOutput += deployRes.stdout ? `${deployRes.stdout}\n` : '';

    if (!deployRes.success) {
      combinedOutput += `Deployment error: ${deployRes.stderr}\n`;
      if (config.rollbackCommand) {
        combinedOutput += `> Triggering Rollback: ${config.rollbackCommand}\n`;
        const rollbackRes = await TerminalExecutionService.execute(config.rollbackCommand, { cwd });
        combinedOutput += rollbackRes.stdout || rollbackRes.stderr;
      }

      return {
        success: false,
        deploymentOutput: combinedOutput,
        healthCheckStatus: 'unhealthy',
        message: `Deployment failed with exit code ${deployRes.exitCode}: ${deployRes.stderr}`,
        error: deployRes.stderr
      };
    }

    // 3. Post-deployment command
    if (config.postDeploymentCommand && config.postDeploymentCommand.trim()) {
      combinedOutput += `> Post-deployment: ${config.postDeploymentCommand}\n`;
      const postRes = await TerminalExecutionService.execute(config.postDeploymentCommand, { cwd, timeout: 60000 });
      combinedOutput += postRes.stdout ? `${postRes.stdout}\n` : '';
    }

    // 4. Live health check verification
    let healthStatus: 'healthy' | 'unhealthy' | 'unreachable' | 'not_configured' = 'not_configured';
    if (config.healthCheckUrl && config.healthCheckUrl.trim()) {
      combinedOutput += `> Probing Health Check: ${config.healthCheckUrl}\n`;
      try {
        const res = await fetch(config.healthCheckUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          healthStatus = 'healthy';
          combinedOutput += `Health Check Passed: HTTP ${res.status} OK (Host is healthy)\n`;
        } else {
          healthStatus = 'unhealthy';
          combinedOutput += `Health Check Warning: HTTP ${res.status} ${res.statusText}\n`;
        }
      } catch (err: any) {
        healthStatus = 'unreachable';
        combinedOutput += `Health Check Error: Target URL unreachable (${err.message})\n`;
      }
    }

    return {
      success: true,
      deploymentOutput: combinedOutput,
      healthCheckStatus: healthStatus,
      message: `Deployment executed successfully${healthStatus === 'healthy' ? ' and verified healthy' : ''}.`
    };
  }
}

export const deploymentService = new DeploymentService();
