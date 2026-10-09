export const ActionBar: React.FC<ActionBarProps> = ({ onExecute, onCancel, isBusy }) => {
  return (
    <div className="flex items-center gap-3 py-2 px-4 border-t border-slate-800 bg-slate-900/60">
      <button onClick={onExecute} disabled={isBusy} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm font-medium transition-colors">
        {isBusy ? 'Processing...' : 'Execute Changes'}
      </button>
      <button onClick={onCancel} className="px-3 py-2 border border-slate-700 hover:bg-slate-800 rounded text-sm text-slate-300">Cancel</button>
    </div>
  );
};