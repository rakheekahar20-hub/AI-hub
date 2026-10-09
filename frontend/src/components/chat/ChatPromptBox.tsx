import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Square, CornerDownLeft, Image as ImageIcon, X } from 'lucide-react';
import { ModelSelectorDropdown } from './ModelSelectorDropdown.js';

export interface AttachedImageData {
  dataUrl: string;
  mimeType: string;
  name: string;
  size?: number;
}

interface ChatPromptBoxProps {
  onSendMessage: (
    content: string,
    provider?: 'gemini' | 'openai' | 'anthropic',
    model?: string,
    image?: AttachedImageData
  ) => void;
  onStopExecution?: () => void;
  isExecuting?: boolean;
  isThinking?: boolean;
  disabled?: boolean;
  agentName?: string;
  currentProvider?: 'gemini' | 'openai' | 'anthropic';
  currentModel?: string;
  onSelectModel?: (provider: 'gemini' | 'openai' | 'anthropic', model: string) => void;
  onOpenSettings?: () => void;
}

export const ChatPromptBox: React.FC<ChatPromptBoxProps> = ({
  onSendMessage,
  onStopExecution,
  isExecuting = false,
  isThinking = false,
  disabled = false,
  agentName,
  currentProvider = 'gemini',
  currentModel = 'gemini-1.5-flash',
  onSelectModel,
  onOpenSettings = () => {}
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<AttachedImageData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'openai' | 'anthropic'>(currentProvider);
  const [selectedModel, setSelectedModel] = useState<string>(currentModel);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (currentProvider) setSelectedProvider(currentProvider);
    if (currentModel) setSelectedModel(currentModel);
  }, [currentProvider, currentModel]);

  const handleModelChange = (p: 'gemini' | 'openai' | 'anthropic', m: string) => {
    setSelectedProvider(p);
    setSelectedModel(m);
    onSelectModel?.(p, m);
  };

  const isBusy = isExecuting || isThinking;

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setAttachedImage({
            dataUrl,
            mimeType: file.type || 'image/png',
            name: file.name || `screenshot-${Date.now()}.png`,
            size: file.size
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentName(file.name);
    }
  };

  // Clipboard paste handler (e.g. Ctrl + V for screenshot snippet)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (dataUrl) {
              const timeStr = new Date().toISOString().slice(11, 19).replace(/:/g, '');
              setAttachedImage({
                dataUrl,
                mimeType: file.type || 'image/png',
                name: `screenshot-${timeStr}.png`,
                size: file.size
              });
            }
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = Boolean(prompt.trim());
    const hasImage = Boolean(attachedImage);

    if ((!hasText && !hasImage) || isBusy || disabled) return;

    let contentToSend = prompt.trim();
    if (!contentToSend && attachedImage) {
      contentToSend = 'Please inspect and analyze this attached screenshot/image.';
    } else if (attachmentName) {
      contentToSend += `\n[Attached Reference File: ${attachmentName}]`;
    }

    onSendMessage(contentToSend, selectedProvider, selectedModel, attachedImage || undefined);
    setPrompt('');
    setAttachmentName(null);
    setAttachedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSubmit = (Boolean(prompt.trim()) || Boolean(attachedImage)) && !disabled && !isBusy;

  return (
    <div className="p-2.5 sm:p-4 bg-[#0c1017] border-t border-[#1e2633]">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Attached image preview banner */}
        {attachedImage && (
          <div className="mb-2 p-2 sm:p-2.5 bg-[#141d2b] border border-blue-500/30 rounded-xl flex items-center justify-between gap-3 shadow-lg max-w-md animate-fadeIn">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#2b3a4e] flex-shrink-0 bg-black/50">
                <img
                  src={attachedImage.dataUrl}
                  alt={attachedImage.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[200px]">
                    {attachedImage.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span>{attachedImage.size ? `${Math.round(attachedImage.size / 1024)} KB` : 'Image'}</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-mono text-[9px] uppercase">
                    {attachedImage.mimeType.split('/')[1] || 'img'}
                  </span>
                  <span className="text-emerald-400 text-[10px]">Ready to send</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202c3d] transition-colors"
              title="Remove attached image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Regular attachment pill if any non-image file */}
        {attachmentName && !attachedImage && (
          <div className="mb-2 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg w-fit">
            <Paperclip className="w-3.5 h-3.5" />
            <span className="truncate max-w-[200px]">Attached: {attachmentName}</span>
            <button
              type="button"
              onClick={() => setAttachmentName(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl bg-[#141b26] border transition-all shadow-lg ${
            isDragging
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/10'
              : 'border-[#232e3d] focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/10'
          }`}
        >
          {/* Drag and drop overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-600/15 border-2 border-dashed border-blue-400 rounded-2xl flex items-center justify-center z-10 pointer-events-none backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold">
                <ImageIcon className="w-4 h-4 animate-bounce" />
                <span>Drop image here to attach</span>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={
              agentName
                ? `Message ${agentName}... (Paste screenshot with Ctrl+V)`
                : "Ask anything or paste screenshots (Ctrl+V)..."
            }
            rows={2}
            className="w-full px-3 sm:px-4 pt-3 sm:pt-3.5 pb-11 sm:pb-12 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed min-h-[72px] sm:min-h-[88px]"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Action Toolbar */}
          <div className="absolute left-2.5 sm:left-3 right-2.5 sm:right-3 bottom-2.5 sm:bottom-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ModelSelectorDropdown
                currentProvider={selectedProvider}
                currentModel={selectedModel}
                onSelectModel={handleModelChange}
                onOpenSettings={onOpenSettings}
              />

              <button
                type="button"
                onClick={handleAttachClick}
                disabled={isBusy || disabled}
                className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1f2838] transition-colors flex items-center gap-1.5 text-xs font-medium"
                title="Attach image or screenshot (or paste directly with Ctrl+V)"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] hidden sm:inline">Image</span>
              </button>

              <span className="text-[10px] text-slate-500 hidden md:inline">
                Ctrl+V to paste screenshot
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isBusy ? (
                <button
                  type="button"
                  onClick={onStopExecution}
                  className="py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">{isExecuting ? 'Stop pipeline' : 'Stop generating'}</span>
                  <span className="sm:hidden">Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="py-1 sm:py-1.5 px-3 sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <span>Send</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
