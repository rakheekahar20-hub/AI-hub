import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  ChevronDown,
  Check,
  KeyRound,
  ExternalLink,
  Zap,
  Brain,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { settingsService, AISettingsData } from '../../services/settingsService.js';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'anthropic';
  description: string;
  badge?: string;
  isRecommended?: boolean;
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'gemini',
    description: 'Fast, high quota, optimized for rapid conversational chat & code',
    badge: 'Recommended',
    isRecommended: true
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    description: 'State-of-the-art latest multimodal intelligence',
    badge: 'Latest'
  },
  {
    id: 'gemini-flash-lite-latest',
    name: 'Gemini Flash Lite',
    provider: 'gemini',
    description: 'Ultra-low latency conversational assistant',
    badge: 'Fast'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (OpenAI)',
    provider: 'openai',
    description: 'Flagship multimodal omni model',
    badge: 'Flagship'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Affordable lightweight model',
    badge: 'Light'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'State-of-the-art coding & nuance',
    badge: 'Claude'
  }
];

interface ModelSelectorDropdownProps {
  currentProvider: 'gemini' | 'openai' | 'anthropic';
  currentModel: string;
  onSelectModel: (provider: 'gemini' | 'openai' | 'anthropic', model: string) => void;
  onOpenSettings: () => void;
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  currentProvider,
  currentModel,
  onSelectModel,
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [serverSettings, setServerSettings] = useState<AISettingsData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    settingsService.getAISettings()
      .then(setServerSettings)
      .catch(console.error);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeModelOption = AVAILABLE_MODELS.find(m => m.id === currentModel && m.provider === currentProvider) ||
    AVAILABLE_MODELS.find(m => m.id === currentModel) ||
    AVAILABLE_MODELS[0];

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
      case 'openai':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const isProviderConfigured = (provider: 'gemini' | 'openai' | 'anthropic') => {
    if (!serverSettings) return true;
    return Boolean(serverSettings[provider]?.configured);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Pill Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#121822] hover:bg-[#1a2332] border border-[#232e3d] hover:border-blue-500/40 text-slate-200 text-xs font-medium transition-all shadow-sm group"
        title="Switch AI Model & Provider"
      >
        <span className="flex items-center gap-1.5">
          {getProviderIcon(activeModelOption.provider)}
          <span className="font-semibold text-slate-100">{activeModelOption.name}</span>
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 bottom-10 mb-1 w-80 sm:w-96 bg-[#0f141d] border border-[#232e3d] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-[#141b26] border-b border-[#232e3d] flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Active AI Models
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              Manage Keys
            </button>
          </div>

          {/* Model Options List */}
          <div className="p-2 max-h-72 overflow-y-auto space-y-1">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === activeModelOption.id && model.provider === activeModelOption.provider;
              const configured = isProviderConfigured(model.provider);

              return (
                <button
                  key={`${model.provider}-${model.id}`}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.provider, model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-sm'
                      : 'border-transparent hover:bg-[#161e2a] hover:border-[#232e3d] text-slate-300'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getProviderIcon(model.provider)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {model.name}
                        </span>
                        {model.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                            model.isRecommended
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {model.badge}
                          </span>
                        )}
                      </div>

                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      ) : configured ? (
                        <span className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-0.5 flex-shrink-0">
                          <ShieldCheck className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-0.5 flex-shrink-0">
                          <AlertCircle className="w-3 h-3" /> Key missing
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer with connection status */}
          <div className="p-2.5 bg-[#121822] border-t border-[#232e3d] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected: {serverSettings?.gemini.configured ? 'Google Gemini (Active)' : 'Offline mode'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="text-blue-400 hover:underline font-medium"
            >
              Configure AI Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
