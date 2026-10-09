import React, { useState } from 'react';
import { Conversation } from '../../types/index.js';
import { useAuth } from '../../hooks/useAuth.js';
import {
  Terminal,
  MessageSquare,
  Search,
  Plus,
  Settings,
  LogOut,
  User as UserIcon,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  X,
  Trash2
} from 'lucide-react';

interface LeftSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
  onDeleteConversation?: (id: string, e: React.MouseEvent) => void;
  onClose?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onOpenSettings,
  onDeleteConversation,
  onClose
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Group conversations by Today, Yesterday, Previous
  const filtered = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.agent?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;

  const todayList: Conversation[] = [];
  const yesterdayList: Conversation[] = [];
  const previousList: Conversation[] = [];

  filtered.forEach(c => {
    const time = new Date(c.updatedAt).getTime();
    if (time >= todayStart) {
      todayList.push(c);
    } else if (time >= yesterdayStart) {
      yesterdayList.push(c);
    } else {
      previousList.push(c);
    }
  });

  const renderConversationItem = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const lastMsg = conv.messages?.[0]?.content || 'Empty conversation';

    return (
      <div
        key={conv.id}
        className={`w-full group/item relative flex items-center rounded-xl transition-all duration-150 ${
          isActive
            ? 'bg-blue-600/15 border border-blue-500/30 text-slate-100 shadow-sm'
            : 'hover:bg-[#161d27] border border-transparent text-slate-400 hover:text-slate-200'
        }`}
      >
        <button
          onClick={() => {
            onSelectConversation(conv.id);
            onClose?.();
          }}
          className="flex-1 min-w-0 text-left px-3 py-2.5 flex items-center gap-3"
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-[#1a2332] text-slate-500 group-hover/item:text-slate-300'
          }`}>
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate block text-slate-200">
                {conv.title}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 truncate block mt-0.5">
              {conv.agent?.name || 'AI Agent'} • {lastMsg}
            </span>
          </div>
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mr-1" />
          )}
        </button>

        {onDeleteConversation && (
          <button
            type="button"
            onClick={(e) => onDeleteConversation(conv.id, e)}
            className="opacity-70 sm:opacity-0 sm:group-hover/item:opacity-100 p-1.5 mr-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition-all flex-shrink-0 focus:opacity-100"
            title="Delete conversation"
            aria-label="Delete conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="w-72 sm:w-80 max-w-[85vw] h-full flex flex-col bg-[#0b0e14] border-r border-[#1e2633] select-none shadow-2xl md:shadow-none">
      {/* Brand & New Chat */}
      <div className="p-4 border-b border-[#1e2633]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-sm">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                AI Hub
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold uppercase">PRO</span>
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">Agent Platform</span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] md:hidden transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/15 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#121822] border border-[#1e2633] focus:border-blue-500/50 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Conversation Groups (Today / Yesterday / Previous) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {todayList.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-600" />
              Today
            </div>
            <div className="space-y-1">
              {todayList.map(renderConversationItem)}
            </div>
          </div>
        )}

        {yesterdayList.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-slate-600" />
              Yesterday
            </div>
            <div className="space-y-1">
              {yesterdayList.map(renderConversationItem)}
            </div>
          </div>
        )}

        {previousList.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-2 mb-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-600" />
              Previous
            </div>
            <div className="space-y-1">
              {previousList.map(renderConversationItem)}
            </div>
          </div>
        )}

        {todayList.length === 0 && yesterdayList.length === 0 && previousList.length === 0 && (
          <div className="text-center py-8 px-4 text-xs text-slate-500">
            {searchQuery ? 'No matching conversations.' : 'No conversations yet. Start a new one!'}
          </div>
        )}
      </div>

      {/* Bottom Profile / Settings / Logout */}
      <div className="p-3 border-t border-[#1e2633] bg-[#0c1017]">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#1e2633]">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-200 block truncate">
                {user?.name || 'Developer'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {user?.email || 'dev@aihub.local'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#1a2332]">
          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#141b26] hover:bg-[#1b2433] text-slate-300 hover:text-white text-xs transition-colors border border-[#1f2838]"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Settings
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#141b26] hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs transition-colors border border-[#1f2838]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

