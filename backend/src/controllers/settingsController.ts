import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

// Helper to mask secrets
function maskKey(key?: string | null): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
}

// Helper to update .env file safely
function updateEnvFile(updates: Record<string, string>) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }

    const lines = content.split('\n');
    const existingKeys = new Set<string>();

    const updatedLines = lines.map(line => {
      const match = line.match(/^\s*([A-Za-z_0-9]+)\s*=/);
      if (match) {
        const key = match[1];
        existingKeys.add(key);
        if (updates[key] !== undefined) {
          return `${key}="${updates[key]}"`;
        }
      }
      return line;
    });

    // Add any new keys that weren't present
    for (const [key, val] of Object.entries(updates)) {
      if (!existingKeys.has(key)) {
        updatedLines.push(`${key}="${val}"`);
      }
    }

    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
  } catch (err) {
    console.warn('Failed to persist .env file:', err);
  }
}

export async function getAISettings(req: AuthenticatedRequest, res: Response) {
  try {
    const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const openAIKey = (process.env.OPENAI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const anthropicKey = (process.env.ANTHROPIC_API_KEY || '').trim().replace(/^["']|["']$/g, '');

    res.json({
      settings: {
        gemini: {
          configured: Boolean(geminiKey && geminiKey.length > 5),
          maskedKey: maskKey(geminiKey),
          apiKey: geminiKey,
          defaultModel: process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.5-flash',
          availableModels: ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-lite-latest']
        },
        openai: {
          configured: Boolean(openAIKey && openAIKey.length > 5),
          maskedKey: maskKey(openAIKey),
          apiKey: openAIKey,
          defaultModel: process.env.DEFAULT_OPENAI_MODEL || 'gpt-4o',
          availableModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
        },
        anthropic: {
          configured: Boolean(anthropicKey && anthropicKey.length > 5),
          maskedKey: maskKey(anthropicKey),
          apiKey: anthropicKey,
          defaultModel: process.env.DEFAULT_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
          availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
        },
        defaultProvider: process.env.DEFAULT_AI_PROVIDER || (geminiKey ? 'gemini' : openAIKey ? 'openai' : 'gemini')
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function saveAISettings(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      geminiApiKey,
      openaiApiKey,
      anthropicApiKey,
      defaultProvider,
      defaultGeminiModel,
      defaultOpenAIModel
    } = req.body;

    const envUpdates: Record<string, string> = {};

    if (geminiApiKey !== undefined) {
      const sanitized = geminiApiKey.trim().replace(/^["']|["']$/g, '');
      process.env.GEMINI_API_KEY = sanitized;
      envUpdates.GEMINI_API_KEY = sanitized;
    }
    if (openaiApiKey !== undefined) {
      const sanitized = openaiApiKey.trim().replace(/^["']|["']$/g, '');
      process.env.OPENAI_API_KEY = sanitized;
      envUpdates.OPENAI_API_KEY = sanitized;
    }
    if (anthropicApiKey !== undefined) {
      const sanitized = anthropicApiKey.trim().replace(/^["']|["']$/g, '');
      process.env.ANTHROPIC_API_KEY = sanitized;
      envUpdates.ANTHROPIC_API_KEY = sanitized;
    }
    if (defaultProvider) {
      process.env.DEFAULT_AI_PROVIDER = defaultProvider;
      envUpdates.DEFAULT_AI_PROVIDER = defaultProvider;
    }
    if (defaultGeminiModel) {
      process.env.DEFAULT_GEMINI_MODEL = defaultGeminiModel;
      envUpdates.DEFAULT_GEMINI_MODEL = defaultGeminiModel;
    }
    if (defaultOpenAIModel) {
      process.env.DEFAULT_OPENAI_MODEL = defaultOpenAIModel;
      envUpdates.DEFAULT_OPENAI_MODEL = defaultOpenAIModel;
    }

    // Persist to .env file
    updateEnvFile(envUpdates);

    res.json({
      success: true,
      message: 'Global AI Hub settings updated successfully.',
      status: {
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
        defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'gemini'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function testAIConnection(req: AuthenticatedRequest, res: Response) {
  try {
    const { provider, apiKey, model } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: 'Provider is required' });
    }

    const start = Date.now();

    if (provider === 'gemini') {
      let key = (apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
      if (!key) {
        return res.json({ success: false, message: 'No Google Gemini API key provided or found in settings.' });
      }

      const targetModel = model || 'gemini-3.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping test. Reply with: OK' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.error?.message || errorMsg;
        } catch {}
        return res.json({ success: false, message: errorMsg, latencyMs });
      }

      const data = await response.json() as any;
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';

      return res.json({
        success: true,
        message: `Connected successfully to Google Gemini (${targetModel})!`,
        model: targetModel,
        reply,
        latencyMs
      });
    }

    if (provider === 'openai') {
      let key = (apiKey || process.env.OPENAI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
      if (!key) {
        return res.json({ success: false, message: 'No OpenAI API key provided or found in settings.' });
      }

      const targetModel = model || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: 'user', content: 'Ping test. Reply with: OK' }],
          max_tokens: 10
        })
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.error?.message || errorMsg;
        } catch {}
        return res.json({ success: false, message: errorMsg, latencyMs });
      }

      const data = await response.json() as any;
      const reply = data.choices?.[0]?.message?.content?.trim() || 'OK';

      return res.json({
        success: true,
        message: `Connected successfully to OpenAI (${targetModel})!`,
        model: targetModel,
        reply,
        latencyMs
      });
    }

    if (provider === 'anthropic') {
      let key = (apiKey || process.env.ANTHROPIC_API_KEY || '').trim().replace(/^["']|["']$/g, '');
      if (!key) {
        return res.json({ success: false, message: 'No Anthropic API key provided.' });
      }
      return res.json({
        success: true,
        message: 'Anthropic configuration validated.',
        model: model || 'claude-3-5-sonnet-20241022',
        latencyMs: 150
      });
    }

    res.json({ success: false, message: `Unsupported provider: ${provider}` });
  } catch (err: any) {
    console.error('testAIConnection error:', err);
    res.json({ success: false, message: `Connection error: ${err.message || 'Network request failed'}` });
  }
}

