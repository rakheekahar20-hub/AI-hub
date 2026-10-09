import { AIProvider } from './AIProvider.js';
import { MockAIProvider } from './MockAIProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';

export interface ProviderOptions {
  provider: 'openai' | 'gemini' | 'anthropic';
  model?: string;
  apiKey?: string;
  isDemo?: boolean;
}

export class AIProviderFactory {
  static getProvider(options: ProviderOptions): AIProvider {
    const rawKey = options.apiKey ||
      process.env[`${options.provider.toUpperCase()}_API_KEY`] ||
      (options.provider === 'gemini' ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) : '') ||
      (options.provider === 'openai' ? process.env.OPENAI_API_KEY : '') ||
      (options.provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : '') ||
      '';
    const key = rawKey.trim().replace(/^["']|["']$/g, '');

    if (options.isDemo && !key) {
      return new MockAIProvider();
    }

    switch (options.provider) {
      case 'openai':
        return new OpenAIProvider(key, options.model || 'gpt-4o');
      case 'gemini':
        return new GeminiProvider(key, options.model || 'gemini-3.5-flash');
      case 'anthropic':
        return new AnthropicProvider(key, options.model || 'claude-3-5-sonnet-20241022');
      default:
        return new MockAIProvider();
    }
  }
}

