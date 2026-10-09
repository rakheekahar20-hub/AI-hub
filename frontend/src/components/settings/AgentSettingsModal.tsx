import React, { useState, useEffect } from 'react';
import { Agent, UpdateAgentDTO, AgentExecution } from '../../types/index.js';
import { agentService } from '../../services/agentService.js';
import { settingsService, TestConnectionResult } from '../../services/settingsService.js';
import {
  Settings,
  X,
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
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  FileCode,
  GitCommit,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  Network,
  Plug,
  Github,
  ExternalLink
} from 'lucide-react';

interface AgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onAgentUpdated: (updated: Agent) => void;
}

export const AgentSettingsModal: React.FC<AgentSettingsModalProps> = ({
  isOpen,
  onClose,
  agent,
  onAgentUpdated
}) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AgentExecution[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // AI Key & testing state
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<TestConnectionResult | null>(null);

  // Initialize form from existing agent
  const [formData, setFormData] = useState<UpdateAgentDTO>({});

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        agentType: agent.agentType,
        environment: agent.environment,
        status: agent.status,
        isDemo: agent.isDemo,
        repository: agent.repository ? { ...agent.repository } : undefined,
        servers: agent.servers ? [...agent.servers] : [],
        aiConfig: agent.aiConfig ? { ...agent.aiConfig } : undefined,
        instruction: agent.instruction ? { ...agent.instruction } : undefined,
        environmentVariables: agent.environmentVariables ? [...agent.environmentVariables] as any : [],
        permission: agent.permission ? { ...agent.permission } : undefined,
        executionConfig: agent.executionConfig ? { ...agent.executionConfig } : undefined,
        testingConfig: agent.testingConfig ? { ...agent.testingConfig } : undefined,
        deploymentConfig: agent.deploymentConfig ? { ...agent.deploymentConfig } : undefined,
        webhooks: agent.webhooks ? [...agent.webhooks] : [],
        securityConfig: agent.securityConfig ? { ...agent.securityConfig } : undefined
      });
    }
  }, [agent, isOpen]);

  useEffect(() => {
    if (activeTab === 'history' && agent) {
      setLoadingHistory(true);
      agentService.getAgentExecutions(agent.id)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, agent]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: '1. General', icon: Settings },
    { id: 'repository', label: '2. Repository', icon: GitBranch },
    { id: 'server', label: '3. Server', icon: Server },
    { id: 'ai', label: '4. AI Config', icon: Cpu },
    { id: 'instructions', label: '5. Instructions', icon: BookOpen },
    { id: 'environment', label: '6. Environment', icon: Key },
    { id: 'permissions', label: '7. Tools & Perms', icon: Shield },
    { id: 'execution', label: '8. Execution', icon: PlayCircle },
    { id: 'testing', label: '9. Testing', icon: FlaskConical },
    { id: 'deployment', label: '10. Deployment', icon: Rocket },
    { id: 'webhooks', label: '11. Webhooks', icon: Webhook },
    { id: 'security', label: '12. Security', icon: Lock },
    { id: 'history', label: '13. History', icon: Clock }
  ];

  const handleReset = () => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        agentType: agent.agentType,
        environment: agent.environment,
        status: agent.status,
        isDemo: agent.isDemo,
        repository: agent.repository ? { ...agent.repository } : undefined,
        servers: agent.servers ? [...agent.servers] : [],
        aiConfig: agent.aiConfig ? { ...agent.aiConfig } : undefined,
        instruction: agent.instruction ? { ...agent.instruction } : undefined,
        environmentVariables: agent.environmentVariables ? [...agent.environmentVariables] as any : [],
        permission: agent.permission ? { ...agent.permission } : undefined,
        executionConfig: agent.executionConfig ? { ...agent.executionConfig } : undefined,
        testingConfig: agent.testingConfig ? { ...agent.testingConfig } : undefined,
        deploymentConfig: agent.deploymentConfig ? { ...agent.deploymentConfig } : undefined,
        webhooks: agent.webhooks ? [...agent.webhooks] : [],
        securityConfig: agent.securityConfig ? { ...agent.securityConfig } : undefined
      });
      setError(null);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await agentService.testRepository({
        repositoryUrl: formData.repository?.repositoryUrl || '',
        authMethod: formData.repository?.authMethod || 'token',
        gitToken: (formData.repository as any)?.gitToken
      }, agent.id);
      setTestResult(res.message);
    } catch (err: any) {
      setTestResult(`Failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestAiConnection = async () => {
    const provider = formData.aiConfig?.provider || 'gemini';
    const customKey = (formData.aiConfig as any)?.apiKey || '';
    const model = formData.aiConfig?.model;
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const res = await settingsService.testAIConnection(provider as any, customKey || undefined, model);
      setAiTestResult(res);
    } catch (err: any) {
      setAiTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setAiTesting(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Updates existing database record
      const updated = await agentService.updateAgent(agent.id, formData);
      onAgentUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-6xl h-[95vh] sm:h-[88vh] bg-[#121822] border border-[#232e3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[#232e3d] bg-[#161f2c] flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                  Agent Settings: {agent.name}
                </h3>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  ID: {agent.id.slice(0, 8)}...
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                Modify repository, credentials, server connections, and pipeline parameters
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#202c3e] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Tabs (Horizontal on mobile, vertical on desktop) + Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-[#232e3d] bg-[#0e131b] overflow-x-auto md:overflow-y-auto p-2 flex md:flex-col gap-1 flex-shrink-0 scrollbar-thin">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161d27]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-[#0f141d]">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: General */}
            {activeTab === 'general' && (
              <div className="space-y-4 max-w-2xl">
                <h4 className="text-sm font-semibold text-slate-200">General Information</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Agent Type</label>
                    <input
                      type="text"
                      value={formData.agentType || ''}
                      onChange={e => setFormData({ ...formData, agentType: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Environment</label>
                    <select
                      value={formData.environment}
                      onChange={e => setFormData({ ...formData, environment: e.target.value as any })}
                      className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.isDemo}
                      onChange={e => setFormData({ ...formData, isDemo: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                    />
                    <span>Demo Mode Enabled (Runs simulations without real git pushing)</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: Repository */}
            {activeTab === 'repository' && (
              <div className="space-y-4 max-w-2xl">
                <h4 className="text-sm font-semibold text-slate-200">Repository Connection</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Git Provider</label>
                    <input
                      type="text"
                      value={formData.repository?.provider || 'github'}
                      onChange={e => setFormData({
                        ...formData,
                        repository: { ...formData.repository!, provider: e.target.value as any }
                      })}
                      className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Branch</label>
                    <input
                      type="text"
                      value={formData.repository?.branch || 'main'}
                      onChange={e => setFormData({
                        ...formData,
                        repository: { ...formData.repository!, branch: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Repository URL</label>
                  <input
                    type="text"
                    value={formData.repository?.repositoryUrl || ''}
                    onChange={e => setFormData({
                      ...formData,
                      repository: { ...formData.repository!, repositoryUrl: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTestConnection}
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

            {/* TAB 3: Server */}
            {activeTab === 'server' && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200">Server Fleet</h4>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      servers: [
                        ...(formData.servers || []),
                        {
                          serverName: 'New Host',
                          environment: 'development',
                          serverType: 'ssh',
                          host: '127.0.0.1',
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

                {formData.servers?.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#141b25] border border-[#232e3d] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{s.serverName} ({s.environment})</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.servers!];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={s.host}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].host = e.target.value;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="px-2 py-1 bg-[#0e131b] border border-[#232e3d] rounded text-white"
                      />
                      <input
                        type="number"
                        value={s.port}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].port = parseInt(e.target.value) || 22;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="px-2 py-1 bg-[#0e131b] border border-[#232e3d] rounded text-white"
                      />
                      <input
                        type="text"
                        value={s.username}
                        onChange={e => {
                          const updated = [...formData.servers!];
                          updated[idx].username = e.target.value;
                          setFormData({ ...formData, servers: updated });
                        }}
                        className="px-2 py-1 bg-[#0e131b] border border-[#232e3d] rounded text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: AI Config */}
            {activeTab === 'ai' && (
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e2633]">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">AI Model & Provider Configuration</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Configure model architecture, provider credentials, and token limits for this agent.</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    Tab 4 of 13
                  </span>
                </div>

                {/* Provider and Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">AI Provider</label>
                    <select
                      value={formData.aiConfig?.provider || 'gemini'}
                      onChange={e => {
                        const newProv = e.target.value as any;
                        const defModel = newProv === 'openai' ? 'gpt-4o' : newProv === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-1.5-flash';
                        setFormData({
                          ...formData,
                          aiConfig: { ...formData.aiConfig!, provider: newProv, model: defModel }
                        });
                      }}
                      className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white focus:border-blue-500"
                    >
                      <option value="gemini">Google Gemini (Recommended)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Model Name</label>
                    <select
                      value={formData.aiConfig?.model || ''}
                      onChange={e => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig!, model: e.target.value }
                      })}
                      className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white focus:border-blue-500"
                    >
                      {formData.aiConfig?.provider === 'openai' ? (
                        <>
                          <option value="gpt-4o">gpt-4o (Most capable)</option>
                          <option value="gpt-4o-mini">gpt-4o-mini (Lightweight & Fast)</option>
                          <option value="gpt-4-turbo">gpt-4-turbo</option>
                        </>
                      ) : formData.aiConfig?.provider === 'anthropic' ? (
                        <>
                          <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                          <option value="claude-3-haiku-20240307">claude-3-haiku-20240307</option>
                        </>
                      ) : (
                        <>
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & high quota)</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro (Deep reasoning)</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash (Experimental)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* API Key Override Box */}
                <div className="p-4 rounded-xl bg-[#141b26] border border-[#232e3d] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-200">
                      Agent API Key
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {(formData.aiConfig as any)?.apiKeyMasked
                        ? `Configured (${(formData.aiConfig as any).apiKeyMasked})`
                        : 'Inherits Global AI Hub Key if empty'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={(formData.aiConfig as any)?.apiKey || ''}
                      onChange={e => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig!, apiKey: e.target.value } as any
                      })}
                      placeholder={
                        (formData.aiConfig as any)?.apiKeyMasked
                          ? 'Leave empty to keep existing key, or enter new key...'
                          : 'Leave empty to use Global AI Hub Key, or enter custom key...'
                      }
                      className="w-full pl-3.5 pr-10 py-2 bg-[#0e131b] border border-[#232e3d] rounded-xl text-xs text-white placeholder-slate-600 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleTestAiConnection}
                      disabled={aiTesting}
                      className="py-1.5 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      {aiTesting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          <span>Testing connection...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Test Connection</span>
                        </>
                      )}
                    </button>

                    {aiTestResult && (
                      <div className={`text-xs flex items-center gap-1.5 font-medium ${aiTestResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                        {aiTestResult.success ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{aiTestResult.message} ({aiTestResult.latencyMs}ms)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{aiTestResult.message}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Parameters: Temperature & Max Tokens */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#141b26] border border-[#232e3d]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">Temperature</label>
                      <span className="text-xs font-mono text-blue-400">{formData.aiConfig?.temperature ?? 0.2}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={formData.aiConfig?.temperature ?? 0.2}
                      onChange={e => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig!, temperature: parseFloat(e.target.value) }
                      })}
                      className="w-full accent-blue-600 bg-[#161d27]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>0.0 (Deterministic)</span>
                      <span>1.0 (Creative)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Max Output Tokens</label>
                    <input
                      type="number"
                      min="512"
                      max="8192"
                      step="256"
                      value={formData.aiConfig?.maxTokens || 4096}
                      onChange={e => setFormData({
                        ...formData,
                        aiConfig: { ...formData.aiConfig!, maxTokens: parseInt(e.target.value) || 4096 }
                      })}
                      className="w-full px-3.5 py-2 bg-[#0e131b] border border-[#232e3d] rounded-xl text-xs text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Fallback Model */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fallback Model (Optional)</label>
                  <input
                    type="text"
                    value={formData.aiConfig?.fallbackModel || ''}
                    placeholder="e.g. gemini-1.5-flash or gpt-4o-mini"
                    onChange={e => setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig!, fallbackModel: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: Instructions */}
            {activeTab === 'instructions' && (
              <div className="space-y-4 max-w-2xl">
                <h4 className="text-sm font-semibold text-slate-200">Agent Instructions & Architecture Rules</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">System Instructions</label>
                  <textarea
                    rows={4}
                    value={formData.instruction?.systemInstructions || ''}
                    onChange={e => setFormData({
                      ...formData,
                      instruction: { ...formData.instruction!, systemInstructions: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tech Stack</label>
                  <input
                    type="text"
                    value={formData.instruction?.technologyStack || ''}
                    onChange={e => setFormData({
                      ...formData,
                      instruction: { ...formData.instruction!, technologyStack: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 bg-[#161d27] border border-[#232e3d] rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 6: Environment */}
            {activeTab === 'environment' && (
              <div className="space-y-3 max-w-2xl">
                <h4 className="text-sm font-semibold text-slate-200">Environment Variables</h4>
                <p className="text-xs text-slate-400">Values are masked and encrypted upon storage.</p>
                {formData.environmentVariables?.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#141b25] border border-[#232e3d] rounded-lg text-xs font-mono">
                    <span className="text-blue-400 font-bold">{ev.key}</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-slate-400 truncate flex-1">••••••••••••</span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: Tools & Permissions */}
            {activeTab === 'permissions' && (
              <div className="space-y-3 max-w-2xl">
                <h4 className="text-sm font-semibold text-slate-200">Tools & Permissions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData.permission || {}).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 p-2 bg-[#141b25] border border-[#232e3d] rounded-lg text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={e => setFormData({
                          ...formData,
                          permission: { ...formData.permission!, [key]: e.target.checked }
                        })}
                      />
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 8: Execution */}
            {activeTab === 'execution' && (
              <div className="space-y-4 max-w-2xl">
                <h4 className="text-sm font-semibold text-slate-200">Execution Approvals</h4>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2">
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
                  <label className="flex items-center gap-2">
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
                  <label className="flex items-center gap-2">
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
                  <label className="flex items-center gap-2">
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

            {/* TAB 9: Testing */}
            {activeTab === 'testing' && (
              <div className="space-y-4 max-w-2xl font-mono text-xs">
                <h4 className="text-sm font-sans font-semibold text-slate-200">Automated Testing Commands</h4>
                <div>
                  <label className="block text-slate-400 mb-1">Test Command</label>
                  <input
                    type="text"
                    value={formData.testingConfig?.testCommand || ''}
                    onChange={e => setFormData({
                      ...formData,
                      testingConfig: { ...formData.testingConfig!, testCommand: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-[#161d27] border border-[#232e3d] rounded-lg text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Build Command</label>
                  <input
                    type="text"
                    value={formData.testingConfig?.buildCommand || ''}
                    onChange={e => setFormData({
                      ...formData,
                      testingConfig: { ...formData.testingConfig!, buildCommand: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-[#161d27] border border-[#232e3d] rounded-lg text-blue-400"
                  />
                </div>
              </div>
            )}

            {/* TAB 10: Deployment */}
            {activeTab === 'deployment' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <h4 className="text-sm font-semibold text-slate-200">Deployment Pipeline</h4>
                <div>
                  <label className="block text-slate-400 mb-1">Deployment Command</label>
                  <input
                    type="text"
                    value={formData.deploymentConfig?.deploymentCommand || ''}
                    onChange={e => setFormData({
                      ...formData,
                      deploymentConfig: { ...formData.deploymentConfig!, deploymentCommand: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-[#161d27] border border-[#232e3d] rounded-lg text-purple-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Health Check URL</label>
                  <input
                    type="text"
                    value={formData.deploymentConfig?.healthCheckUrl || ''}
                    onChange={e => setFormData({
                      ...formData,
                      deploymentConfig: { ...formData.deploymentConfig!, healthCheckUrl: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-[#161d27] border border-[#232e3d] rounded-lg text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 11: Webhooks */}
            {activeTab === 'webhooks' && (
              <div className="space-y-3 max-w-2xl text-xs">
                <h4 className="text-sm font-semibold text-slate-200">Webhooks</h4>
                {formData.webhooks?.map((wh, idx) => (
                  <div key={idx} className="p-3 bg-[#141b25] border border-[#232e3d] rounded-lg">
                    <span className="font-bold text-slate-300">{wh.webhookType}</span>: {wh.url}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 12: Security */}
            {activeTab === 'security' && (
              <div className="space-y-4 max-w-2xl text-xs">
                <h4 className="text-sm font-semibold text-slate-200">Security Sandbox</h4>
                <div>
                  <label className="block text-slate-400 mb-1">Allowed Commands</label>
                  <input
                    type="text"
                    value={formData.securityConfig?.allowedCommands || ''}
                    onChange={e => setFormData({
                      ...formData,
                      securityConfig: { ...formData.securityConfig!, allowedCommands: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-[#161d27] border border-[#232e3d] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Blocked Commands</label>
                  <input
                    type="text"
                    value={formData.securityConfig?.blockedCommands || ''}
                    onChange={e => setFormData({
                      ...formData,
                      securityConfig: { ...formData.securityConfig!, blockedCommands: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 bg-[#161d27] border border-[#232e3d] rounded-lg text-red-400 font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB 13: History */}
            {activeTab === 'history' && (
              <div className="space-y-3 text-xs">
                <h4 className="text-sm font-semibold text-slate-200">Agent Execution History</h4>
                {loadingHistory ? (
                  <p className="text-slate-400">Loading history...</p>
                ) : history.length === 0 ? (
                  <p className="text-slate-500">No executions recorded yet.</p>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="p-3 bg-[#141b25] border border-[#232e3d] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{h.status}</span>
                          <span className="text-slate-500 font-mono">{new Date(h.startedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-300 mt-1">"{h.prompt}"</p>
                      </div>
                      <div className="text-right font-mono text-emerald-400">
                        {h.commitHash || 'N/A'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#232e3d] bg-[#161f2c] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
          >
            Reset
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveChanges}
              className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

