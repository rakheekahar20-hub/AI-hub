export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'IDLE' | 'EXECUTING' | 'ERROR';
export type Environment = 'development' | 'staging' | 'production';
export type ExecutionMode = 'manual' | 'assisted' | 'autonomous';
export type ServerType = 'ssh' | 'sftp' | 'ftp' | 'docker' | 'api';
export type AIProviderType = 'openai' | 'gemini' | 'anthropic';
export type DeploymentStrategy = 'manual' | 'automatic' | 'approval_required';

export type ExecutionStatus = 
  | 'QUEUED' 
  | 'RUNNING' 
  | 'WAITING_FOR_APPROVAL' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED';

export type ExecutionStepStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'WAITING_APPROVAL';

export type FileApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'admin' | 'developer' | 'viewer';
  provider: 'firebase' | 'google' | 'microsoft' | 'demo';
  createdAt: string;
  updatedAt: string;
}

// 1. Agent General Info
export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  agentType: string; // e.g. 'Full Stack Developer', 'Bug Hunter', 'Refactor Specialist'
  icon: string;
  environment: Environment;
  status: AgentStatus;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations / Sub-configs
  repository?: AgentRepository | null;
  servers?: AgentServer[];
  aiConfig?: AgentAIConfig | null;
  instruction?: AgentInstruction | null;
  environmentVariables?: AgentEnvironmentVariable[];
  permission?: AgentPermission | null;
  executionConfig?: AgentExecutionConfig | null;
  testingConfig?: AgentTestingConfig | null;
  deploymentConfig?: AgentDeploymentConfig | null;
  webhooks?: AgentWebhook[];
  securityConfig?: AgentSecurityConfig | null;
  mcpConfig?: AgentMCPConfig | null;
  executionsCount?: number;
}

// 2. Repository Configuration
export interface AgentRepository {
  id: string;
  agentId: string;
  provider: 'github' | 'gitlab' | 'bitbucket' | 'custom';
  repositoryUrl: string;
  repositoryOwner: string;
  repositoryName: string;
  branch: string;
  authMethod: 'token' | 'ssh_key' | 'demo';
  // Secret tokens are masked when sent to frontend
  gitTokenMasked?: string;
  sshKeyMasked?: string;
  lastSyncAt?: string | null;
  lastCommitHash?: string | null;
  status: 'connected' | 'disconnected' | 'error' | 'not_configured';
  errorMessage?: string | null;
}

// 3. Server Configuration (Dev, Staging, Prod)
export interface AgentServer {
  id: string;
  agentId: string;
  serverName: string;
  environment: Environment;
  serverType: ServerType;
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'ssh_key' | 'api_token';
  remoteDirectory: string;
  status: 'connected' | 'disconnected' | 'error' | 'not_configured';
  lastCheckedAt?: string | null;
  errorMessage?: string | null;
  // Passwords / Keys masked
  hasPassword?: boolean;
  hasPrivateKey?: boolean;
}

// 4. AI Configuration
export interface AgentAIConfig {
  id: string;
  agentId: string;
  provider: AIProviderType;
  model: string;
  temperature: number;
  maxTokens: number;
  fallbackModel?: string;
  apiKeyMasked?: string;
  hasApiKey?: boolean;
}

// 5. Agent Instructions & Memory
export interface AgentInstruction {
  id: string;
  agentId: string;
  systemInstructions: string;
  projectKnowledge: string;
  technologyStack: string;
  businessRules: string;
  codingStandards: string;
  architectureRules: string;
  doNotModifyRules: string;
}

// 6. Environment Variables
export interface AgentEnvironmentVariable {
  id: string;
  agentId: string;
  key: string;
  valueMasked: string;
  isSecret: boolean;
  environment: Environment;
}

// 7. Tools & Permissions
export interface AgentPermission {
  id: string;
  agentId: string;
  repoRead: boolean;
  repoWrite: boolean;
  fileRead: boolean;
  fileWrite: boolean;
  git: boolean;
  terminal: boolean;
  installDependencies: boolean;
  runTests: boolean;
  runBuild: boolean;
  runLint: boolean;
  runTypecheck: boolean;
  database: boolean;
  browser: boolean;
  api: boolean;
  deployment: boolean;
}

// 8. Execution Config
export interface AgentExecutionConfig {
  id: string;
  agentId: string;
  mode: ExecutionMode; // manual | assisted | autonomous
  requireApprovalBeforeChanges: boolean;
  requireApprovalBeforeCommit: boolean;
  requireApprovalBeforePush: boolean;
  requireApprovalBeforeDeployment: boolean;
  executionTimeoutMinutes: number;
  retryCount: number;
  autoFixFailedTests: boolean;
}

// 9. Testing Config
export interface AgentTestingConfig {
  id: string;
  agentId: string;
  installCommand: string;
  testCommand: string;
  buildCommand: string;
  lintCommand: string;
  typecheckCommand: string;
}

// 10. Deployment Config
export interface AgentDeploymentConfig {
  id: string;
  agentId: string;
  provider: string; // e.g., 'docker', 'vercel', 'kubernetes', 'custom_script'
  deploymentCommand: string;
  preDeploymentCommand?: string;
  postDeploymentCommand?: string;
  healthCheckUrl?: string;
  rollbackCommand?: string;
  strategy: DeploymentStrategy;
  status?: string;
  lastDeployedAt?: string | null;
}

// 11. Webhooks
export interface AgentWebhook {
  id: string;
  agentId: string;
  webhookType: 'repository' | 'deployment' | 'agent_event';
  url: string;
  secretMasked?: string;
  events: string[];
  isActive: boolean;
}

// 12. Security Config
export interface AgentSecurityConfig {
  id: string;
  agentId: string;
  credentialStorage: 'encrypted_vault' | 'environment' | 'database';
  secretMaskingEnabled: boolean;
  allowedCommands: string;
  blockedCommands: string;
  allowedDirectories: string;
  executionSandbox: boolean;
  auditLoggingEnabled: boolean;
}

// Execution Models
export interface ExecutionStep {
  id: string;
  executionId: string;
  stepNumber: number;
  title: string;
  description: string;
  status: ExecutionStepStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  output?: string | null;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  agentName?: string;
  prompt: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string | null;
  isDemo: boolean;
  commitHash?: string | null;
  commitMessage?: string | null;
  pushedBranch?: string | null;
  testOutput?: string | null;
  buildOutput?: string | null;
  lintOutput?: string | null;
  typecheckOutput?: string | null;
  deploymentOutput?: string | null;
  healthCheckStatus?: 'healthy' | 'unhealthy' | 'unreachable' | 'not_configured';
  errorMessage?: string | null;

  steps: ExecutionStep[];
  fileChanges: AgentFileChange[];
  logs: AgentExecutionLog[];
}

export interface AgentFileChange {
  id: string;
  executionId: string;
  filePath: string;
  changeType: 'modified' | 'added' | 'deleted';
  additions: number;
  deletions: number;
  diff: string;
  originalContent?: string;
  modifiedContent?: string;
  approvalStatus: FileApprovalStatus;
  rejectedReason?: string;
}

export interface AgentExecutionLog {
  id: string;
  executionId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  stepName: string;
  message: string;
  details?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  agentId?: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  agent?: { id: string; name: string; icon?: string; status?: string } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  executionId?: string;
  createdAt: string;
}

export type MCPConnectionStatus = 'not_connected' | 'connecting' | 'connected' | 'error';

export interface AgentMCPConfig {
  id?: string;
  agentId?: string;
  name: string;
  serverType: 'github' | 'custom';
  authMethod: 'pat' | 'oauth';
  serverUrl?: string;
  apiKey?: string;
  apiKeyMasked?: string;
  status: MCPConnectionStatus;
  scopes?: string;
  discoveredTools?: string;
  errorMessage?: string | null;
  lastConnectedAt?: string | null;
}

// API Payloads
export interface CreateAgentDTO {
  name: string;
  description: string;
  agentType: string;
  icon?: string;
  environment?: Environment;
  status?: AgentStatus;
  isDemo?: boolean;

  repository?: Partial<AgentRepository>;
  servers?: Partial<AgentServer>[];
  aiConfig?: Partial<AgentAIConfig>;
  instruction?: Partial<AgentInstruction>;
  environmentVariables?: { key: string; value: string; isSecret: boolean; environment: Environment }[];
  permission?: Partial<AgentPermission>;
  executionConfig?: Partial<AgentExecutionConfig>;
  testingConfig?: Partial<AgentTestingConfig>;
  deploymentConfig?: Partial<AgentDeploymentConfig>;
  webhooks?: Partial<AgentWebhook>[];
  securityConfig?: Partial<AgentSecurityConfig>;
  mcpConfig?: Partial<AgentMCPConfig>;
}

export type UpdateAgentDTO = Partial<CreateAgentDTO>;

export interface StartExecutionDTO {
  prompt: string;
  conversationId?: string;
}

export interface ApproveFileChangeDTO {
  fileIds?: string[];
  approveAll?: boolean;
}

export interface RejectFileChangeDTO {
  fileIds?: string[];
  rejectAll?: boolean;
  reason?: string;
}
