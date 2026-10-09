import React, { useState, useEffect, useRef } from 'react';
import { AgentExecutionLog } from '../../types/index.js';
import {
  Terminal,
  X,
  Filter,
  ArrowDown,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle
} from 'lucide-react';

interface LiveLogsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AgentExecutionLog[];
  executionId?: string | null;
  agentName?: string;
}

export const LiveLogsPanel: React.FC<LiveLogsPanelProps> = ({
  isOpen,
  onClose,
  logs,
  executionId,
  agentName
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (levelFilter === 'all') return true;
    return log.level === levelFilter;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> SUCCESS</span>;
      case 'warn':
        return <span className="text-amber-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</span>;
      case 'error':
        return <span className="text-red-400 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> ERROR</span>;
      default:
        return <span className="text-blue-400 font-bold flex items-center gap-1"><Info className="w-3 h-3" /> INFO</span>;
    }
  };

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] [${l.stepName}] ${l.message} ${l.details ? '\n' + l.details : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[88vh] sm:h-[80vh] bg-[#0d121a] border border-[#232e3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-[#232e3d] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-[#131a24]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2 truncate">
                Live Execution Logs
                {agentName && <span className="text-xs text-blue-400 font-normal truncate">({agentName})</span>}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                Real-time pipeline telemetry and runner outputs
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="py-1 px-2 sm:px-2.5 bg-[#1a2332] border border-[#2b394d] rounded-lg text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warn">Warnings</option>
              <option value="error">Errors</option>
            </select>

            <button
              onClick={handleCopyLogs}
              className="py-1 px-2 sm:px-2.5 rounded-lg bg-[#1a2332] hover:bg-[#233044] text-slate-300 text-xs font-medium border border-[#2b394d] transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`py-1 px-2 sm:px-2.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                autoScroll
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-[#1a2332] border-[#2b394d] text-slate-400'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Auto-scroll</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs select-text bg-[#090d13]">
          {filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className="py-1 px-2 rounded hover:bg-[#121924] transition-colors flex flex-col group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-slate-500 text-[11px] select-none flex-shrink-0">
                    [{timeStr}]
                  </span>

                  <span className="text-[10px] uppercase font-bold flex-shrink-0 w-16">
                    {getLevelBadge(log.level)}
                  </span>

                  <span className="text-blue-400 text-[11px] font-semibold flex-shrink-0 max-w-[120px] truncate">
                    [{log.stepName}]
                  </span>

                  <span className="text-slate-200 flex-1 leading-5">
                    {log.message}
                  </span>

                  {log.details && (
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-[10px] text-slate-400 hover:text-white underline ml-2 flex-shrink-0"
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                  )}
                </div>

                {/* Expandable details if present */}
                {log.details && isExpanded && (
                  <pre className="mt-2 ml-12 p-3 rounded-lg bg-[#141b25] border border-[#232e3d] text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {log.details}
                  </pre>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              No log messages available for current filter.
            </div>
          )}

          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

