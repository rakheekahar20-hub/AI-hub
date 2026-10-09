import React, { useState } from 'react';
import { Agent } from '../../types/index.js';
import {
  Bot,
  Plus,
  GitBranch,
  Server,
  Rocket,
  MoreVertical,
  Play,
  Settings,
  RefreshCw,
  Copy,
  Trash2,
  Power,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cpu,
  Terminal,
  Code2,
  MessageSquare,
  X
} from 'lucide-react';

interface RightAgentSidebarProps {
  agents: Agent[];
  activeAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onNewChatWithAgent?: (agentId: string) => void;
  onOpenAddWizard: () => void;
  onEditAgent: (agent: Agent) => void;
  onOpenHistory: (agentId: string) => void;
  onOpenLogs: (agentId: string) => void;
  onQuickRun: (agent: Agent) => void;
  onDuplicateAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onSyncRepo: (agentId: string) => void;
  onToggleStatus: (agent: Agent) => void;
  onClose?: () => void;
}

export const RightAgentSidebar: React.FC<RightAgentSidebarProps> = ({
  agents,
  activeAgentId,
  onSelectAgent,
  onNewChatWithAgent,
  onOpenAddWizard,
  onEditAgent,
  onOpenHistory,
  onOpenLogs,
  onQuickRun,
  onDuplicateAgent,
  onDeleteAgent,
  onSyncRepo,
  onToggleStatus,
  onClose
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        );
      case 'EXECUTING':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            Executing
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Error
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Offline
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Idle
          </span>
        );
    }
  };

  const getAgentIcon = (icon: string) => {
    switch (icon) {
      case 'cpu': return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'server': return <Server className="w-4 h-4 text-amber-400" />;
      case 'terminal': return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'code': return <Code2 className="w-4 h-4 text-cyan-400" />;
      default: return <Bot className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <aside className="w-72 sm:w-80 max-w-[85vw] h-full flex flex-col bg-[#0b0e14] border-l border-[#1e2633] select-none shadow-2xl lg:shadow-none">
      {/* Top Header & + Add Agent */}
      <div className="p-4 border-b border-[#1e2633]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Connected Agents
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1c2432] text-slate-400 font-normal">
                {agents.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">Autonomous repository dispatchers</p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] lg:hidden transition-colors"
              title="Close Agents Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenAddWizard}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/15 transition-all"
        >
          <Plus className="w-4 h-4" />
          + Add Agent
        </button>
      </div>

      {/* Agents Card List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {agents.map((agent) => {
          const isSelected = agent.id === activeAgentId;
          const isDropdownOpen = openDropdownId === agent.id;

          const repoConfigured = agent.repository && agent.repository.repositoryUrl;
          const serversCount = agent.servers?.length || 0;
          const deployConfigured = Boolean(agent.deploymentConfig?.deploymentCommand);

          return (
            <div
              key={agent.id}
              className={`rounded-xl border transition-all duration-150 p-3 relative group ${
                isSelected
                  ? 'bg-[#151c27] border-blue-500/40 shadow-lg shadow-blue-950/20'
                  : 'bg-[#121822] border-[#1e2633] hover:border-[#2d3a4d] hover:bg-[#141b26]'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onClose?.();
                  }}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1a2332] border border-[#263346] flex items-center justify-center flex-shrink-0">
                    {getAgentIcon(agent.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-100 truncate block">
                        {agent.name}
                      </span>
                      {isSelected ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                          Active Chat
                        </span>
                      ) : agent.isDemo ? (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase">
                          Demo
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {agent.agentType}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdownId(isDropdownOpen ? null : agent.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#1e2736] transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Actions Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-6 w-48 bg-[#18212f] border border-[#2b384c] rounded-xl shadow-2xl py-1 z-50 text-xs">
                      <button
                        onClick={() => { onSelectAgent(agent.id); onClose?.(); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        Chat with Agent
                      </button>
                      {onNewChatWithAgent && (
                        <button
                          onClick={() => { onNewChatWithAgent(agent.id); onClose?.(); setOpenDropdownId(null); }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" />
                          Start New Chat
                        </button>
                      )}
                      <button
                        onClick={() => { onQuickRun(agent); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        Run Agent
                      </button>
                      <button
                        onClick={() => { onEditAgent(agent); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        Edit Configuration
                      </button>
                      <button
                        onClick={() => { onSyncRepo(agent.id); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                        Sync Repository
                      </button>
                      <button
                        onClick={() => { onOpenLogs(agent.id); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        View Live Logs
                      </button>
                      <button
                        onClick={() => { onOpenHistory(agent.id); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        Execution History
                      </button>
                      <button
                        onClick={() => { onDuplicateAgent(agent.id); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Duplicate Agent
                      </button>
                      <button
                        onClick={() => { onToggleStatus(agent); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-blue-600/20"
                      >
                        <Power className="w-3.5 h-3.5 text-yellow-400" />
                        {agent.status === 'ONLINE' ? 'Set Offline' : 'Set Online'}
                      </button>
                      <div className="border-t border-[#263346] my-1" />
                      <button
                        onClick={() => { onDeleteAgent(agent.id); setOpenDropdownId(null); }}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-red-400 hover:bg-red-500/15"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Agent
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status pill & environment */}
              <div className="flex items-center justify-between mb-2.5">
                {getStatusBadge(agent.status)}
                <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-[#18212e] border border-[#222d3e]">
                  env: {agent.environment}
                </span>
              </div>

              {/* Connection Specs */}
              <div className="space-y-1.5 text-[11px] pt-2 border-t border-[#1a2332]">
                {/* Git Status */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <GitBranch className="w-3 h-3 text-slate-400" />
                    Git:
                  </span>
                  {repoConfigured ? (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {agent.repository?.branch || 'main'}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">Not configured</span>
                  )}
                </div>

                {/* Server Status */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Server className="w-3 h-3 text-slate-400" />
                    Servers:
                  </span>
                  {serversCount > 0 ? (
                    <span className="text-blue-400 text-[10px]">
                      {serversCount} connected ({agent.environment})
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">Not configured</span>
                  )}
                </div>

                {/* Deployment Status */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Rocket className="w-3 h-3 text-slate-400" />
                    Deploy:
                  </span>
                  {deployConfigured ? (
                    <span className="text-purple-400 text-[10px] capitalize">
                      {agent.deploymentConfig?.strategy || 'approval'}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">Not configured</span>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action Bar */}
              <div className="mt-3 pt-2.5 border-t border-[#1a2332] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => {
                    onSelectAgent(agent.id);
                    onClose?.();
                  }}
                  className={`text-[11px] font-semibold py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 flex-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-1 ring-blue-400'
                      : 'bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-transparent'
                  }`}
                  title={`Select and chat with ${agent.name}`}
                >
                  <MessageSquare className="w-3 h-3" />
                  {isSelected ? 'Chatting' : 'Chat'}
                </button>

                <button
                  onClick={() => onEditAgent(agent)}
                  className="text-[11px] font-medium py-1.5 px-2.5 rounded-lg bg-[#18212f] text-slate-300 hover:bg-[#202c3e] hover:text-white transition-colors flex items-center gap-1"
                  title="Configure agent settings"
                >
                  <Settings className="w-3 h-3 text-slate-400" />
                  Edit
                </button>

                <button
                  onClick={() => onQuickRun(agent)}
                  className="text-[11px] font-medium py-1.5 px-2.5 rounded-lg bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25 border border-emerald-500/20 transition-colors flex items-center gap-1"
                  title="Run execution pipeline"
                >
                  <Bot className="w-3 h-3" />
                  Run
                </button>
              </div>
            </div>
          );
        })}

        {agents.length === 0 && (
          <div className="text-center py-12 px-4 border border-dashed border-[#1e2633] rounded-2xl">
            <Bot className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No agents yet</p>
            <p className="text-[11px] text-slate-500 mt-1 mb-3">Create your first AI coding agent to connect repositories.</p>
            <button
              onClick={onOpenAddWizard}
              className="text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
            >
              + Add Agent
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

