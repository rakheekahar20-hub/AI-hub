import React, { useState } from 'react';
import { CreateAgentDTO, ServerType, Environment, AIProviderType, ExecutionMode } from '../../types/index.js';
import { agentService } from '../../services/agentService.js';
import {
  Bot,
  GitBranch,
  Server,
  Cpu,
  BookOpen,
  Key,
  Shield,
  PlayCircle,
  FlaskConical,
  Rocket,
  Webhook,
  Lock,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface AddAgentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated: (agent: any) => void;
}

export const AddAgentWizardModal: React.FC<AddAgentWizardModalProps> = ({
  isOpen,
  onClose,
  onAgentCreated
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State across all 13 steps
  const [formData, setFormData] = useState<CreateAgentDTO>({
    name: '',
    description: '',
    agentType: 'Full Stack Developer',
    icon: 'bot',
    environment: 'development',
    status: 'ONLINE',
    isDemo: false,

    repository: {
      provider: 'github',
      repositoryUrl: '',
      repositoryOwner: '',
      repositoryName: '',
      branch: 'main',
      authMethod: 'token',
      gitTokenMasked: ''
    },

    servers: [
      {
        serverName: 'Primary Development Server',
        environment: 'development',
        serverType: 'ssh',
        host: '127.0.0.1',
        port: 22,
        username: 'dev',
        authMethod: 'ssh_key',
        remoteDirectory: '/var/www/app'
      }
    ],

    aiConfig: {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      temperature: 0.2,
      maxTokens: 4096,
      fallbackModel: 'gpt-4o'
    },

    instruction: {
      systemInstructions: 'You are an autonomous AI coding agent designed to analyze codebases, plan changes, edit files, and run tests.',
      projectKnowledge: '',
      technologyStack: 'TypeScript, Node.js, React, Tailwind CSS',
      businessRules: 'Strict validation, idempotent operations',
      codingStandards: 'Clean code, comprehensive error handling, modular services',
      architectureRules: 'Separation of concerns, decoupled routes and controllers',
      doNotModifyRules: '.env*, package-lock.json, migrations/'
    },

    environmentVariables: [
      { key: 'API_SECRET_KEY', value: 'secret_dev_token_9918', isSecret: true, environment: 'development' }
    ],

    permission: {
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
      database: false,
      browser: false,
      api: true,
      deployment: true
    },

    executionConfig: {
      mode: 'assisted',
      requireApprovalBeforeChanges: true,
      requireApprovalBeforeCommit: true,
      requireApprovalBeforePush: true,
      requireApprovalBeforeDeployment: true,
      executionTimeoutMinutes: 15,
      retryCount: 2,
      autoFixFailedTests: true
    },

    testingConfig: {
      installCommand: 'npm install',
      testCommand: 'npm test',
      buildCommand: 'npm run build',
      lintCommand: 'npm run lint',
      typecheckCommand: 'npm run typecheck'
    },

    deploymentConfig: {
      provider: 'docker',
      deploymentCommand: 'docker-compose up -d --build',
      preDeploymentCommand: 'npm run build',
      postDeploymentCommand: '',
      healthCheckUrl: 'http://localhost:3000/health',
      rollbackCommand: 'docker-compose down',
      strategy: 'approval_required'
    },

    webhooks: [
      {
        webhookType: 'repository',
        url: 'https://api.aihub.local/hooks/repo-push',
        events: ['push', 'workflow_run'],
        isActive: true
      }
    ],

    securityConfig: {
      credentialStorage: 'encrypted_vault',
      secretMaskingEnabled: true,
      allowedCommands: 'npm, git, node, npx, yarn, pnpm',
      blockedCommands: 'rm -rf /, shutdown, mkfs, dd',
      allowedDirectories: './src, ./tests, ./public',
      executionSandbox: true,
      auditLoggingEnabled: true
    }
  });

  if (!isOpen) return null;

  const totalSteps = 13;

  const stepTitles = [
    'Agent Information',
    'Repository',
    'Servers',
    'AI Configuration',
    'Agent Instructions',
    'Environment Variables',
    'Tools & Permissions',
    'Execution Mode',
    'Testing Commands',
    'Deployment Strategy',
    'Webhooks',
    'Security & Sandbox',
    'Review & Finalize'
  ];

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && !formData.name.trim()) {
      setError('Please provide an Agent Name.');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleTestRepoConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await agentService.testRepository({
        repositoryUrl: formData.repository?.repositoryUrl || '',
        authMethod: formData.repository?.authMethod || 'token',
        gitToken: (formData.repository as any)?.gitToken
      });
      setTestResult(res.message);
    } catch (err: any) {
      setTestResult(`Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestServer = async (index: number) => {
    const srv = formData.servers?.[index];
    if (!srv) return;
    setIsTesting(true);
    try {
      const res = await agentService.testServer(srv);
      alert(res.message);
    } catch (err: any) {
      alert(`Server error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (autoConnect: boolean = false) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!formData.name.trim()) {
        throw new Error('Agent Name is required.');
      }
      const created = await agentService.createAgent(formData);
      if (autoConnect && created.repository?.repositoryUrl) {
        await agentService.syncRepository(created.id).catch(() => {});
      }
      onAgentCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[88vh] bg-[#121822] border border-[#232e3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 border-b border-[#232e3d] bg-[#161f2c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Add New AI Agent Wizard
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Configure end-to-end repository access, server hosts, AI models, and deployment pipelines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-[#202c3e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-2.5 bg-[#0e131b] border-b border-[#1e2633] overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold'
                    : isCompleted
                    ? 'bg-[#182230] text-blue-400 hover:bg-[#202c3e]'
                    : 'bg-[#121822] text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-[10px] w-4 h-4 rounded-full bg-black/30 flex items-center justify-center">
                  {stepNum}
                </span>
                <span>{title}</span>
              </button>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0f141d]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Agent Information */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 1 — Agent Information</h4>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agent Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AMR Agent, Astute DFM, CBRE Agent"
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the agent's core responsibilities and domain focus..."
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Agent Type</label>
                  <select
                    value={formData.agentType}
                    onChange={e => setFormData({ ...formData, agentType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="Robotics & Embedded Systems">Robotics & Embedded Systems</option>
                    <option value="CAD & Engineering Analysis">CAD & Engineering Analysis</option>
                    <option value="IoT & Facilities Management">IoT & Facilities Management</option>
                    <option value="Workflow & Sprint Automation">Workflow & Sprint Automation</option>
                    <option value="Security Auditor">Security Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Environment</label>
                  <select
                    value={formData.environment}
                    onChange={e => setFormData({ ...formData, environment: e.target.value as Environment })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.isDemo}
                    onChange={e => setFormData({ ...formData, isDemo: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Run as Demo Agent (Allows testing full UI without real external Git/Server credentials)</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Repository */}
          {currentStep === 2 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 2 — Repository Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Git Provider</label>
                  <select
                    value={formData.repository?.provider}
                    onChange={e => setFormData({
                      ...formData,
                      repository: { ...formData.repository!, provider: e.target.value as any }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="github">GitHub</option>
                    <option value="gitlab">GitLab</option>
                    <option value="bitbucket">Bitbucket</option>
                    <option value="custom">Custom Git Host</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Default Branch</label>
                  <input
                    type="text"
                    value={formData.repository?.branch}
                    onChange={e => setFormData({
                      ...formData,
                      repository: { ...formData.repository!, branch: e.target.value }
                    })}
                    placeholder="main or develop"
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Repository URL</label>
                <input
                  type="text"
                  value={formData.repository?.repositoryUrl}
                  onChange={e => {
                    const url = e.target.value;
                    let owner = '';
                    let name = '';
                    const match = url.match(/[:/]([^/:]+)\/([^/:]+?)(\.git)?$/);
                    if (match) {
                      owner = match[1];
                      name = match[2];
                    }
                    setFormData({
                      ...formData,
                      repository: { ...formData.repository!, repositoryUrl: url, repositoryOwner: owner, repositoryName: name }
                    });
                  }}
                  placeholder="https://github.com/org/repo-name"
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Authentication Method</label>
                  <select
                    value={formData.repository?.authMethod}
                    onChange={e => setFormData({
                      ...formData,
                      repository: { ...formData.repository!, authMethod: e.target.value as any }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="token">Personal Access Token</option>
                    <option value="ssh_key">SSH Private Key</option>
                    <option value="demo">Demo Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Git Token (Masked on save)</label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxx"
                    onChange={e => setFormData({
                      ...formData,
                      repository: { ...formData.repository!, gitTokenMasked: e.target.value, gitToken: e.target.value } as any
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestRepoConnection}
                  disabled={isTesting}
                  className="py-1.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
                >
                  {isTesting ? 'Testing connection...' : 'Test Connection'}
                </button>
                {testResult && (
                  <span className="text-xs text-slate-300 font-mono">{testResult}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Server */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Step 3 — Server Connections</h4>
                  <p className="text-xs text-slate-400">Configure Development, Staging, or Production target servers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    servers: [
                      ...(formData.servers || []),
                      {
                        serverName: 'New Server',
                        environment: 'staging',
                        serverType: 'ssh',
                        host: '10.0.0.1',
                        port: 22,
                        username: 'root',
                        authMethod: 'ssh_key',
                        remoteDirectory: '/var/www'
                      }
                    ]
                  })}
                  className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Server
                </button>
              </div>

              {formData.servers?.map((server, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#232e3d] bg-[#141b25] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">Server #{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestServer(idx)}
                        className="text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                      >
                        Test Ping
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...(formData.servers || [])];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Server Name</label>
                      <input
                        type="text"
                        value={server.serverName}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].serverName = e.target.value;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Environment</label>
                      <select
                        value={server.environment}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].environment = e.target.value as any;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                      >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Server Type</label>
                      <select
                        value={server.serverType}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].serverType = e.target.value as any;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                      >
                        <option value="ssh">SSH</option>
                        <option value="sftp">SFTP</option>
                        <option value="ftp">FTP</option>
                        <option value="docker">Docker Host</option>
                        <option value="api">API Endpoint</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Host / IP</label>
                      <input
                        type="text"
                        value={server.host}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].host = e.target.value;
                          setFormData({ ...formData, servers: updated });
                        }}
                        placeholder="192.168.1.10"
                        className="w-full px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Port</label>
                      <input
                        type="number"
                        value={server.port}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].port = parseInt(e.target.value) || 22;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Username</label>
                      <input
                        type="text"
                        value={server.username}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].username = e.target.value;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: AI Configuration */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 4 — AI Model Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">AI Provider</label>
                  <select
                    value={formData.aiConfig?.provider}
                    onChange={e => setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig!, provider: e.target.value as any }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.aiConfig?.model}
                    onChange={e => setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig!, model: e.target.value }
                    })}
                    placeholder="gemini-1.5-pro or gpt-4o"
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Temperature ({formData.aiConfig?.temperature})</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.aiConfig?.temperature}
                    onChange={e => setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig!, temperature: parseFloat(e.target.value) }
                    })}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={formData.aiConfig?.maxTokens}
                    onChange={e => setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig!, maxTokens: parseInt(e.target.value) || 4096 }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Provider API Key (Optional in Demo Mode)</label>
                <input
                  type="password"
                  placeholder="sk-••••••••••••••••••••••••"
                  onChange={e => setFormData({
                    ...formData,
                    aiConfig: { ...formData.aiConfig!, apiKey: e.target.value } as any
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Agent Instructions */}
          {currentStep === 5 && (
            <div className="space-y-4 max-w-3xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 5 — Agent Instructions & Memory</h4>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">System Instructions</label>
                <textarea
                  rows={3}
                  value={formData.instruction?.systemInstructions}
                  onChange={e => setFormData({
                    ...formData,
                    instruction: { ...formData.instruction!, systemInstructions: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Technology Stack</label>
                  <input
                    type="text"
                    value={formData.instruction?.technologyStack}
                    onChange={e => setFormData({
                      ...formData,
                      instruction: { ...formData.instruction!, technologyStack: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Coding Standards</label>
                  <input
                    type="text"
                    value={formData.instruction?.codingStandards}
                    onChange={e => setFormData({
                      ...formData,
                      instruction: { ...formData.instruction!, codingStandards: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Architecture Rules</label>
                  <input
                    type="text"
                    value={formData.instruction?.architectureRules}
                    onChange={e => setFormData({
                      ...formData,
                      instruction: { ...formData.instruction!, architectureRules: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Do Not Modify Rules</label>
                  <input
                    type="text"
                    value={formData.instruction?.doNotModifyRules}
                    onChange={e => setFormData({
                      ...formData,
                      instruction: { ...formData.instruction!, doNotModifyRules: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Environment Variables */}
          {currentStep === 6 && (
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Step 6 — Environment Variables</h4>
                  <p className="text-xs text-slate-400">Secrets are masked and encrypted automatically</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    environmentVariables: [
                      ...(formData.environmentVariables || []),
                      { key: 'NEW_KEY', value: '', isSecret: true, environment: 'development' }
                    ]
                  })}
                  className="py-1 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Variable
                </button>
              </div>

              {formData.environmentVariables?.map((ev, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-[#141b25] border border-[#232e3d] rounded-xl">
                  <input
                    type="text"
                    value={ev.key}
                    onChange={e => {
                      const updated = [...formData.environmentVariables!];
                      updated[idx].key = e.target.value;
                      setFormData({ ...formData, environmentVariables: updated });
                    }}
                    placeholder="KEY_NAME"
                    className="flex-1 px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs font-mono text-white"
                  />
                  <input
                    type="password"
                    value={ev.value}
                    onChange={e => {
                      const updated = [...formData.environmentVariables!];
                      updated[idx].value = e.target.value;
                      setFormData({ ...formData, environmentVariables: updated });
                    }}
                    placeholder="VALUE"
                    className="flex-1 px-3 py-1.5 bg-[#0e131b] border border-[#232e3d] rounded-lg text-xs text-white"
                  />
                  <label className="flex items-center gap-1 text-[11px] text-slate-400">
                    <input
                      type="checkbox"
                      checked={ev.isSecret}
                      onChange={e => {
                        const updated = [...formData.environmentVariables!];
                        updated[idx].isSecret = e.target.checked;
                        setFormData({ ...formData, environmentVariables: updated });
                      }}
                    />
                    Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...formData.environmentVariables!];
                      updated.splice(idx, 1);
                      setFormData({ ...formData, environmentVariables: updated });
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: Tools & Permissions */}
          {currentStep === 7 && (
            <div className="space-y-4 max-w-3xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 7 — Tools & Permissions</h4>
              <p className="text-xs text-slate-400 mb-2">Enable or disable agent capabilities inside the execution sandbox</p>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(formData.permission || {}).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-3 p-3 bg-[#141b25] border border-[#232e3d] rounded-xl cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={e => setFormData({
                        ...formData,
                        permission: { ...formData.permission!, [key]: e.target.checked }
                      })}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 capitalize block">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Allow agent to {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: Execution */}
          {currentStep === 8 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 8 — Execution Settings</h4>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Execution Mode</label>
                <select
                  value={formData.executionConfig?.mode}
                  onChange={e => setFormData({
                    ...formData,
                    executionConfig: { ...formData.executionConfig!, mode: e.target.value as ExecutionMode }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                >
                  <option value="assisted">Assisted (Review before applying and committing)</option>
                  <option value="manual">Manual (Step-by-step confirmation)</option>
                  <option value="autonomous">Autonomous (Automated pipeline execution)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.executionConfig?.requireApprovalBeforeChanges}
                    onChange={e => setFormData({
                      ...formData,
                      executionConfig: { ...formData.executionConfig!, requireApprovalBeforeChanges: e.target.checked }
                    })}
                  />
                  <span>Require approval before changes</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.executionConfig?.requireApprovalBeforeCommit}
                    onChange={e => setFormData({
                      ...formData,
                      executionConfig: { ...formData.executionConfig!, requireApprovalBeforeCommit: e.target.checked }
                    })}
                  />
                  <span>Require approval before commit</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.executionConfig?.requireApprovalBeforePush}
                    onChange={e => setFormData({
                      ...formData,
                      executionConfig: { ...formData.executionConfig!, requireApprovalBeforePush: e.target.checked }
                    })}
                  />
                  <span>Require approval before push</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.executionConfig?.requireApprovalBeforeDeployment}
                    onChange={e => setFormData({
                      ...formData,
                      executionConfig: { ...formData.executionConfig!, requireApprovalBeforeDeployment: e.target.checked }
                    })}
                  />
                  <span>Require approval before deployment</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 9: Testing */}
          {currentStep === 9 && (
            <div className="space-y-4 max-w-2xl font-mono">
              <h4 className="text-sm font-sans font-semibold text-slate-200">Step 9 — Quality & Testing Commands</h4>
              <div>
                <label className="block text-xs font-sans font-medium text-slate-300 mb-1">Install Command</label>
                <input
                  type="text"
                  value={formData.testingConfig?.installCommand}
                  onChange={e => setFormData({
                    ...formData,
                    testingConfig: { ...formData.testingConfig!, installCommand: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-slate-300 mb-1">Test Command</label>
                <input
                  type="text"
                  value={formData.testingConfig?.testCommand}
                  onChange={e => setFormData({
                    ...formData,
                    testingConfig: { ...formData.testingConfig!, testCommand: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-medium text-slate-300 mb-1">Build Command</label>
                <input
                  type="text"
                  value={formData.testingConfig?.buildCommand}
                  onChange={e => setFormData({
                    ...formData,
                    testingConfig: { ...formData.testingConfig!, buildCommand: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1">Lint Command</label>
                  <input
                    type="text"
                    value={formData.testingConfig?.lintCommand}
                    onChange={e => setFormData({
                      ...formData,
                      testingConfig: { ...formData.testingConfig!, lintCommand: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-300 mb-1">Typecheck Command</label>
                  <input
                    type="text"
                    value={formData.testingConfig?.typecheckCommand}
                    onChange={e => setFormData({
                      ...formData,
                      testingConfig: { ...formData.testingConfig!, typecheckCommand: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-emerald-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Deployment */}
          {currentStep === 10 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 10 — Deployment Configuration</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Deployment Provider</label>
                  <select
                    value={formData.deploymentConfig?.provider}
                    onChange={e => setFormData({
                      ...formData,
                      deploymentConfig: { ...formData.deploymentConfig!, provider: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="docker">Docker Compose</option>
                    <option value="kubernetes">Kubernetes</option>
                    <option value="vercel">Vercel</option>
                    <option value="custom_script">Custom Deployment Script</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Strategy</label>
                  <select
                    value={formData.deploymentConfig?.strategy}
                    onChange={e => setFormData({
                      ...formData,
                      deploymentConfig: { ...formData.deploymentConfig!, strategy: e.target.value as any }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  >
                    <option value="approval_required">Approval Required</option>
                    <option value="automatic">Automatic (Continuous Deployment)</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Deployment Command</label>
                <input
                  type="text"
                  value={formData.deploymentConfig?.deploymentCommand}
                  onChange={e => setFormData({
                    ...formData,
                    deploymentConfig: { ...formData.deploymentConfig!, deploymentCommand: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs font-mono text-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Health Check URL</label>
                <input
                  type="text"
                  value={formData.deploymentConfig?.healthCheckUrl}
                  onChange={e => setFormData({
                    ...formData,
                    deploymentConfig: { ...formData.deploymentConfig!, healthCheckUrl: e.target.value }
                  })}
                  placeholder="http://localhost:3000/health"
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 11: Webhooks */}
          {currentStep === 11 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 11 — Webhooks</h4>
              <p className="text-xs text-slate-400">Configure event streams for repository commits and deployments</p>

              {formData.webhooks?.map((wh, idx) => (
                <div key={idx} className="p-3 bg-[#141b25] border border-[#232e3d] rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={wh.webhookType}
                      onChange={e => {
                        const updated = [...formData.webhooks!];
                        updated[idx].webhookType = e.target.value as any;
                        setFormData({ ...formData, webhooks: updated });
                      }}
                      className="px-2 py-1 bg-[#0e131b] border border-[#232e3d] rounded text-xs text-white"
                    >
                      <option value="repository">Repository Webhook</option>
                      <option value="deployment">Deployment Webhook</option>
                      <option value="agent_event">Agent Event Webhook</option>
                    </select>

                    <input
                      type="text"
                      value={wh.url}
                      onChange={e => {
                        const updated = [...formData.webhooks!];
                        updated[idx].url = e.target.value;
                        setFormData({ ...formData, webhooks: updated });
                      }}
                      placeholder="https://hooks.slack.com/..."
                      className="px-2 py-1 bg-[#0e131b] border border-[#232e3d] rounded text-xs text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 12: Security */}
          {currentStep === 12 && (
            <div className="space-y-4 max-w-2xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 12 — Security & Execution Sandbox</h4>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Allowed Commands</label>
                <input
                  type="text"
                  value={formData.securityConfig?.allowedCommands}
                  onChange={e => setFormData({
                    ...formData,
                    securityConfig: { ...formData.securityConfig!, allowedCommands: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Blocked Commands</label>
                <input
                  type="text"
                  value={formData.securityConfig?.blockedCommands}
                  onChange={e => setFormData({
                    ...formData,
                    securityConfig: { ...formData.securityConfig!, blockedCommands: e.target.value }
                  })}
                  className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs font-mono text-red-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.securityConfig?.executionSandbox}
                    onChange={e => setFormData({
                      ...formData,
                      securityConfig: { ...formData.securityConfig!, executionSandbox: e.target.checked }
                    })}
                  />
                  <span>Enable Execution Sandbox Isolation</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 13: Review */}
          {currentStep === 13 && (
            <div className="space-y-4 max-w-3xl">
              <h4 className="text-sm font-semibold text-slate-200">Step 13 — Review & Finalize Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#141b25] border border-[#232e3d] space-y-2 text-xs">
                  <span className="font-bold text-blue-400 block mb-1">Agent & Repository</span>
                  <div><strong>Name:</strong> {formData.name || 'Unnamed'}</div>
                  <div><strong>Type:</strong> {formData.agentType}</div>
                  <div><strong>Environment:</strong> {formData.environment}</div>
                  <div><strong>Repo:</strong> {formData.repository?.repositoryUrl || 'None configured'}</div>
                  <div><strong>Branch:</strong> {formData.repository?.branch}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#141b25] border border-[#232e3d] space-y-2 text-xs">
                  <span className="font-bold text-purple-400 block mb-1">AI & Execution</span>
                  <div><strong>AI Provider:</strong> {formData.aiConfig?.provider} ({formData.aiConfig?.model})</div>
                  <div><strong>Execution Mode:</strong> {formData.executionConfig?.mode}</div>
                  <div><strong>Deploy Strategy:</strong> {formData.deploymentConfig?.strategy}</div>
                  <div><strong>Servers:</strong> {formData.servers?.length || 0} connected</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#232e3d] bg-[#161f2c] flex items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="py-2 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center gap-2.5">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave(false)}
                  className="py-2 px-4 rounded-xl bg-[#1e2736] hover:bg-[#283549] text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Save Agent
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave(true)}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save & Connect
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

