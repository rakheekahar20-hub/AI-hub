import React, { useState, useRef, useEffect } from 'react';
import { Agent } from '../../types/index.js';
import {
  Bot,
  GitBranch,
  Server,
  Terminal,
  FileCode,
  Clock,
  Sparkles,
  KeyRound,
  Play,
  Menu,
  Users,
  MoreVertical,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

interface ChatHeaderProps {
  agent: Agent | null;
  agents?: Agent[];
  onSelectAgent?: (id: string) => void;
  onOpenLogs: () => void;
  onOpenFileReview: () => void;
  onOpenHistory: () => void;
  onRunAgent?: () => void;
  onOpenAISettings?: () => void;
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  agentsCount?: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agent,
  agents = [],
  onSelectAgent,
  onOpenLogs,
  onOpenFileReview,
  onOpenHistory,
  onRunAgent,
  onOpenAISettings,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  agentsCount
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false);
      }
    };
    if (isAgentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgentMenuOpen]);

  if (!agent) {
    return (
      <header className="h-16 border-b border-[#1e2633] bg-[#0e131b] px-3 sm:px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {onToggleLeftSidebar && (
            <button
              onClick={onToggleLeftSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] md:hidden transition-colors"
              title="Open Conversations"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="text-sm text-slate-400">Select an agent to begin</span>
        </div>

        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#161d27] hover:bg-[#1f2837] text-slate-300 text-xs font-medium border border-[#263346] lg:hidden transition-colors"
            title="Open Agents List"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Agents</span>
            {agentsCount !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                {agentsCount}
              </span>
            )}
          </button>
        )}
      </header>
    );
  }

  const isRepoConnected = agent.repository && agent.repository.repositoryUrl;
  const serversCount = agent.servers?.length || 0;

  return (
    <header className="h-16 border-b border-[#1e2633] bg-[#0e131b] px-3 sm:px-6 flex items-center justify-between select-none relative z-10">
      {/* Left: Mobile Drawer Trigger + Agent Avatar + Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleLeftSidebar && (
          <button
            onClick={onToggleLeftSidebar}
            className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] md:hidden transition-colors flex-shrink-0"
            title="Open Conversations Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Agent Switcher Button / Dropdown */}
        <div className="relative" ref={agentMenuRef}>
          <button
            type="button"
            onClick={() => setIsAgentMenuOpen(prev => !prev)}
            className="flex items-center gap-2 py-1 px-1.5 -ml-1 rounded-xl hover:bg-[#151c27] border border-transparent hover:border-[#232e3d] transition-all group cursor-pointer text-left"
            title="Click to Switch Agent"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[110px] sm:max-w-[200px] md:max-w-xs group-hover:text-blue-300 transition-colors">
                  {agent.name}
                </h1>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${isAgentMenuOpen ? 'rotate-180' : ''}`} />

                {agent.isDemo ? (
                  <span className="hidden sm:inline-flex text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    DEMO
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                    PROD
                  </span>
                )}

                <span className="hidden md:inline text-xs text-slate-500">•</span>
                <span className="hidden md:inline text-xs text-slate-400 font-medium truncate max-w-[120px]">
                  {agent.agentType}
                </span>
              </div>

              {/* Connection pills (Desktop only) */}
              <div className="hidden md:flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
                {/* Git repo */}
                <div className="flex items-center gap-1 font-mono text-[11px]">
                  <GitBranch className="w-3 h-3 text-slate-400" />
                  {isRepoConnected ? (
                    <span className="text-emerald-400 truncate max-w-[180px]">
                      {agent.repository?.repositoryOwner}/{agent.repository?.repositoryName}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">No repo</span>
                  )}
                </div>

                <span className="text-slate-600">|</span>

                {/* Server */}
                <div className="flex items-center gap-1 text-[11px]">
                  <Server className="w-3 h-3 text-slate-400" />
                  {serversCount > 0 ? (
                    <span className="text-blue-400 truncate max-w-[140px]">
                      {agent.servers![0].serverName}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic">No server</span>
                  )}
                </div>
              </div>
            </div>
          </button>

          {/* Agent Switcher Menu */}
          {isAgentMenuOpen && agents && agents.length > 0 && (
            <div className="absolute left-0 top-12 mt-1 w-72 sm:w-80 bg-[#0f141d] border border-[#232e3d] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 bg-[#141b26] border-b border-[#232e3d] flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  Select Agent to Chat
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">
                  {agents.length} available
                </span>
              </div>

              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {agents.map((a) => {
                  const isCurrent = a.id === agent.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        onSelectAgent?.(a.id);
                        setIsAgentMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        isCurrent
                          ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-sm'
                          : 'border-transparent hover:bg-[#161e2a] hover:border-[#232e3d] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isCurrent ? 'bg-blue-500/20 text-blue-400' : 'bg-[#182230] text-slate-400'
                        }`}>
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-100 truncate block">
                              {a.name}
                            </span>
                            {a.isDemo && (
                              <span className="text-[8px] px-1 rounded bg-amber-500/10 text-amber-400 font-mono">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {a.agentType}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-0.5 flex-shrink-0">
                          Chat →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Full actions on large screens (xl+) */}
        <div className="hidden xl:flex items-center gap-2">
          <button
            onClick={onOpenFileReview}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#161d27] hover:bg-[#1f2837] text-slate-300 hover:text-white text-xs font-medium border border-[#263346] transition-colors"
            title="Review Changed Files"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Review Changes</span>
          </button>

          <button
            onClick={onOpenLogs}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#161d27] hover:bg-[#1f2837] text-slate-300 hover:text-white text-xs font-medium border border-[#263346] transition-colors"
            title="Open Live Execution Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Logs</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#161d27] hover:bg-[#1f2837] text-slate-300 hover:text-white text-xs font-medium border border-[#263346] transition-colors"
            title="Execution History"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>History</span>
          </button>
        </div>

        {/* Compact action icons on medium screens (md to xl) */}
        <div className="hidden sm:flex xl:hidden items-center gap-1">
          <button
            onClick={onOpenFileReview}
            className="p-1.5 rounded-lg bg-[#161d27] hover:bg-[#1f2837] text-slate-300 hover:text-white border border-[#263346] transition-colors"
            title="Review Changed Files"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
          </button>

          <button
            onClick={onOpenLogs}
            className="p-1.5 rounded-lg bg-[#161d27] hover:bg-[#1f2837] text-slate-300 hover:text-white border border-[#263346] transition-colors"
            title="Live Logs"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <button
            onClick={onOpenHistory}
            className="p-1.5 rounded-lg bg-[#161d27] hover:bg-[#1f2837] text-slate-300 hover:text-white border border-[#263346] transition-colors"
            title="Execution History"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        {/* Global AI Keys Button (Always visible across all devices) */}
        {onOpenAISettings && (
          <button
            onClick={onOpenAISettings}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 hover:text-white text-xs font-medium border border-blue-500/30 transition-colors"
            title="Configure Global AI Hub Models & API Keys"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">AI Keys</span>
          </button>
        )}

        {/* Run Pipeline Button (Always visible) */}
        {onRunAgent && (
          <button
            onClick={onRunAgent}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
            title="Launch Automated Pipeline (Build, Test, Diff, Deploy)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Run</span>
          </button>
        )}

        {/* Mobile Overflow Menu Button (< sm screens) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-1.5 rounded-lg bg-[#161d27] text-slate-300 border border-[#263346] transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMobileMenu && (
            <div className="absolute right-0 top-10 w-44 bg-[#121822] border border-[#263346] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onOpenFileReview();
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-[#1a2332] flex items-center gap-2"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Review Changes
              </button>
              <button
                onClick={() => {
                  onOpenLogs();
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-[#1a2332] flex items-center gap-2"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Live Logs
              </button>
              <button
                onClick={() => {
                  onOpenHistory();
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-[#1a2332] flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Execution History
              </button>
            </div>
          )}
        </div>

        {/* Mobile Right Drawer Button (Agents List - < lg screens) */}
        {onToggleRightSidebar && (
          <button
            onClick={onToggleRightSidebar}
            className="flex items-center gap-1.5 p-1.5 sm:py-1.5 sm:px-2.5 rounded-xl bg-[#161d27] hover:bg-[#1f2837] text-slate-300 border border-[#263346] lg:hidden transition-colors"
            title="Open Connected Agents List"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline text-xs font-medium">Agents</span>
            {agentsCount !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                {agentsCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
