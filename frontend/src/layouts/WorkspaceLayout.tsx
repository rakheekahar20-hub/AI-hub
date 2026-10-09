import React, { useState, useEffect, useRef } from 'react';
import { Agent, Conversation, Message, AgentExecution, AgentFileChange, AgentExecutionLog } from '../types/index.js';
import { LeftSidebar } from '../components/sidebar/LeftSidebar.js';
import { RightAgentSidebar } from '../components/sidebar/RightAgentSidebar.js';
import { ChatHeader } from '../components/chat/ChatHeader.js';
import { ChatMessageList } from '../components/chat/ChatMessageList.js';
import { ChatPromptBox, AttachedImageData } from '../components/chat/ChatPromptBox.js';
import { AddAgentWizardModal } from '../components/wizard/AddAgentWizardModal.js';
import { AgentSettingsModal } from '../components/settings/AgentSettingsModal.js';
import { FileChangeReviewModal } from '../components/execution/FileChangeReviewModal.js';
import { LiveLogsPanel } from '../components/execution/LiveLogsPanel.js';
import { ExecutionHistoryModal } from '../components/execution/ExecutionHistoryModal.js';
import { RunAgentModal } from '../components/execution/RunAgentModal.js';
import { AIHubSettingsModal } from '../components/settings/AIHubSettingsModal.js';

import { agentService } from '../services/agentService.js';
import { conversationService } from '../services/conversationService.js';
import { executionService } from '../services/executionService.js';

export const WorkspaceLayout: React.FC = () => {
  // Agents State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Conversations State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  // Executions State
  const [executionsMap, setExecutionsMap] = useState<Record<string, AgentExecution>>({});
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Panels State
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIHubSettingsOpen, setIsAIHubSettingsOpen] = useState(false);
  const [isFileReviewOpen, setIsFileReviewOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [targetRunAgent, setTargetRunAgent] = useState<Agent | null>(null);

  // Responsive Mobile Drawer States
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    loadAgents();
    loadConversations();
  }, []);

  const loadAgents = async () => {
    try {
      const list = await agentService.getAgents();
      setAgents(list);
      if (list.length > 0 && !activeAgentId) {
        setActiveAgentId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await conversationService.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  // Load conversation details when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      conversationService.getConversation(activeConversationId)
        .then(conv => {
          setCurrentConversation(conv);
          if (conv.agentId) {
            setActiveAgentId(conv.agentId);
          }
          // Fetch any referenced executions
          conv.messages?.forEach(m => {
            if (m.executionId && !executionsMap[m.executionId]) {
              executionService.getExecution(m.executionId).then(exec => {
                setExecutionsMap(prev => ({ ...prev, [exec.id]: exec }));
              }).catch(() => {});
            }
          });
        })
        .catch(console.error);
    }
  }, [activeConversationId]);

  // Subscribe to live SSE events if an execution is active
  useEffect(() => {
    if (!activeExecutionId) return;

    const unsubscribe = executionService.subscribeToExecution(activeExecutionId, (event) => {
      if (event.type === 'step_update' || event.type === 'log' || event.type === 'file_changes' || event.type === 'completed' || event.type === 'status_change') {
        // Refresh execution object
        executionService.getExecution(activeExecutionId)
          .then(updated => {
            setExecutionsMap(prev => ({ ...prev, [updated.id]: updated }));
            if (updated.status === 'COMPLETED' || updated.status === 'FAILED' || updated.status === 'CANCELLED') {
              setIsExecuting(false);
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeExecutionId]);

  const activeAgent = agents.find(a => a.id === activeAgentId) || null;
  const currentExecution = activeExecutionId ? executionsMap[activeExecutionId] : null;

  // Handlers
  const handleSelectAgent = async (agentId: string) => {
    setActiveAgentId(agentId);
    // Find or create conversation for this agent
    const existing = conversations.find(c => c.agentId === agentId);
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const targetAgent = agents.find(a => a.id === agentId);
      const newConv = await conversationService.createConversation(agentId, `${targetAgent?.name || 'Agent'} Session`);
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    }
  };

  const handleNewConversation = async () => {
    if (!activeAgentId && agents.length === 0) return;
    const targetAgentId = activeAgentId || agents[0].id;
    const targetAgent = agents.find(a => a.id === targetAgentId);
    const newConv = await conversationService.createConversation(targetAgentId, `Task with ${targetAgent?.name || 'Agent'}`);
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  const handleNewChatWithAgent = async (agentId: string) => {
    setActiveAgentId(agentId);
    const targetAgent = agents.find(a => a.id === agentId);
    const newConv = await conversationService.createConversation(
      agentId,
      `Chat with ${targetAgent?.name || 'Agent'}`
    );
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      await conversationService.deleteConversation(convId);
      setConversations(prev => {
        const remaining = prev.filter(c => c.id !== convId);
        if (activeConversationId === convId) {
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
          } else {
            setActiveConversationId(null);
            setCurrentConversation(null);
          }
        }
        return remaining;
      });
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      alert(`Error deleting conversation: ${err.message || 'Unknown error'}`);
    }
  };

  const handleSendMessage = async (
    prompt: string,
    provider?: 'gemini' | 'openai' | 'anthropic',
    model?: string,
    image?: AttachedImageData
  ) => {
    if (!activeAgentId) return;

    try {
      // 1. Ensure conversation exists
      let convId = activeConversationId;
      if (!convId) {
        const titleSnippet = prompt.replace(/^!\[.*?\]\([^)]+\)\s*/g, '').slice(0, 30) || (image ? 'Screenshot Analysis' : 'New Chat');
        const newConv = await conversationService.createConversation(activeAgentId, titleSnippet);
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        convId = newConv.id;
      }

      // Format prompt with image markdown for immediate local display
      let displayContent = prompt;
      if (image?.dataUrl && !prompt.includes(image.dataUrl)) {
        displayContent = `![${image.name || 'Screenshot'}](${image.dataUrl})\n\n${prompt}`;
      }

      // 2. Add User message immediately to UI
      const tempUserMsg: Message = {
        id: 'user-' + Date.now(),
        conversationId: convId,
        sender: 'user',
        content: displayContent,
        createdAt: new Date().toISOString()
      };

      // 3. Add placeholder Assistant message for live streaming
      const tempAgentMsgId = 'agent-' + Date.now();
      const tempAgentMsg: Message = {
        id: tempAgentMsgId,
        conversationId: convId,
        sender: 'agent',
        content: '',
        createdAt: new Date().toISOString()
      };

      setCurrentConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, tempUserMsg, tempAgentMsg]
      } : {
        id: convId!,
        agentId: activeAgentId,
        userId: 'current',
        title: prompt.slice(0, 30),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [tempUserMsg, tempAgentMsg]
      });

      setIsAgentThinking(true);
      abortControllerRef.current = new AbortController();

      let streamAccumulator = '';

      const targetProvider = provider || (activeAgent?.aiConfig?.provider as any) || 'gemini';
      const targetModel = model || activeAgent?.aiConfig?.model || 'gemini-3.5-flash';

      // 4. Send chat message with SSE streaming (including image)
      const result = await conversationService.sendChatMessage(
        convId,
        prompt,
        activeAgentId,
        (chunk) => {
          setIsAgentThinking(false);
          streamAccumulator += chunk;
          setCurrentConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(m =>
                m.id === tempAgentMsgId ? { ...m, content: streamAccumulator } : m
              )
            };
          });
        },
        abortControllerRef.current.signal,
        targetProvider,
        targetModel,
        image
      );

      // 5. Finalize with persistent message from backend
      setIsAgentThinking(false);
      setCurrentConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(m =>
            m.id === tempAgentMsgId ? (result.message || { ...m, content: result.reply }) : m
          )
        };
      });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setIsAgentThinking(false);
        return;
      }
      console.error('Chat error:', err);
      setIsAgentThinking(false);
      setCurrentConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(m =>
            m.sender === 'agent' && !m.content
              ? { ...m, content: `⚠️ **Chat Error**: ${err.message || 'Unable to connect to AI provider.'}` }
              : m
          )
        };
      });
    }
  };

  // Explicit execution pipeline trigger (invoked from Run Agent modal / button)
  const handleExecutePipeline = async (prompt: string, agentId?: string) => {
    const targetId = agentId || activeAgentId;
    if (!targetId) return;
    setIsExecuting(true);

    try {
      let convId = activeConversationId;
      if (!convId) {
        const newConv = await conversationService.createConversation(targetId, `Pipeline: ${prompt.slice(0, 30)}`);
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        convId = newConv.id;
      }

      const userMsg = await conversationService.addMessage(convId, `[Run Execution Pipeline]: ${prompt}`, 'user');
      setCurrentConversation(prev => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null);

      const execution = await executionService.startExecution(targetId, prompt, activeAgent?.isDemo);
      setActiveExecutionId(execution.id);
      setExecutionsMap(prev => ({ ...prev, [execution.id]: execution }));

      const agentMsg = await conversationService.addMessage(
        convId,
        `Execution pipeline [${execution.id.slice(0, 8)}] started. Analyzing repository and formulating implementation plan...`,
        'agent',
        execution.id
      );
      setCurrentConversation(prev => prev ? { ...prev, messages: [...prev.messages, agentMsg] } : null);

    } catch (err: any) {
      console.error('Failed to start execution pipeline:', err);
      alert(`Error starting execution pipeline: ${err.message}`);
      setIsExecuting(false);
    }
  };

  const handleApproveExecution = async (execId: string, options?: any) => {
    try {
      await executionService.approve(execId, options);
      const updated = await executionService.getExecution(execId);
      setExecutionsMap(prev => ({ ...prev, [execId]: updated }));
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  const handleRejectExecution = async (execId: string, options?: any) => {
    try {
      await executionService.reject(execId, options);
      const updated = await executionService.getExecution(execId);
      setExecutionsMap(prev => ({ ...prev, [execId]: updated }));
      setIsExecuting(false);
    } catch (err: any) {
      alert(`Reject error: ${err.message}`);
    }
  };

  const handleApproveFile = async (fileId: string) => {
    if (!activeExecutionId) return;
    await handleApproveExecution(activeExecutionId, { fileIds: [fileId] });
  };

  const handleRejectFile = async (fileId: string) => {
    if (!activeExecutionId) return;
    await handleRejectExecution(activeExecutionId, { fileIds: [fileId] });
  };

  const handleApproveAllFiles = async () => {
    if (!activeExecutionId) return;
    await handleApproveExecution(activeExecutionId, { approveAll: true });
    setIsFileReviewOpen(false);
  };

  const handleRejectAllFiles = async () => {
    if (!activeExecutionId) return;
    await handleRejectExecution(activeExecutionId, { reason: 'User rejected all modified files.' });
    setIsFileReviewOpen(false);
  };

  const handleSyncRepo = async (agentId: string) => {
    try {
      const res = await agentService.syncRepository(agentId);
      alert(`Git Sync: ${res.message} (Commit: ${res.commit})`);
      loadAgents();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    }
  };

  const handleDuplicateAgent = async (agentId: string) => {
    try {
      const copy = await agentService.duplicateAgent(agentId);
      setAgents(prev => [copy, ...prev]);
      setActiveAgentId(copy.id);
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    try {
      await agentService.deleteAgent(agentId);
      setAgents(prev => prev.filter(a => a.id !== agentId));
      if (activeAgentId === agentId) {
        setActiveAgentId(null);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const nextStatus = agent.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      const updated = await agentService.updateAgent(agent.id, { status: nextStatus as any });
      setAgents(prev => prev.map(a => a.id === agent.id ? updated : a));
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const allFileChanges: AgentFileChange[] = currentExecution?.fileChanges || [];
  const allLogs: AgentExecutionLog[] = currentExecution?.logs || [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0e14] text-slate-100">
      {/* 1. LEFT SIDEBAR (Desktop: md+) */}
      <div className="hidden md:flex flex-shrink-0 z-20 h-full">
        <LeftSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={id => setActiveConversationId(id)}
          onNewConversation={handleNewConversation}
          onOpenSettings={() => setIsAIHubSettingsOpen(true)}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>

      {/* 2. CENTER WORKSPACE (All devices) */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative h-full overflow-hidden">
        <ChatHeader
          agent={activeAgent}
          agents={agents}
          onSelectAgent={handleSelectAgent}
          onOpenLogs={() => setIsLogsOpen(true)}
          onOpenFileReview={() => setIsFileReviewOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAISettings={() => setIsAIHubSettingsOpen(true)}
          onRunAgent={() => {
            setTargetRunAgent(activeAgent);
            setIsRunModalOpen(true);
          }}
          onToggleLeftSidebar={() => setIsMobileLeftOpen(prev => !prev)}
          onToggleRightSidebar={() => setIsMobileRightOpen(prev => !prev)}
          agentsCount={agents.length}
        />

        <ChatMessageList
          messages={currentConversation?.messages || []}
          agent={activeAgent}
          executionsMap={executionsMap}
          isThinking={isAgentThinking}
          onApproveExecution={handleApproveExecution}
          onRejectExecution={handleRejectExecution}
          onOpenFileReview={() => setIsFileReviewOpen(true)}
          onOpenLogs={() => setIsLogsOpen(true)}
          onOpenSettings={() => setIsAIHubSettingsOpen(true)}
          onSelectPrompt={prompt => handleSendMessage(prompt)}
        />

        <ChatPromptBox
          onSendMessage={handleSendMessage}
          onStopExecution={() => {
            if (isAgentThinking || abortControllerRef.current) {
              abortControllerRef.current?.abort();
              setIsAgentThinking(false);
            }
            if (activeExecutionId && isExecuting) {
              handleRejectExecution(activeExecutionId, { reason: 'Stopped by user' });
              setIsExecuting(false);
            }
          }}
          isExecuting={isExecuting}
          isThinking={isAgentThinking}
          disabled={!activeAgent}
          agentName={activeAgent?.name}
          currentProvider={(activeAgent?.aiConfig?.provider as any) || 'gemini'}
          currentModel={activeAgent?.aiConfig?.model || 'gemini-3.5-flash'}
          onSelectModel={async (provider, model) => {
            if (activeAgent) {
              try {
                const updated = await agentService.updateAgent(activeAgent.id, {
                  aiConfig: {
                    ...activeAgent.aiConfig!,
                    provider,
                    model
                  } as any
                });
                setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
              } catch (err) {
                console.warn('Failed to update agent model preference:', err);
              }
            }
          }}
          onOpenSettings={() => setIsAIHubSettingsOpen(true)}
        />
      </main>

      {/* 3. RIGHT AGENT SIDEBAR (Desktop: lg+) */}
      <div className="hidden lg:flex flex-shrink-0 z-20 h-full">
        <RightAgentSidebar
          agents={agents}
          activeAgentId={activeAgentId}
          onSelectAgent={handleSelectAgent}
          onNewChatWithAgent={handleNewChatWithAgent}
          onOpenAddWizard={() => setIsAddWizardOpen(true)}
          onEditAgent={agent => {
            setEditingAgent(agent);
            setIsSettingsOpen(true);
          }}
          onOpenHistory={agentId => {
            setActiveAgentId(agentId);
            setIsHistoryOpen(true);
          }}
          onOpenLogs={agentId => {
            setActiveAgentId(agentId);
            setIsLogsOpen(true);
          }}
          onQuickRun={agent => {
            setTargetRunAgent(agent);
            setIsRunModalOpen(true);
          }}
          onDuplicateAgent={handleDuplicateAgent}
          onDeleteAgent={handleDeleteAgent}
          onSyncRepo={handleSyncRepo}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* 4. MOBILE OFF-CANVAS LEFT DRAWER (< md) */}
      {isMobileLeftOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsMobileLeftOpen(false)}
          />
          <div className="relative z-10 flex h-full max-w-[85vw] animate-in slide-in-from-left duration-200 shadow-2xl">
            <LeftSidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={id => {
                setActiveConversationId(id);
                setIsMobileLeftOpen(false);
              }}
              onNewConversation={() => {
                handleNewConversation();
                setIsMobileLeftOpen(false);
              }}
              onOpenSettings={() => {
                setIsAIHubSettingsOpen(true);
                setIsMobileLeftOpen(false);
              }}
              onDeleteConversation={handleDeleteConversation}
              onClose={() => setIsMobileLeftOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 5. MOBILE OFF-CANVAS RIGHT DRAWER (< lg) */}
      {isMobileRightOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsMobileRightOpen(false)}
          />
          <div className="relative z-10 flex h-full max-w-[85vw] animate-in slide-in-from-right duration-200 shadow-2xl">
            <RightAgentSidebar
              agents={agents}
              activeAgentId={activeAgentId}
              onSelectAgent={id => {
                handleSelectAgent(id);
                setIsMobileRightOpen(false);
              }}
              onNewChatWithAgent={id => {
                handleNewChatWithAgent(id);
                setIsMobileRightOpen(false);
              }}
              onOpenAddWizard={() => {
                setIsAddWizardOpen(true);
                setIsMobileRightOpen(false);
              }}
              onEditAgent={agent => {
                setEditingAgent(agent);
                setIsSettingsOpen(true);
                setIsMobileRightOpen(false);
              }}
              onOpenHistory={agentId => {
                setActiveAgentId(agentId);
                setIsHistoryOpen(true);
                setIsMobileRightOpen(false);
              }}
              onOpenLogs={agentId => {
                setActiveAgentId(agentId);
                setIsLogsOpen(true);
                setIsMobileRightOpen(false);
              }}
              onQuickRun={agent => {
                setTargetRunAgent(agent);
                setIsRunModalOpen(true);
                setIsMobileRightOpen(false);
              }}
              onDuplicateAgent={handleDuplicateAgent}
              onDeleteAgent={handleDeleteAgent}
              onSyncRepo={handleSyncRepo}
              onToggleStatus={handleToggleStatus}
              onClose={() => setIsMobileRightOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Add Agent Wizard Modal (13 steps) */}
      <AddAgentWizardModal
        isOpen={isAddWizardOpen}
        onClose={() => setIsAddWizardOpen(false)}
        onAgentCreated={newAgent => {
          setAgents(prev => [newAgent, ...prev]);
          setActiveAgentId(newAgent.id);
        }}
      />

      {/* 2. Agent Settings Modal (13 tabs) */}
      {editingAgent && (
        <AgentSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          agent={editingAgent}
          onAgentUpdated={updated => {
            setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
            if (activeAgentId === updated.id) {
              setEditingAgent(updated);
            }
          }}
        />
      )}

      {/* 3. File Change Review Modal */}
      <FileChangeReviewModal
        isOpen={isFileReviewOpen}
        onClose={() => setIsFileReviewOpen(false)}
        fileChanges={allFileChanges}
        onApproveFile={handleApproveFile}
        onRejectFile={handleRejectFile}
        onApproveAll={handleApproveAllFiles}
        onRejectAll={handleRejectAllFiles}
      />

      {/* 4. Live Logs Panel */}
      <LiveLogsPanel
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={allLogs}
        executionId={activeExecutionId}
        agentName={activeAgent?.name}
      />

      {/* 5. Execution History Modal */}
      <ExecutionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        agentId={activeAgentId}
        agentName={activeAgent?.name}
        onSelectExecution={exec => {
          setActiveExecutionId(exec.id);
          setExecutionsMap(prev => ({ ...prev, [exec.id]: exec }));
        }}
      />

      {/* 6. Run Agent Modal (Customized prompt) */}
      <RunAgentModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        agent={targetRunAgent || activeAgent}
        onDispatch={prompt => {
          const agentToRun = targetRunAgent || activeAgent;
          if (agentToRun) {
            handleSelectAgent(agentToRun.id);
            handleExecutePipeline(prompt, agentToRun.id);
          }
        }}
      />

      {/* 7. Common AI Hub Settings Modal */}
      <AIHubSettingsModal
        isOpen={isAIHubSettingsOpen}
        onClose={() => setIsAIHubSettingsOpen(false)}
        onSettingsSaved={() => {
          loadAgents();
        }}
      />
    </div>
  );
};

