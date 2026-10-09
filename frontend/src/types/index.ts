export * from '../../../shared/types/index.js';

export interface UIState {
  activeAgentId: string | null;
  activeConversationId: string | null;
  isAddAgentOpen: boolean;
  isSettingsOpen: boolean;
  editingAgentId: string | null;
  isFileReviewOpen: boolean;
  isLiveLogsOpen: boolean;
  isHistoryOpen: boolean;
  activeExecutionId: string | null;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

