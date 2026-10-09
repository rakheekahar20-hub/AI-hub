import React, { useState } from 'react';
import { AgentExecution, ExecutionStep } from '../../types/index.js';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  FileCode,
  GitCommit,
  Rocket,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Terminal,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ExecutionStatusCardProps {
  execution: AgentExecution;
  onApprove: (id: string, options?: any) => void;
  onReject: (id: string, options?: any) => void;
  onOpenFileReview: () => void;
  onOpenLogs: () => void;
}

export const ExecutionStatusCard: React.FC<ExecutionStatusCardProps> = ({
  execution,
  onApprove,
  onReject,
  onOpenFileReview,
  onOpenLogs
}) => {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'steps' | 'tests' | 'deploy'>('steps');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Execution Succeeded
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            Running Pipeline...
          </span>
        );
      case 'WAITING_FOR_APPROVAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-bounce">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Waiting for Approval
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Execution Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1.5">
            Cancelled by Reviewer
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'IN_PROGRESS':
        return <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />;
      case 'WAITING_APPROVAL':
        return <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      default:
        return <div className="w-3 h-3 rounded-full border border-slate-600 flex-shrink-0 ml-0.5" />;
    }
  };

  const waitingForPlan = execution.steps?.some(s => s.stepNumber === 5 && s.status === 'WAITING_APPROVAL');
  const fileChangesCount = execution.fileChanges?.length || 0;

  return (
    <div className="my-4 rounded-2xl bg-[#141b26] border border-[#232e3d] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#232e3d] flex items-center justify-between bg-[#17202d]/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">Execution Pipeline</span>
              {execution.isDemo && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase">
                  Demo Simulated
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 truncate max-w-sm block">
              Prompt: "{execution.prompt}"
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {getStatusBadge(execution.status)}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#202c3e] transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Waiting for Approval Action Banner */}
          {execution.status === 'WAITING_FOR_APPROVAL' && (
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    {waitingForPlan ? 'Implementation Plan Review Required' : 'File Modifications Review Required'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {waitingForPlan
                      ? 'The agent formulated a plan. Review the steps below and click Approve to apply changes.'
                      : `${fileChangesCount} file changes generated and verified. Approve to commit and deploy.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!waitingForPlan && (
                  <button
                    onClick={onOpenFileReview}
                    className="py-1.5 px-3 rounded-xl bg-[#1c2635] hover:bg-[#253246] text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    Review Diff
                  </button>
                )}

                <button
                  onClick={() => onApprove(execution.id, { approveAll: true })}
                  className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve & Proceed
                </button>

                <button
                  onClick={() => onReject(execution.id, { reason: 'User declined from chat' })}
                  className="py-1.5 px-3 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-medium transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Sub tabs: Steps | Test Results | Deployment */}
          <div className="px-4 pt-3 flex items-center gap-3 border-b border-[#232e3d] text-xs">
            <button
              onClick={() => setActiveTab('steps')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'steps'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Steps & Progress ({execution.steps?.filter(s => s.status === 'COMPLETED').length || 0}/9)
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'tests'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Test & Build Output
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`pb-2.5 font-medium transition-colors border-b-2 ${
                activeTab === 'deploy'
                  ? 'border-blue-500 text-blue-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Deployment & Health
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'steps' && (
              <div className="space-y-2.5">
                {execution.steps?.map((step) => (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                      step.status === 'IN_PROGRESS'
                        ? 'bg-blue-600/10 border-blue-500/30'
                        : step.status === 'WAITING_APPROVAL'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : step.status === 'COMPLETED'
                        ? 'bg-[#18212e]/60 border-[#232e3d]'
                        : 'bg-[#111721] border-[#1c2432] opacity-60'
                    }`}
                  >
                    <div className="mt-0.5">{getStepIcon(step.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {step.stepNumber}. {step.title}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                          {step.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                      {step.output && (
                        <div className="mt-1.5 p-2 rounded-lg bg-[#0e131b] border border-[#1e2633] text-[10px] font-mono text-slate-300">
                          {step.output}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] font-sans font-semibold block mb-1">
                    Automated Test Results:
                  </span>
                  <pre className="p-3 rounded-xl bg-[#0e131b] border border-[#1e2633] text-emerald-400 overflow-x-auto text-[11px]">
                    {execution.testOutput || 'No test output recorded yet.'}
                  </pre>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-sans font-semibold block mb-1">
                    Build Artifact Output:
                  </span>
                  <pre className="p-3 rounded-xl bg-[#0e131b] border border-[#1e2633] text-blue-300 overflow-x-auto text-[11px]">
                    {execution.buildOutput || 'Build output will appear when compilation completes.'}
                  </pre>
                </div>

                {execution.lintOutput && (
                  <div>
                    <span className="text-slate-400 text-[11px] font-sans font-semibold block mb-1">
                      Linter & Typecheck:
                    </span>
                    <pre className="p-2.5 rounded-xl bg-[#0e131b] border border-[#1e2633] text-slate-300 text-[11px]">
                      {execution.lintOutput}
                      {'\n'}
                      {execution.typecheckOutput}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deploy' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#0e131b] border border-[#1e2633]">
                    <span className="text-[11px] text-slate-400 block mb-1">Git Commit Hash</span>
                    <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5" />
                      {execution.commitHash || 'Pending commit'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0e131b] border border-[#1e2633]">
                    <span className="text-[11px] text-slate-400 block mb-1">Health Probe Check</span>
                    <span className={`font-semibold flex items-center gap-1.5 ${
                      execution.healthCheckStatus === 'healthy' ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      <Rocket className="w-3.5 h-3.5" />
                      {execution.healthCheckStatus || 'not_configured'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-semibold block mb-1">
                    Deployment Output Stream:
                  </span>
                  <pre className="p-3 rounded-xl bg-[#0e131b] border border-[#1e2633] font-mono text-[11px] text-purple-300 overflow-x-auto whitespace-pre-wrap">
                    {execution.deploymentOutput || 'Deployment logs will populate after commit and push.'}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quick Footer bar */}
          <div className="px-4 py-2.5 bg-[#101620] border-t border-[#232e3d] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              {fileChangesCount > 0 && (
                <span className="flex items-center gap-1 text-slate-300">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  {fileChangesCount} files changed
                </span>
              )}
              {execution.commitHash && (
                <span className="flex items-center gap-1 font-mono text-emerald-400">
                  <GitCommit className="w-3.5 h-3.5" />
                  {execution.commitHash}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLogs}
                className="py-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a2330] transition-colors flex items-center gap-1 text-[11px]"
              >
                <Terminal className="w-3 h-3 text-emerald-400" />
                Live Logs
              </button>

              {fileChangesCount > 0 && (
                <button
                  onClick={onOpenFileReview}
                  className="py-1 px-2.5 rounded-lg bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 border border-blue-500/20 transition-colors flex items-center gap-1 text-[11px] font-medium"
                >
                  <FileCode className="w-3 h-3" />
                  Review Diffs
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

