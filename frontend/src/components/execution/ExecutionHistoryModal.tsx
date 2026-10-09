import React, { useState, useEffect } from 'react';
import { AgentExecution } from '../../types/index.js';
import { agentService } from '../../services/agentService.js';
import {
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  FileCode,
  GitCommit,
  Rocket,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId?: string | null;
  agentName?: string;
  onSelectExecution?: (execution: AgentExecution) => void;
}

export const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  isOpen,
  onClose,
  agentId,
  agentName,
  onSelectExecution
}) => {
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && agentId) {
      setLoading(true);
      agentService.getAgentExecutions(agentId)
        .then(setExecutions)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, agentId]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Completed</span>;
      case 'RUNNING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">Running</span>;
      case 'WAITING_FOR_APPROVAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Needs Approval</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">Failed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[80vh] bg-[#121822] border border-[#232e3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#232e3d] flex items-center justify-between bg-[#161f2c]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Execution History
                {agentName && <span className="text-xs text-blue-400 font-normal">({agentName})</span>}
              </h3>
              <p className="text-[11px] text-slate-400">
                Audit trail of previous runs, file modifications, test verdicts, and deployments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#202c3e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Loading execution history...
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No previous executions recorded for this agent yet.
            </div>
          ) : (
            executions.map((exec) => (
              <div
                key={exec.id}
                className="p-4 rounded-xl border border-[#232e3d] bg-[#151c27] hover:border-slate-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(exec.status)}
                    {exec.isDemo && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Demo
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(exec.startedAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 truncate">
                    "{exec.prompt}"
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-slate-300">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      {exec.fileChanges?.length || 0} files
                    </span>

                    {exec.commitHash && (
                      <span className="flex items-center gap-1 font-mono text-emerald-400">
                        <GitCommit className="w-3.5 h-3.5" />
                        {exec.commitHash}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Rocket className="w-3.5 h-3.5 text-purple-400" />
                      Deploy: {exec.healthCheckStatus || 'N/A'}
                    </span>
                  </div>

                  {exec.errorMessage && (
                    <p className="text-xs text-red-400 mt-1">
                      Error: {exec.errorMessage}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {onSelectExecution && (
                    <button
                      onClick={() => {
                        onSelectExecution(exec);
                        onClose();
                      }}
                      className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

