import { apiRequest } from './api.js';

export interface ProviderSettingInfo {
  configured: boolean;
  maskedKey: string;
  apiKey?: string;
  defaultModel: string;
  availableModels: string[];
}

export interface AISettingsData {
  gemini: ProviderSettingInfo;
  openai: ProviderSettingInfo;
  anthropic: ProviderSettingInfo;
  defaultProvider: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  model?: string;
  reply?: string;
  latencyMs?: number;
}

export const settingsService = {
  async getAISettings(): Promise<AISettingsData> {
    const res = await apiRequest<{ settings: AISettingsData }>('/settings/ai');
    return res.settings;
  },

  async saveAISettings(updates: {
    geminiApiKey?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    defaultProvider?: string;
    defaultGeminiModel?: string;
    defaultOpenAIModel?: string;
  }): Promise<{ success: boolean; message: string }> {
    return apiRequest('/settings/ai', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
  },

  async testAIConnection(
    provider: 'gemini' | 'openai' | 'anthropic',
    apiKey?: string,
    model?: string
  ): Promise<TestConnectionResult> {
    return apiRequest('/settings/test', {
      method: 'POST',
      body: JSON.stringify({ provider, apiKey, model }),
    });
  },
};

