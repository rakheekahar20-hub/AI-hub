import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Loader2,
  Save,
  Check
} from 'lucide-react';
import { settingsService, AISettingsData, TestConnectionResult } from '../../services/settingsService.js';

interface AIHubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const AIHubSettingsModal: React.FC<AIHubSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Global Key Inputs
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [defaultProvider, setDefaultProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');

  // Existing Config Info
  const [serverSettings, setServerSettings] = useState<AISettingsData | null>(null);

  // Show/Hide Passwords
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  // Testing states
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResult>>({});

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getAISettings();
      setServerSettings(data);
      setDefaultProvider((data.defaultProvider as any) || 'gemini');
      setGeminiModel(data.gemini?.defaultModel || 'gemini-1.5-flash');
      setOpenaiModel(data.openai?.defaultModel || 'gpt-4o');

      // Pre-fill keys from server if present so user sees their saved keys
      if (data.gemini?.apiKey) {
        setGeminiKey(data.gemini.apiKey);
      }
      if (data.openai?.apiKey) {
        setOpenaiKey(data.openai.apiKey);
      }
      if (data.anthropic?.apiKey) {
        setAnthropicKey(data.anthropic.apiKey);
      }
    } catch (err) {
      console.error('Failed to load global AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async (provider: 'gemini' | 'openai' | 'anthropic', key: string, model: string) => {
    setTestingProvider(provider);
    try {
      const res = await settingsService.testAIConnection(provider, key || undefined, model);
      setTestResults(prev => ({ ...prev, [provider]: res }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: err.message || 'Test connection failed' }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    try {
      const payload: any = {
        defaultProvider,
        defaultGeminiModel: geminiModel,
        defaultOpenAIModel: openaiModel,
        geminiApiKey: geminiKey.trim(),
        openaiApiKey: openaiKey.trim(),
        anthropicApiKey: anthropicKey.trim()
      };

      await settingsService.saveAISettings(payload);
      setJustSaved(true);
      setSuccessMessage('AI Hub provider keys saved successfully! Your keys are preserved and active across all workspace agents.');

      // Refresh server settings to ensure state consistency without clearing keys
      const data = await settingsService.getAISettings();
      setServerSettings(data);

      onSettingsSaved?.();
      setTimeout(() => setJustSaved(false), 3000);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isGeminiActive = Boolean(geminiKey.trim() || serverSettings?.gemini.configured);
  const isOpenaiActive = Boolean(openaiKey.trim() || serverSettings?.openai.configured);
  const isAnthropicActive = Boolean(anthropicKey.trim() || serverSettings?.anthropic.configured);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e131b] border border-[#232e3d] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1e2633] flex items-center justify-between bg-[#121824]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2 truncate">
                Common AI Hub Settings
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold uppercase">
                  Global Model Keys
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                Configure provider API keys once. All agents in your workspace will inherit these keys automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2332] transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span>Loading AI settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
              {/* Default Active Provider Selector */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#141b26] border border-[#232e3d]">
                <label className="block text-xs font-semibold text-slate-200 mb-2">
                  Default Platform Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {[
                    { id: 'gemini', label: 'Google Gemini', sub: 'Fast & High Quota' },
                    { id: 'openai', label: 'OpenAI', sub: 'GPT-4o & GPT-4o-mini' },
                    { id: 'anthropic', label: 'Anthropic', sub: 'Claude 3.5 Sonnet' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDefaultProvider(p.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        defaultProvider === p.id
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                          : 'bg-[#0f141d] border-[#1e2633] text-slate-400 hover:text-slate-200 hover:border-[#2a374a]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Google Gemini Card */}
              <div className="p-4 rounded-xl bg-[#141b26] border border-[#232e3d] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-100">Google Gemini API</span>
                    {isGeminiActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured & Active
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Not configured
                      </span>
                    )}
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-400">
                        Gemini API Key
                      </label>
                      {geminiKey && (
                        <button
                          type="button"
                          onClick={() => setGeminiKey('')}
                          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                        >
                          Clear Key
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showGemini ? 'text' : 'password'}
                        value={geminiKey}
                        onChange={e => setGeminiKey(e.target.value)}
                        placeholder="Paste your Gemini API key (AIzaSy...)"
                        className="w-full pl-3 pr-10 py-2 bg-[#0e131b] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGemini(!showGemini)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                        title={showGemini ? 'Hide API Key' : 'Show API Key'}
                      >
                        {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {geminiKey && (
                      <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" /> Key saved: {geminiKey.slice(0, 8)}••••••••{geminiKey.slice(-4)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Default Model</label>
                    <select
                      value={geminiModel}
                      onChange={e => setGeminiModel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0e131b] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Recommended)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Multimodal)</option>
                      <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Ultra Low Latency)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestKey('gemini', geminiKey, geminiModel)}
                    disabled={testingProvider === 'gemini'}
                    className="py-1.5 px-3 rounded-lg bg-[#1a2332] hover:bg-[#222e42] border border-[#26354a] text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {testingProvider === 'gemini' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>Testing connection...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>Test Gemini Connection</span>
                      </>
                    )}
                  </button>

                  {testResults.gemini && (
                    <div className={`text-xs flex items-center gap-1.5 font-medium ${testResults.gemini.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {testResults.gemini.success ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{testResults.gemini.message} ({testResults.gemini.latencyMs}ms)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{testResults.gemini.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. OpenAI Card */}
              <div className="p-4 rounded-xl bg-[#141b26] border border-[#232e3d] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-100">OpenAI API</span>
                    {isOpenaiActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured & Active
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Not configured
                      </span>
                    )}
                  </div>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    OpenAI API Keys <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-400">
                        OpenAI API Key
                      </label>
                      {openaiKey && (
                        <button
                          type="button"
                          onClick={() => setOpenaiKey('')}
                          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                        >
                          Clear Key
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showOpenai ? 'text' : 'password'}
                        value={openaiKey}
                        onChange={e => setOpenaiKey(e.target.value)}
                        placeholder="Paste your OpenAI API key (sk-proj-...)"
                        className="w-full pl-3 pr-10 py-2 bg-[#0e131b] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenai(!showOpenai)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                        title={showOpenai ? 'Hide API Key' : 'Show API Key'}
                      >
                        {showOpenai ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {openaiKey && (
                      <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3" /> Key saved: {openaiKey.slice(0, 7)}••••••••{openaiKey.slice(-4)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Default Model</label>
                    <select
                      value={openaiModel}
                      onChange={e => setOpenaiModel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0e131b] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="gpt-4o">gpt-4o (Omni flagship)</option>
                      <option value="gpt-4o-mini">gpt-4o-mini (Lightweight)</option>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestKey('openai', openaiKey, openaiModel)}
                    disabled={testingProvider === 'openai'}
                    className="py-1.5 px-3 rounded-lg bg-[#1a2332] hover:bg-[#222e42] border border-[#26354a] text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {testingProvider === 'openai' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Testing connection...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Test OpenAI Connection</span>
                      </>
                    )}
                  </button>

                  {testResults.openai && (
                    <div className={`text-xs flex items-center gap-1.5 font-medium ${testResults.openai.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {testResults.openai.success ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{testResults.openai.message} ({testResults.openai.latencyMs}ms)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{testResults.openai.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Anthropic Card */}
              <div className="p-4 rounded-xl bg-[#141b26] border border-[#232e3d] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-100">Anthropic Claude API</span>
                    {isAnthropicActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Configured & Active
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                        Optional
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-400">Anthropic API Key</label>
                    {anthropicKey && (
                      <button
                        type="button"
                        onClick={() => setAnthropicKey('')}
                        className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Clear Key
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showAnthropic ? 'text' : 'password'}
                      value={anthropicKey}
                      onChange={e => setAnthropicKey(e.target.value)}
                      placeholder="Paste your Anthropic API key (sk-ant-...)"
                      className="w-full pl-3 pr-10 py-2 bg-[#0e131b] border border-[#232e3d] focus:border-blue-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropic(!showAnthropic)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      title={showAnthropic ? 'Hide API Key' : 'Show API Key'}
                    >
                      {showAnthropic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#1e2633] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#232e3d] hover:bg-[#161d27] text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2 ${
                    justSaved
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-blue-600/20'
                  }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Applying...</span>
                    </>
                  ) : justSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved & Applied!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Apply Keys</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
