import { prisma } from '../database/db.js';
import type { CreateAgentDTO, UpdateAgentDTO } from '../types/shared.js';
import { auditService } from './auditService.js';

export class AgentService {
  /**
   * Helper to mask secrets
   */
  private maskSecret(val?: string | null): string | undefined {
    if (!val) return undefined;
    if (val.length <= 4) return '****';
    return `${val.substring(0, 3)}••••••••${val.substring(val.length - 2)}`;
  }

  /**
   * Sanitize agent for safe client transport (never expose plain secrets)
   */
  private sanitizeAgent(agent: any) {
    if (!agent) return null;
    const sanitized = { ...agent };

    if (sanitized.repository) {
      sanitized.repository.gitTokenMasked = this.maskSecret(sanitized.repository.gitToken);
      sanitized.repository.sshKeyMasked = sanitized.repository.sshKey ? '•••••••• [SSH Private Key]' : undefined;
      delete sanitized.repository.gitToken;
      delete sanitized.repository.sshKey;
    }

    if (sanitized.servers) {
      sanitized.servers = sanitized.servers.map((srv: any) => {
        const hasPassword = Boolean(srv.password);
        const hasPrivateKey = Boolean(srv.privateKey);
        delete srv.password;
        delete srv.privateKey;
        return { ...srv, hasPassword, hasPrivateKey };
      });
    }

    if (sanitized.aiConfig) {
      sanitized.aiConfig.apiKeyMasked = this.maskSecret(sanitized.aiConfig.apiKey);
      sanitized.aiConfig.hasApiKey = Boolean(sanitized.aiConfig.apiKey);
      delete sanitized.aiConfig.apiKey;
    }

    if (sanitized.environmentVariables) {
      sanitized.environmentVariables = sanitized.environmentVariables.map((env: any) => {
        return {
          ...env,
          valueMasked: env.isSecret ? this.maskSecret(env.value) : env.value,
          value: undefined // hide plain value
        };
      });
    }

    if (sanitized.webhooks) {
      sanitized.webhooks = sanitized.webhooks.map((wh: any) => {
        const masked = { ...wh, secretMasked: this.maskSecret(wh.secret) };
        delete wh.secret;
        return masked;
      });
    }

    return sanitized;
  }

  async getAllAgents(userId?: string) {
    const agents = await prisma.agent.findMany({
      where: userId ? { userId } : {},
      include: {
        repository: true,
        servers: true,
        aiConfig: true,
        instruction: true,
        environmentVariables: true,
        permission: true,
        executionConfig: true,
        testingConfig: true,
        deploymentConfig: true,
        webhooks: true,
        securityConfig: true,
        _count: {
          select: { executions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return agents.map(a => {
      const sanitized = this.sanitizeAgent(a);
      sanitized.executionsCount = a._count.executions;
      return sanitized;
    });
  }

  async getAgentById(id: string) {
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        repository: true,
        servers: true,
        aiConfig: true,
        instruction: true,
        environmentVariables: true,
        permission: true,
        executionConfig: true,
        testingConfig: true,
        deploymentConfig: true,
        webhooks: true,
        securityConfig: true,
        _count: {
          select: { executions: true }
        }
      }
    });

    if (!agent) return null;
    const sanitized = this.sanitizeAgent(agent);
    sanitized.executionsCount = agent._count.executions;
    return sanitized;
  }

  async createAgent(userId: string, data: CreateAgentDTO) {
    const agent = await prisma.agent.create({
      data: {
        userId,
        name: data.name,
        description: data.description || '',
        agentType: data.agentType || 'Full Stack Developer',
        icon: data.icon || 'bot',
        environment: data.environment || 'development',
        status: data.status || 'IDLE',
        isDemo: data.isDemo ?? false,

        repository: data.repository ? {
          create: {
            provider: data.repository.provider || 'github',
            repositoryUrl: data.repository.repositoryUrl || '',
            repositoryOwner: data.repository.repositoryOwner || '',
            repositoryName: data.repository.repositoryName || '',
            branch: data.repository.branch || 'main',
            authMethod: data.repository.authMethod || 'token',
            gitToken: (data.repository as any).gitToken || null,
            sshKey: (data.repository as any).sshKey || null,
            status: data.repository.repositoryUrl ? 'connected' : 'not_configured'
          }
        } : {
          create: {
            provider: 'github',
            repositoryUrl: '',
            repositoryOwner: '',
            repositoryName: '',
            branch: 'main',
            authMethod: 'token',
            status: 'not_configured'
          }
        },

        servers: data.servers?.length ? {
          create: data.servers.map(s => ({
            serverName: s.serverName || 'Dev Server',
            environment: s.environment || 'development',
            serverType: s.serverType || 'ssh',
            host: s.host || '127.0.0.1',
            port: s.port || 22,
            username: s.username || 'root',
            authMethod: s.authMethod || 'ssh_key',
            password: (s as any).password || null,
            privateKey: (s as any).privateKey || null,
            remoteDirectory: s.remoteDirectory || '/var/www/app',
            status: s.host ? 'connected' : 'not_configured'
          }))
        } : undefined,

        aiConfig: data.aiConfig ? {
          create: {
            provider: data.aiConfig.provider || 'gemini',
            model: data.aiConfig.model || 'gemini-1.5-pro',
            temperature: data.aiConfig.temperature ?? 0.2,
            maxTokens: data.aiConfig.maxTokens ?? 4096,
            fallbackModel: data.aiConfig.fallbackModel,
            apiKey: (data.aiConfig as any).apiKey || null
          }
        } : {
          create: {
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            temperature: 0.2,
            maxTokens: 4096
          }
        },

        instruction: data.instruction ? {
          create: {
            systemInstructions: data.instruction.systemInstructions || '',
            projectKnowledge: data.instruction.projectKnowledge || '',
            technologyStack: data.instruction.technologyStack || '',
            businessRules: data.instruction.businessRules || '',
            codingStandards: data.instruction.codingStandards || '',
            architectureRules: data.instruction.architectureRules || '',
            doNotModifyRules: data.instruction.doNotModifyRules || ''
          }
        } : {
          create: {
            systemInstructions: 'You are an autonomous AI coding agent designed to analyze codebases, plan changes, edit files, and run tests.'
          }
        },

        permission: data.permission ? {
          create: {
            repoRead: data.permission.repoRead ?? true,
            repoWrite: data.permission.repoWrite ?? true,
            fileRead: data.permission.fileRead ?? true,
            fileWrite: data.permission.fileWrite ?? true,
            git: data.permission.git ?? true,
            terminal: data.permission.terminal ?? true,
            installDependencies: data.permission.installDependencies ?? true,
            runTests: data.permission.runTests ?? true,
            runBuild: data.permission.runBuild ?? true,
            runLint: data.permission.runLint ?? true,
            runTypecheck: data.permission.runTypecheck ?? true,
            database: data.permission.database ?? false,
            browser: data.permission.browser ?? false,
            api: data.permission.api ?? true,
            deployment: data.permission.deployment ?? false
          }
        } : {
          create: {}
        },

        executionConfig: data.executionConfig ? {
          create: {
            mode: data.executionConfig.mode || 'assisted',
            requireApprovalBeforeChanges: data.executionConfig.requireApprovalBeforeChanges ?? true,
            requireApprovalBeforeCommit: data.executionConfig.requireApprovalBeforeCommit ?? true,
            requireApprovalBeforePush: data.executionConfig.requireApprovalBeforePush ?? true,
            requireApprovalBeforeDeployment: data.executionConfig.requireApprovalBeforeDeployment ?? true,
            executionTimeoutMinutes: data.executionConfig.executionTimeoutMinutes || 15,
            retryCount: data.executionConfig.retryCount || 2,
            autoFixFailedTests: data.executionConfig.autoFixFailedTests ?? true
          }
        } : {
          create: {}
        },

        testingConfig: data.testingConfig ? {
          create: {
            installCommand: data.testingConfig.installCommand || 'npm install',
            testCommand: data.testingConfig.testCommand || 'npm test',
            buildCommand: data.testingConfig.buildCommand || 'npm run build',
            lintCommand: data.testingConfig.lintCommand || 'npm run lint',
            typecheckCommand: data.testingConfig.typecheckCommand || 'npm run typecheck'
          }
        } : {
          create: {}
        },

        deploymentConfig: data.deploymentConfig ? {
          create: {
            provider: data.deploymentConfig.provider || 'docker',
            deploymentCommand: data.deploymentConfig.deploymentCommand || 'docker-compose up -d --build',
            preDeploymentCommand: data.deploymentConfig.preDeploymentCommand,
            postDeploymentCommand: data.deploymentConfig.postDeploymentCommand,
            healthCheckUrl: data.deploymentConfig.healthCheckUrl,
            rollbackCommand: data.deploymentConfig.rollbackCommand,
            strategy: data.deploymentConfig.strategy || 'approval_required'
          }
        } : {
          create: {}
        },

        securityConfig: data.securityConfig ? {
          create: {
            credentialStorage: data.securityConfig.credentialStorage || 'encrypted_vault',
            secretMaskingEnabled: data.securityConfig.secretMaskingEnabled ?? true,
            allowedCommands: data.securityConfig.allowedCommands || 'npm, git, node, npx, yarn, pnpm',
            blockedCommands: data.securityConfig.blockedCommands || 'rm -rf /, shutdown, mkfs, dd',
            allowedDirectories: data.securityConfig.allowedDirectories || './src, ./tests, ./public',
            executionSandbox: data.securityConfig.executionSandbox ?? true,
            auditLoggingEnabled: data.securityConfig.auditLoggingEnabled ?? true
          }
        } : {
          create: {}
        },

        environmentVariables: data.environmentVariables?.length ? {
          create: data.environmentVariables.map(ev => ({
            key: ev.key,
            value: ev.value,
            isSecret: ev.isSecret ?? true,
            environment: ev.environment || 'development'
          }))
        } : undefined,

        webhooks: data.webhooks?.length ? {
          create: data.webhooks.map(wh => ({
            webhookType: wh.webhookType || 'repository',
            url: wh.url || '',
            secret: (wh as any).secret,
            events: Array.isArray(wh.events) ? wh.events.join(',') : (wh.events as any) || 'push',
            isActive: wh.isActive ?? true
          }))
        } : undefined
      }
    });

    await auditService.log({
      userId,
      agentId: agent.id,
      action: 'AGENT_CREATED',
      resource: `Agent:${agent.id}`,
      details: `Created agent ${agent.name} (${agent.agentType})`
    });

    return this.getAgentById(agent.id);
  }

  async updateAgent(agentId: string, data: UpdateAgentDTO, userId?: string) {
    const existing = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!existing) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Update main fields
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        agentType: data.agentType ?? undefined,
        icon: data.icon ?? undefined,
        environment: data.environment ?? undefined,
        status: data.status ?? undefined,
        isDemo: data.isDemo ?? undefined
      }
    });

    // Update Repository
    if (data.repository) {
      await prisma.agentRepository.upsert({
        where: { agentId },
        create: {
          agentId,
          provider: data.repository.provider || 'github',
          repositoryUrl: data.repository.repositoryUrl || '',
          repositoryOwner: data.repository.repositoryOwner || '',
          repositoryName: data.repository.repositoryName || '',
          branch: data.repository.branch || 'main',
          authMethod: data.repository.authMethod || 'token',
          gitToken: (data.repository as any).gitToken || null,
          sshKey: (data.repository as any).sshKey || null,
          status: data.repository.repositoryUrl ? 'connected' : 'not_configured'
        },
        update: {
          provider: data.repository.provider ?? undefined,
          repositoryUrl: data.repository.repositoryUrl ?? undefined,
          repositoryOwner: data.repository.repositoryOwner ?? undefined,
          repositoryName: data.repository.repositoryName ?? undefined,
          branch: data.repository.branch ?? undefined,
          authMethod: data.repository.authMethod ?? undefined,
          gitToken: (data.repository as any).gitToken !== undefined ? (data.repository as any).gitToken : undefined,
          sshKey: (data.repository as any).sshKey !== undefined ? (data.repository as any).sshKey : undefined,
          status: data.repository.repositoryUrl ? 'connected' : undefined
        }
      });
    }

    // Update AI Config
    if (data.aiConfig) {
      await prisma.agentAIConfig.upsert({
        where: { agentId },
        create: {
          agentId,
          provider: data.aiConfig.provider || 'gemini',
          model: data.aiConfig.model || 'gemini-1.5-pro',
          temperature: data.aiConfig.temperature ?? 0.2,
          maxTokens: data.aiConfig.maxTokens ?? 4096,
          fallbackModel: data.aiConfig.fallbackModel,
          apiKey: (data.aiConfig as any).apiKey || null
        },
        update: {
          provider: data.aiConfig.provider ?? undefined,
          model: data.aiConfig.model ?? undefined,
          temperature: data.aiConfig.temperature ?? undefined,
          maxTokens: data.aiConfig.maxTokens ?? undefined,
          fallbackModel: data.aiConfig.fallbackModel ?? undefined,
          apiKey: (data.aiConfig as any).apiKey !== undefined ? (data.aiConfig as any).apiKey : undefined
        }
      });
    }

    // Update Instructions
    if (data.instruction) {
      await prisma.agentInstruction.upsert({
        where: { agentId },
        create: {
          agentId,
          systemInstructions: data.instruction.systemInstructions || '',
          projectKnowledge: data.instruction.projectKnowledge || '',
          technologyStack: data.instruction.technologyStack || '',
          businessRules: data.instruction.businessRules || '',
          codingStandards: data.instruction.codingStandards || '',
          architectureRules: data.instruction.architectureRules || '',
          doNotModifyRules: data.instruction.doNotModifyRules || ''
        },
        update: {
          systemInstructions: data.instruction.systemInstructions ?? undefined,
          projectKnowledge: data.instruction.projectKnowledge ?? undefined,
          technologyStack: data.instruction.technologyStack ?? undefined,
          businessRules: data.instruction.businessRules ?? undefined,
          codingStandards: data.instruction.codingStandards ?? undefined,
          architectureRules: data.instruction.architectureRules ?? undefined,
          doNotModifyRules: data.instruction.doNotModifyRules ?? undefined
        }
      });
    }

    // Update Permissions
    if (data.permission) {
      await prisma.agentPermission.upsert({
        where: { agentId },
        create: {
          agentId,
          ...data.permission
        },
        update: {
          ...data.permission
        }
      });
    }

    // Update Execution Config
    if (data.executionConfig) {
      await prisma.agentExecutionConfig.upsert({
        where: { agentId },
        create: {
          agentId,
          ...data.executionConfig
        },
        update: {
          ...data.executionConfig
        }
      });
    }

    // Update Testing Config
    if (data.testingConfig) {
      await prisma.agentTestingConfig.upsert({
        where: { agentId },
        create: {
          agentId,
          ...data.testingConfig
        },
        update: {
          ...data.testingConfig
        }
      });
    }

    // Update Deployment Config
    if (data.deploymentConfig) {
      await prisma.agentDeploymentConfig.upsert({
        where: { agentId },
        create: {
          agentId,
          ...data.deploymentConfig
        },
        update: {
          ...data.deploymentConfig
        }
      });
    }

    // Update Security Config
    if (data.securityConfig) {
      await prisma.agentSecurityConfig.upsert({
        where: { agentId },
        create: {
          agentId,
          ...data.securityConfig
        },
        update: {
          ...data.securityConfig
        }
      });
    }

    // Update Servers if provided
    if (data.servers) {
      await prisma.agentServer.deleteMany({ where: { agentId } });
      await prisma.agentServer.createMany({
        data: data.servers.map(s => ({
          agentId,
          serverName: s.serverName || 'Server',
          environment: s.environment || 'development',
          serverType: s.serverType || 'ssh',
          host: s.host || '',
          port: s.port || 22,
          username: s.username || '',
          authMethod: s.authMethod || 'ssh_key',
          password: (s as any).password || null,
          privateKey: (s as any).privateKey || null,
          remoteDirectory: s.remoteDirectory || '/var/www/app',
          status: s.host ? 'connected' : 'not_configured'
        }))
      });
    }

    // Update Environment Variables if provided
    if (data.environmentVariables) {
      await prisma.agentEnvironmentVariable.deleteMany({ where: { agentId } });
      await prisma.agentEnvironmentVariable.createMany({
        data: data.environmentVariables.map(ev => ({
          agentId,
          key: ev.key,
          value: ev.value,
          isSecret: ev.isSecret ?? true,
          environment: ev.environment || 'development'
        }))
      });
    }

    // Update Webhooks if provided
    if (data.webhooks) {
      await prisma.agentWebhook.deleteMany({ where: { agentId } });
      await prisma.agentWebhook.createMany({
        data: data.webhooks.map(wh => ({
          agentId,
          webhookType: wh.webhookType || 'repository',
          url: wh.url || '',
          secret: (wh as any).secret || null,
          events: Array.isArray(wh.events) ? wh.events.join(',') : (wh.events as any) || 'push',
          isActive: wh.isActive ?? true
        }))
      });
    }

    await auditService.log({
      userId,
      agentId,
      action: 'AGENT_UPDATED',
      resource: `Agent:${agentId}`,
      details: `Updated settings for agent ${existing.name}`
    });

    return this.getAgentById(agentId);
  }

  async duplicateAgent(agentId: string, userId?: string) {
    const original = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        repository: true,
        servers: true,
        aiConfig: true,
        instruction: true,
        environmentVariables: true,
        permission: true,
        executionConfig: true,
        testingConfig: true,
        deploymentConfig: true,
        securityConfig: true
      }
    });

    if (!original) throw new Error('Agent not found');

    const copyData: CreateAgentDTO = {
      name: `${original.name} (Copy)`,
      description: original.description,
      agentType: original.agentType,
      icon: original.icon,
      environment: original.environment as any,
      status: 'IDLE',
      isDemo: original.isDemo,
      repository: original.repository ? {
        provider: original.repository.provider as any,
        repositoryUrl: original.repository.repositoryUrl,
        repositoryOwner: original.repository.repositoryOwner,
        repositoryName: original.repository.repositoryName,
        branch: original.repository.branch,
        authMethod: original.repository.authMethod as any
      } : undefined,
      servers: original.servers.map(s => ({
        serverName: s.serverName,
        environment: s.environment as any,
        serverType: s.serverType as any,
        host: s.host,
        port: s.port,
        username: s.username,
        authMethod: s.authMethod as any,
        remoteDirectory: s.remoteDirectory
      })),
      aiConfig: original.aiConfig ? {
        provider: original.aiConfig.provider as any,
        model: original.aiConfig.model,
        temperature: original.aiConfig.temperature,
        maxTokens: original.aiConfig.maxTokens,
        fallbackModel: original.aiConfig.fallbackModel || undefined
      } : undefined,
      instruction: original.instruction ? {
        systemInstructions: original.instruction.systemInstructions,
        projectKnowledge: original.instruction.projectKnowledge,
        technologyStack: original.instruction.technologyStack,
        businessRules: original.instruction.businessRules,
        codingStandards: original.instruction.codingStandards,
        architectureRules: original.instruction.architectureRules,
        doNotModifyRules: original.instruction.doNotModifyRules
      } : undefined,
      permission: original.permission ? {
        repoRead: original.permission.repoRead,
        repoWrite: original.permission.repoWrite,
        fileRead: original.permission.fileRead,
        fileWrite: original.permission.fileWrite,
        git: original.permission.git,
        terminal: original.permission.terminal,
        installDependencies: original.permission.installDependencies,
        runTests: original.permission.runTests,
        runBuild: original.permission.runBuild,
        runLint: original.permission.runLint,
        runTypecheck: original.permission.runTypecheck,
        database: original.permission.database,
        browser: original.permission.browser,
        api: original.permission.api,
        deployment: original.permission.deployment
      } : undefined,
      executionConfig: original.executionConfig ? {
        mode: original.executionConfig.mode as any,
        requireApprovalBeforeChanges: original.executionConfig.requireApprovalBeforeChanges,
        requireApprovalBeforeCommit: original.executionConfig.requireApprovalBeforeCommit,
        requireApprovalBeforePush: original.executionConfig.requireApprovalBeforePush,
        requireApprovalBeforeDeployment: original.executionConfig.requireApprovalBeforeDeployment,
        executionTimeoutMinutes: original.executionConfig.executionTimeoutMinutes,
        retryCount: original.executionConfig.retryCount,
        autoFixFailedTests: original.executionConfig.autoFixFailedTests
      } : undefined,
      testingConfig: original.testingConfig ? {
        installCommand: original.testingConfig.installCommand,
        testCommand: original.testingConfig.testCommand,
        buildCommand: original.testingConfig.buildCommand,
        lintCommand: original.testingConfig.lintCommand,
        typecheckCommand: original.testingConfig.typecheckCommand
      } : undefined,
      deploymentConfig: original.deploymentConfig ? {
        provider: original.deploymentConfig.provider,
        deploymentCommand: original.deploymentConfig.deploymentCommand,
        preDeploymentCommand: original.deploymentConfig.preDeploymentCommand || undefined,
        postDeploymentCommand: original.deploymentConfig.postDeploymentCommand || undefined,
        healthCheckUrl: original.deploymentConfig.healthCheckUrl || undefined,
        rollbackCommand: original.deploymentConfig.rollbackCommand || undefined,
        strategy: original.deploymentConfig.strategy as any
      } : undefined,
      securityConfig: original.securityConfig ? {
        credentialStorage: original.securityConfig.credentialStorage as any,
        secretMaskingEnabled: original.securityConfig.secretMaskingEnabled,
        allowedCommands: original.securityConfig.allowedCommands,
        blockedCommands: original.securityConfig.blockedCommands,
        allowedDirectories: original.securityConfig.allowedDirectories,
        executionSandbox: original.securityConfig.executionSandbox,
        auditLoggingEnabled: original.securityConfig.auditLoggingEnabled
      } : undefined
    };

    return this.createAgent(userId || original.userId, copyData);
  }

  async deleteAgent(agentId: string, userId?: string) {
    const existing = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!existing) throw new Error('Agent not found');

    await prisma.agent.delete({ where: { id: agentId } });

    await auditService.log({
      userId,
      agentId,
      action: 'AGENT_DELETED',
      resource: `Agent:${agentId}`,
      details: `Deleted agent ${existing.name}`
    });

    return { success: true };
  }
}

export const agentService = new AgentService();
