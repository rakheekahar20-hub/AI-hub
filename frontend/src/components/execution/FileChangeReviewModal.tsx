import React, { useState } from 'react';
import { AgentFileChange } from '../../types/index.js';
import {
  FileCode,
  CheckCircle2,
  XCircle,
  CheckCheck,
  X,
  FilePlus,
  FileEdit,
  FileMinus,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface FileChangeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileChanges: AgentFileChange[];
  onApproveFile: (fileId: string) => void;
  onRejectFile: (fileId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
}

export const FileChangeReviewModal: React.FC<FileChangeReviewModalProps> = ({
  isOpen,
  onClose,
  fileChanges,
  onApproveFile,
  onRejectFile,
  onApproveAll,
  onRejectAll
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(
    fileChanges[0]?.id || ''
  );

  if (!isOpen) return null;

  const currentFile = fileChanges.find(f => f.id === selectedFileId) || fileChanges[0];

  const getFileIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <FilePlus className="w-4 h-4 text-emerald-400" />;
      case 'deleted':
        return <FileMinus className="w-4 h-4 text-red-400" />;
      default:
        return <FileEdit className="w-4 h-4 text-blue-400" />;
    }
  };

  const renderDiffLine = (line: string, index: number) => {
    let bg = '';
    let text = 'text-slate-300';
    let prefix = ' ';

    if (line.startsWith('+') && !line.startsWith('+++')) {
      bg = 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 pl-2';
      prefix = '+';
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      bg = 'bg-red-950/40 text-red-300 border-l-2 border-red-500 pl-2';
      prefix = '-';
    } else if (line.startsWith('@@')) {
      bg = 'bg-blue-950/30 text-blue-400 font-bold';
    }

    return (
      <div key={index} className={`font-mono text-xs py-0.5 px-3 leading-5 ${bg}`}>
        <span className="select-none text-slate-600 mr-4 inline-block w-8 text-right font-mono text-[10px]">
          {index + 1}
        </span>
        <span className="whitespace-pre">{line}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[85vh] bg-[#121822] border border-[#232e3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#232e3d] flex items-center justify-between bg-[#161f2c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  File Change Review Panel
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  {fileChanges.length} Files Modified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review code diffs line by line before approving changes into the repository
              </p>
            </div>
          </div>

          {/* Top Actions: Approve All / Reject All / Close */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onApproveAll}
              className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-colors flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              Approve All
            </button>

            <button
              onClick={onRejectAll}
              className="py-1.5 px-3 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Reject All
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#202c3e] transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Left file list + Right diff viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* File list sidebar */}
          <div className="w-80 border-r border-[#232e3d] bg-[#0e131b] overflow-y-auto p-3 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
              Changed Files
            </div>

            {fileChanges.map((file) => {
              const isSelected = (currentFile?.id === file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1a2332] border-blue-500/40 text-white'
                      : 'bg-[#121822] border-[#1e2633] text-slate-300 hover:bg-[#161f2c]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileIcon(file.changeType)}
                    <div className="min-w-0">
                      <span className="font-mono text-xs truncate block font-medium">
                        {file.filePath}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] mt-0.5">
                        <span className="text-emerald-400 font-mono">+{file.additions}</span>
                        <span className="text-red-400 font-mono">-{file.deletions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status icon */}
                  <div>
                    {file.approvalStatus === 'APPROVED' && (
                      <span className="p-1 rounded-md text-emerald-400 bg-emerald-500/10" title="Approved">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    {file.approvalStatus === 'REJECTED' && (
                      <span className="p-1 rounded-md text-red-400 bg-red-500/10" title="Rejected">
                        <XCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {fileChanges.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No file changes pending review.
              </div>
            )}
          </div>

          {/* Right Diff Viewer */}
          <div className="flex-1 flex flex-col bg-[#0b0e14] overflow-hidden">
            {currentFile ? (
              <>
                {/* File Sub-header */}
                <div className="p-3 border-b border-[#232e3d] bg-[#141b25] flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-200">
                    <span className="px-2 py-0.5 rounded bg-[#1e2736] text-blue-400 text-[11px]">
                      {currentFile.changeType.toUpperCase()}
                    </span>
                    <span className="font-semibold">{currentFile.filePath}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400">+{currentFile.additions}</span>
                    <span className="text-red-400">-{currentFile.deletions}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onApproveFile(currentFile.id)}
                      className={`py-1 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        currentFile.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {currentFile.approvalStatus === 'APPROVED' ? 'Approved' : 'Approve'}
                    </button>

                    <button
                      onClick={() => onRejectFile(currentFile.id)}
                      className={`py-1 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        currentFile.approvalStatus === 'REJECTED'
                          ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                          : 'bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-500/30'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {currentFile.approvalStatus === 'REJECTED' ? 'Rejected' : 'Reject'}
                    </button>
                  </div>
                </div>

                {/* Diff Viewer Area */}
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs select-text">
                  {currentFile.diff ? (
                    currentFile.diff.split('\n').map((line, idx) => renderDiffLine(line, idx))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No unified diff available for this file.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                Select a file to review changes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

