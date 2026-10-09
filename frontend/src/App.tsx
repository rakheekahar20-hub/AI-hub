import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { WorkspaceLayout } from './layouts/WorkspaceLayout.js';
import { Terminal } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 animate-pulse">
          <Terminal className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          Initializing AI Hub Workspace...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <WorkspaceLayout />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

