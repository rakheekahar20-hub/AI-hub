import React, { useEffect, useRef, useState } from 'react';
import { Message, Agent, AgentExecution } from '../../types/index.js';
import { ExecutionStatusCard } from './ExecutionStatusCard.js';
import { FormattedMessage } from './FormattedMessage.js';
import { ImageLightboxModal } from './ImageLightboxModal.js';
import { Bot, User as UserIcon, Sparkles, Cpu, Clock, ZoomIn } from 'lucide-react';

interface ChatMessageListProps {
  messages: Message[];
  agent: Agent | null;
  executionsMap: Record<string, AgentExecution>;
  isThinking?: boolean;
  onApproveExecution: (id: string, options?: any) => void;
  onRejectExecution: (id: string, options?: any) => void;
  onOpenFileReview: () => void;
  onOpenLogs: () => void;
  onOpenSettings?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

const UserMessageContent: React.FC<{
  content: string;
  onImageClick?: (url: string, alt: string) => void;
}> = ({ content, onImageClick }) => {
  const imageRegex = /!\[(.*?)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g;
  const images: Array<{ alt: string; url: string }> = [];
  let match;
  while ((match = imageRegex.exec(content)) !== null) {
    images.push({ alt: match[1] || 'Screenshot', url: match[2] });
  }

  const cleanText = content.replace(imageRegex, '').trim();

  return (
    <div className="space-y-2">
      {images.map((img, i) => (
        <div
          key={i}
          onClick={() => onImageClick?.(img.url, img.alt)}
          className="group relative rounded-xl overflow-hidden border border-white/20 bg-black/25 shadow-md cursor-pointer hover:border-white/50 transition-all max-w-sm"
        >
          <img
            src={img.url}
            alt={img.alt}
            className="w-full max-h-60 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
            <ZoomIn className="w-4 h-4" />
            <span>Click to expand</span>
          </div>
          {img.alt && (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white/90 font-mono truncate max-w-[80%]">
              {img.alt}
            </div>
          )}
        </div>
      ))}
      {cleanText && (
        <p className="whitespace-pre-wrap leading-relaxed">{cleanText}</p>
      )}
    </div>
  );
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  agent,
  executionsMap,
  isThinking = false,
  onApproveExecution,
  onRejectExecution,
  onOpenFileReview,
  onOpenLogs,
  onOpenSettings,
  onSelectPrompt
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lightboxData, setLightboxData] = useState<{ url: string; alt?: string } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, executionsMap, isThinking]);

  const starterPrompts = [
    `Hello! What project are you currently working on?`,
    `Explain your tech stack, architecture, and database structure.`,
    `How can you help write code and build features for me?`,
    `Help me plan and build the next feature step-by-step.`
  ];

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="text-center py-4 sm:py-6 border-b border-[#1e2633]/60 mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2.5 sm:mb-3 shadow-lg shadow-blue-900/10">
          <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-slate-100">
          {agent ? `${agent.name} Workspace` : 'AI Development Platform'}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mx-auto mt-1 px-2">
          {agent?.description || 'Interactive AI chat workspace for rapid software development.'}
        </p>
        <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 px-2">
          <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-[#161d27] text-slate-400 border border-[#232e3d]">
            Tech: {agent?.instruction?.technologyStack || 'TypeScript, React, Node.js'}
          </span>
          <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Model: {agent?.aiConfig?.provider === 'openai' ? (agent.aiConfig.model || 'gpt-4o') : (agent?.aiConfig?.model || 'gemini-3.5-flash')}
          </span>
          {agent?.isDemo && (
            <span className="text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Demo Mode Active
            </span>
          )}
        </div>
      </div>

      {/* Suggested Starter Prompts when conversation is fresh */}
      {messages.length === 0 && (
        <div className="max-w-xl mx-auto my-4 px-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Quick Chat Starters with {agent?.name || 'Agent'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {starterPrompts.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt?.(suggestion)}
                className="text-left p-3 rounded-xl bg-[#141b26] hover:bg-[#1a2332] border border-[#232e3d] hover:border-blue-500/40 text-slate-300 hover:text-white text-xs transition-all flex items-start gap-2.5 group shadow-sm hover:shadow-md cursor-pointer"
              >
                <span className="text-blue-400 group-hover:scale-110 transition-transform mt-0.5">💬</span>
                <span className="leading-snug flex-1">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages list */}
      {messages.map((msg) => {
        const isUser = msg.sender === 'user';
        const execution = msg.executionId ? executionsMap[msg.executionId] : null;

        return (
          <div
            key={msg.id}
            className={`flex gap-2 sm:gap-3 max-w-4xl w-full ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                isUser
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'bg-[#182230] border border-[#26354a] text-blue-400'
              }`}
            >
              {isUser ? <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>

            {/* Bubble */}
            <div className={`space-y-2 max-w-[88%] sm:max-w-xl md:max-w-2xl min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3 sm:p-4 rounded-2xl text-xs leading-relaxed transition-all shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-blue-600/10'
                    : 'bg-[#151c27] text-slate-200 border border-[#232e3d] rounded-tl-sm shadow-slate-950/20'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#212b3b] text-[10px] text-slate-400 font-medium">
                    <span className="text-blue-400 font-semibold">{agent?.name || 'AI Assistant'}</span>
                    <span>•</span>
                    <span className="uppercase tracking-wider font-mono text-[9px] bg-[#1a2230] px-1.5 py-0.5 rounded text-slate-400">
                      {agent?.aiConfig?.provider || 'AI'}
                    </span>
                  </div>
                )}

                {isUser ? (
                  <UserMessageContent
                    content={msg.content}
                    onImageClick={(url, alt) => setLightboxData({ url, alt })}
                  />
                ) : (
                  <FormattedMessage
                    content={msg.content}
                    onOpenSettings={onOpenSettings}
                    onImageClick={(url, alt) => setLightboxData({ url, alt })}
                  />
                )}

                <div
                  className={`text-[10px] mt-2 font-mono flex items-center gap-1 ${
                    isUser ? 'text-blue-200 justify-end' : 'text-slate-500 justify-start'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5 opacity-60" />
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Embedded Execution Card if this message spawned an execution */}
              {execution && (
                <div className="w-full">
                  <ExecutionStatusCard
                    execution={execution}
                    onApprove={onApproveExecution}
                    onReject={onRejectExecution}
                    onOpenFileReview={onOpenFileReview}
                    onOpenLogs={onOpenLogs}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Typing / Thinking Indicator */}
      {isThinking && (
        <div className="flex gap-3 max-w-4xl mr-auto animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-[#182230] border border-[#26354a] text-blue-400 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 animate-bounce" />
          </div>
          <div className="bg-[#151c27] border border-[#232e3d] rounded-2xl rounded-tl-sm px-4 py-3 shadow-md flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium">
              {agent?.name || 'Agent'} is thinking
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {lightboxData && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxData)}
          imageUrl={lightboxData.url}
          altText={lightboxData.alt}
          onClose={() => setLightboxData(null)}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
};
