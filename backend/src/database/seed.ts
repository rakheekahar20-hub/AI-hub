import { prisma } from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding AI Hub database...');

  // 1. Create Demo User
  let user = await prisma.user.findUnique({
    where: { email: 'demo@aihub.dev' }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'demo@aihub.dev',
        name: 'Demo Architect',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'admin',
        provider: 'demo'
      }
    });
  }

  // 2. Seed Agents if none exist
  const count = await prisma.agent.count();
  if (count === 0) {
    const agentsSeed = [
      {
        name: 'AMR Agent',
        description: 'Autonomous Mobile Robotics core navigation & fleet telemetry agent',
        agentType: 'Robotics & Embedded Systems',
        icon: 'bot',
        environment: 'development',
        status: 'ONLINE',
        isDemo: true,
        repo: {
          provider: 'github',
          repositoryUrl: 'https://github.com/amr-robotics/fleet-telemetry',
          repositoryOwner: 'amr-robotics',
          repositoryName: 'fleet-telemetry',
          branch: 'main',
          authMethod: 'token',
          status: 'connected'
        },
        servers: [
          {
            serverName: 'AMR Robot Edge Node 1',
            environment: 'development',
            serverType: 'ssh',
            host: '192.168.1.120',
            port: 22,
            username: 'robot',
            remoteDirectory: '/opt/amr/runtime',
            status: 'connected'
          },
          {
            serverName: 'AMR Fleet Cloud Gateway',
            environment: 'staging',
            serverType: 'docker',
            host: 'staging.amr-fleet.io',
            port: 22,
            username: 'deploy',
            remoteDirectory: '/var/fleet-staging',
            status: 'connected'
          }
        ],
        ai: {
          provider: 'gemini',
          model: 'gemini-1.5-pro',
          temperature: 0.1,
          maxTokens: 4096
        },
        instruction: {
          systemInstructions: 'You are AMR Agent, an autonomous engineer responsible for ROS2 robotics packages, fleet telemetry nodes, and path planning modules.',
          technologyStack: 'C++, Python 3.11, ROS2 Humble, TypeScript Dashboard',
          codingStandards: 'Google C++ Style Guide, PEP 8, zero raw pointers without smart ownership',
          architectureRules: 'Micro-ROS nodes communicating over DDS pub/sub topics',
          doNotModifyRules: '/etc/ros, safety_interlock.cpp'
        },
        testing: {
          installCommand: 'colcon build --symlink-install',
          testCommand: 'colcon test && colcon test-result --all',
          buildCommand: 'colcon build --packages-select fleet_telemetry',
          lintCommand: 'ament_flake8',
          typecheckCommand: 'mypy src/'
        },
        deploy: {
          provider: 'docker',
          deploymentCommand: 'docker-compose -f docker-compose.robot.yml up -d --build',
          healthCheckUrl: 'http://localhost:8080/health',
          strategy: 'approval_required'
        }
      },
      {
        name: 'Astute DFM',
        description: 'Design For Manufacturability analysis agent and CAD geometry validator',
        agentType: 'CAD & Engineering Analysis',
        icon: 'cpu',
        environment: 'staging',
        status: 'ONLINE',
        isDemo: true,
        repo: {
          provider: 'github',
          repositoryUrl: 'https://github.com/astute-eng/dfm-analyzer',
          repositoryOwner: 'astute-eng',
          repositoryName: 'dfm-analyzer',
          branch: 'develop',
          authMethod: 'token',
          status: 'connected'
        },
        servers: [
          {
            serverName: 'DFM Staging Cluster',
            environment: 'staging',
            serverType: 'ssh',
            host: '10.0.4.15',
            port: 2222,
            username: 'analyzer',
            remoteDirectory: '/srv/dfm-analyzer',
            status: 'connected'
          }
        ],
        ai: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.2,
          maxTokens: 4096
        },
        instruction: {
          systemInstructions: 'You are Astute DFM Agent, dedicated to analyzing CAD mesh files, sheet metal bending constraints, and injection molding tolerances.',
          technologyStack: 'Python 3.10, OpenCASCADE, FastAPI, React Three Fiber',
          codingStandards: 'Clean architecture with dependency injection',
          architectureRules: 'Async job queues with Celery and Redis workers',
          doNotModifyRules: 'core/geometry_kernel.so, license.key'
        },
        testing: {
          installCommand: 'poetry install',
          testCommand: 'poetry run pytest tests/',
          buildCommand: 'poetry run python setup.py build_ext --inplace',
          lintCommand: 'ruff check .',
          typecheckCommand: 'mypy src/'
        },
        deploy: {
          provider: 'kubernetes',
          deploymentCommand: 'kubectl apply -f k8s/staging/',
          healthCheckUrl: 'https://staging.astute-dfm.internal/status',
          strategy: 'automatic'
        }
      },
      {
        name: 'CBRE Agent',
        description: 'Commercial Real Estate facilities optimization and IoT sensory hub agent',
        agentType: 'IoT & Facilities Management',
        icon: 'server',
        environment: 'production',
        status: 'IDLE',
        isDemo: true,
        repo: {
          provider: 'github',
          repositoryUrl: 'https://github.com/cbre-tech/building-iq',
          repositoryOwner: 'cbre-tech',
          repositoryName: 'building-iq',
          branch: 'release/v2',
          authMethod: 'token',
          status: 'connected'
        },
        servers: [
          {
            serverName: 'CBRE Production Cloud',
            environment: 'production',
            serverType: 'api',
            host: 'api.buildingiq.cbre.com',
            port: 443,
            username: 'platform-admin',
            remoteDirectory: '/apps/buildingiq',
            status: 'connected'
          }
        ],
        ai: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.2,
          maxTokens: 4096
        },
        instruction: {
          systemInstructions: 'You are CBRE Agent, managing HVAC telemetry data feeds, BMS protocol adapters (BACnet/Modbus), and tenant energy predictions.',
          technologyStack: 'Node.js 20, TypeScript, TimescaleDB, GraphQL',
          codingStandards: 'Standard TypeScript guidelines, strict schema validations with Zod',
          architectureRules: 'Event-driven pub/sub through Apache Kafka',
          doNotModifyRules: 'config/bms_gateways.yaml'
        },
        testing: {
          installCommand: 'npm ci',
          testCommand: 'npm test',
          buildCommand: 'npm run build',
          lintCommand: 'npm run lint',
          typecheckCommand: 'npx tsc --noEmit'
        },
        deploy: {
          provider: 'docker',
          deploymentCommand: 'docker compose -f docker-compose.prod.yml up -d',
          healthCheckUrl: 'https://api.buildingiq.cbre.com/healthz',
          strategy: 'approval_required'
        }
      },
      {
        name: 'Project Agent',
        description: 'Multi-repository orchestration and sprint delivery copilot',
        agentType: 'Workflow & Sprint Automation',
        icon: 'terminal',
        environment: 'development',
        status: 'IDLE',
        isDemo: true,
        repo: {
          provider: 'github',
          repositoryUrl: 'https://github.com/workspace/project-monorepo',
          repositoryOwner: 'workspace',
          repositoryName: 'project-monorepo',
          branch: 'main',
          authMethod: 'token',
          status: 'connected'
        },
        servers: [
          {
            serverName: 'Local Dev Sandbox',
            environment: 'development',
            serverType: 'ssh',
            host: '127.0.0.1',
            port: 22,
            username: 'dev',
            remoteDirectory: '/home/dev/workspace',
            status: 'connected'
          }
        ],
        ai: {
          provider: 'gemini',
          model: 'gemini-1.5-pro',
          temperature: 0.3,
          maxTokens: 4096
        },
        instruction: {
          systemInstructions: 'You are Project Agent, managing cross-package refactoring, release notes, changelog generation, and monorepo consistency.',
          technologyStack: 'TurboRepo, TypeScript, React 19, Next.js 15, Prisma',
          codingStandards: 'Turborepo caching standards, isolated packages',
          architectureRules: 'Clean boundary between shared packages and apps',
          doNotModifyRules: 'turbo.json, .github/workflows/'
        },
        testing: {
          installCommand: 'pnpm install',
          testCommand: 'pnpm test',
          buildCommand: 'pnpm build',
          lintCommand: 'pnpm lint',
          typecheckCommand: 'pnpm typecheck'
        },
        deploy: {
          provider: 'vercel',
          deploymentCommand: 'vercel deploy --prod',
          healthCheckUrl: 'http://localhost:3000/api/health',
          strategy: 'approval_required'
        }
      },
      {
        name: 'Development Agent',
        description: 'Autonomous feature coding, bug resolution, and live test remediation agent',
        agentType: 'Full Stack Developer',
        icon: 'code',
        environment: 'development',
        status: 'ONLINE',
        isDemo: true,
        repo: {
          provider: 'github',
          repositoryUrl: 'https://github.com/company/core-service',
          repositoryOwner: 'company',
          repositoryName: 'core-service',
          branch: 'develop',
          authMethod: 'token',
          status: 'connected'
        },
        servers: [
          {
            serverName: 'Dev Testing VM',
            environment: 'development',
            serverType: 'ssh',
            host: '10.0.1.50',
            port: 22,
            username: 'developer',
            remoteDirectory: '/home/developer/app',
            status: 'connected'
          }
        ],
        ai: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.2,
          maxTokens: 4096
        },
        instruction: {
          systemInstructions: 'You are Development Agent, specialized in end-to-end full stack feature creation, writing tests, checking types, and committing clean commits.',
          technologyStack: 'Node.js, Express, React, Tailwind CSS, PostgreSQL, Jest',
          codingStandards: 'SOLID principles, clean functions, meaningful commit messages following Conventional Commits',
          architectureRules: 'Layered architecture: Controller -> Service -> Repository',
          doNotModifyRules: '.env, docker-compose.yml'
        },
        testing: {
          installCommand: 'npm install',
          testCommand: 'npm test',
          buildCommand: 'npm run build',
          lintCommand: 'npm run lint',
          typecheckCommand: 'npm run typecheck'
        },
        deploy: {
          provider: 'docker',
          deploymentCommand: 'docker-compose up -d --build',
          healthCheckUrl: 'http://localhost:5000/api/health',
          strategy: 'approval_required'
        }
      }
    ];

    for (const a of agentsSeed) {
      const created = await prisma.agent.create({
        data: {
          userId: user.id,
          name: a.name,
          description: a.description,
          agentType: a.agentType,
          icon: a.icon,
          environment: a.environment,
          status: a.status,
          isDemo: a.isDemo,
          repository: {
            create: a.repo
          },
          servers: {
            create: a.servers
          },
          aiConfig: {
            create: a.ai
          },
          instruction: {
            create: a.instruction
          },
          permission: {
            create: {
              repoRead: true,
              repoWrite: true,
              fileRead: true,
              fileWrite: true,
              git: true,
              terminal: true,
              installDependencies: true,
              runTests: true,
              runBuild: true,
              runLint: true,
              runTypecheck: true,
              database: true,
              browser: false,
              api: true,
              deployment: true
            }
          },
          executionConfig: {
            create: {
              mode: 'assisted',
              requireApprovalBeforeChanges: true,
              requireApprovalBeforeCommit: true,
              requireApprovalBeforePush: true,
              requireApprovalBeforeDeployment: true,
              executionTimeoutMinutes: 15,
              retryCount: 2,
              autoFixFailedTests: true
            }
          },
          testingConfig: {
            create: a.testing
          },
          deploymentConfig: {
            create: a.deploy
          },
          securityConfig: {
            create: {
              credentialStorage: 'encrypted_vault',
              secretMaskingEnabled: true,
              allowedCommands: 'npm, git, node, npx, yarn, pnpm',
              blockedCommands: 'rm -rf /, shutdown, mkfs, dd',
              allowedDirectories: './src, ./tests, ./public',
              executionSandbox: true,
              auditLoggingEnabled: true
            }
          }
        }
      });

      // Create initial conversation for AMR Agent
      if (a.name === 'AMR Agent') {
        const conv = await prisma.conversation.create({
          data: {
            agentId: created.id,
            userId: user.id,
            title: 'Fleet telemetry node integration'
          }
        });

        await prisma.message.create({
          data: {
            conversationId: conv.id,
            sender: 'user',
            content: 'Hello AMR Agent! Please verify the telemetry heartbeat node and prepare an update.'
          }
        });

        await prisma.message.create({
          data: {
            conversationId: conv.id,
            sender: 'agent',
            content: "I'm ready! I have access to repository 'amr-robotics/fleet-telemetry' on branch 'main'. Enter what you want me to build or modify, and I'll generate a plan and code changes for your review."
          }
        });
      }
    }
  }

  console.log('Database seeded successfully!');
}

seed()
  .catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

