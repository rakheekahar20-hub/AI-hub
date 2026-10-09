import React, { useState } from 'react';
import { Copy, Check, Terminal, KeyRound, Sparkles, ZoomIn } from 'lucide-react';

interface FormattedMessageProps {
  content: string;
  onOpenSettings?: () => void;
  onImageClick?: (url: string, alt: string) => void;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  onOpenSettings,
  onImageClick
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Check if this message is a missing API key or configuration notice
  const isKeyNotice = content.includes('API_KEY') && (content.includes('Notice') || content.includes('Tip: You can connect') || content.includes('Set `GEMINI_API_KEY`'));

  // Split text by markdown code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-xs">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0]?.trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const language = hasLang ? firstLine : 'code';
          const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={index}
              className="my-3 rounded-xl overflow-hidden border border-[#232e3d] bg-[#0b0f17] shadow-md"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#121824] border-b border-[#232e3d] text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(code, index)}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:bg-[#1c2433] text-slate-300 hover:text-white transition-colors"
                  title="Copy code to clipboard"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 text-[11.5px] font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Render regular markdown text with basic block parsing
        return (
          <div key={index} className="space-y-2">
            {part.split('\n\n').map((paragraph, pIdx) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;

              // Images: ![alt](url)
              const imgMatch = trimmed.match(/^!\[(.*?)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)$/);
              if (imgMatch) {
                const alt = imgMatch[1] || 'Image';
                const url = imgMatch[2];
                return (
                  <div
                    key={pIdx}
                    onClick={() => onImageClick?.(url, alt)}
                    className="group relative my-2 rounded-xl overflow-hidden border border-[#2b3a4e] bg-[#0b0f17] shadow-md cursor-pointer hover:border-blue-500/50 transition-all max-w-sm sm:max-w-md"
                  >
                    <img
                      src={url}
                      alt={alt}
                      className="w-full max-h-60 sm:max-h-72 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
                      <ZoomIn className="w-4 h-4" />
                      <span>Click to expand</span>
                    </div>
                    {alt && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-slate-200 font-mono truncate max-w-[80%]">
                        {alt}
                      </div>
                    )}
                  </div>
                );
              }

              // Headers
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={pIdx} className="text-sm font-semibold text-slate-100 mt-2 mb-1">
                    {renderInline(trimmed.replace(/^### /, ''))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={pIdx} className="text-sm font-bold text-slate-100 mt-2 mb-1">
                    {renderInline(trimmed.replace(/^## /, ''))}
                  </h3>
                );
              }

              // Bullet lists
              if (trimmed.includes('\n- ') || trimmed.includes('\n• ') || trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('1. ')) {
                const items = trimmed.split('\n');
                return (
                  <ul key={pIdx} className="space-y-1 my-1 pl-1">
                    {items.map((item, itemIdx) => {
                      const cleanItem = item.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
                      return (
                        <li key={itemIdx} className="flex items-start gap-2 text-slate-300">
                          <span className="text-blue-400 select-none text-[10px] mt-0.5">●</span>
                          <span className="flex-1">{renderInline(cleanItem)}</span>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Quotes / Callouts
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote
                    key={pIdx}
                    className="border-l-2 border-blue-500/60 pl-3 py-1 my-1 text-slate-400 italic bg-blue-500/5 rounded-r"
                  >
                    {renderInline(trimmed.replace(/^>\s*/, ''))}
                  </blockquote>
                );
              }

              return (
                <p key={pIdx} className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {renderInline(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}

      {/* Helpful action button if API key notice detected */}
      {isKeyNotice && onOpenSettings && (
        <div className="mt-3 pt-2.5 border-t border-[#232e3d] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            Connect Google Gemini or OpenAI in Agent Settings:
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-[11px] font-medium transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-blue-400" />
            Configure AI Provider
          </button>
        </div>
      )}
    </div>
  );
};

// Helper for bold and inline code
function renderInline(text: string): React.ReactNode {
  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-[#1c2433] text-blue-300 font-mono text-[11px] border border-[#26354a]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold text: **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, j) => {
      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return (
          <strong key={`${i}-${j}`} className="font-semibold text-slate-100">
            {bPart.slice(2, -2)}
          </strong>
        );
      }
      return bPart;
    });
  });
}
