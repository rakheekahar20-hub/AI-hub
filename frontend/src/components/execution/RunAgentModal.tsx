import React, { useState } from 'react';
import { Agent } from '../../types/index.js';
import { Bot, Play, X, Sparkles, Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface RunAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onDispatch: (prompt: string) => void;
}

export const RunAgentModal: React.FC<RunAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onDispatch
}) => {
  const [customPrompt, setCustomPrompt] = useState('');

  if (!isOpen || !agent) return null;

  const presets = [
    'Run build, tests, and quality verification',
    'Add JWT authentication and session validation',
    'Analyze codebase architecture and dependencies',
    'Run security vulnerability and secret leak audit',
    'Check Git repository status and sync branch'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onDispatch(customPrompt.trim());
    setCustomPrompt('');
    onClose();
  };

  const handleSelectPreset = (preset: string) => {
    onDispatch(preset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141b25] border border-[#232e3d] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#232e3d] bg-[#18212e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Run Agent: <span className="text-emerald-400">{agent.name}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Specify what task or changes you want this agent to execute
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Task Prompt / Instruction:
            </label>
            <textarea
              rows={3}
              required
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Implement user registration endpoint with password hashing and tests..."
              className="w-full px-3.5 py-2.5 bg-[#0e131b] border border-[#232e3d] focus:border-emerald-500 focus:outline-none rounded-xl text-xs text-white placeholder-slate-500 transition-colors"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Or pick a quick action:
            </span>
            <div className="space-y-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="w-full text-left p-2 rounded-lg bg-[#0e131b] hover:bg-[#1b2533] border border-[#232e3d] text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <Play className="w-3 h-3 text-emerald-400 opacity-60 group-hover:opacity-100" />
                  <span className="truncate">{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#232e3d]">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!customPrompt.trim()}
              className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Dispatch Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

