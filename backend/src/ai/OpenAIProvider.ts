import { AIProvider, AIProviderContext, GeneratedFileChange, GeneratedPlan } from './AIProvider.js';
import { MockAIProvider } from './MockAIProvider.js';
import { GeminiProvider } from './GeminiProvider.js';

function formatOpenAIUserContent(message: string, image?: any) {
  let imgUrl = image?.dataUrl;
  if (!imgUrl && message) {
    const match = message.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
    if (match) imgUrl = match[1];
  }

  if (imgUrl) {
    const cleanPrompt = message.replace(/!\[.*?\]\(data:[^)]+\)\s*/g, '').trim() || 'Please inspect and analyze this attached image/screenshot.';
    return [
      { type: 'text', text: cleanPrompt },
      { type: 'image_url', image_url: { url: imgUrl } }
    ];
  }
  return message;
}

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI Provider';
  private apiKey: string;
  private model: string;
  private fallback: MockAIProvider;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
    this.fallback = new MockAIProvider();
  }

  async generatePlan(context: AIProviderContext): Promise<GeneratedPlan> {
    if (!this.apiKey) {
      return this.fallback.generatePlan(context);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `${context.systemInstructions}\nRespond strictly with JSON matching: { "summary": string, "steps": [{ "stepNumber": number, "title": string, "description": string, "filesToModify": string[] }], "riskAssessment": "low"|"medium"|"high", "estimatedFilesCount": number }`
            },
            {
              role: 'user',
              content: `Create an implementation plan for: ${context.prompt}\nTech stack: ${context.technologyStack}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed as GeneratedPlan;
    } catch (err) {
      console.warn('OpenAI generatePlan failed, falling back to mock provider:', err);
      return this.fallback.generatePlan(context);
    }
  }

  async generateCodeChanges(context: AIProviderContext, plan: GeneratedPlan): Promise<GeneratedFileChange[]> {
    if (!this.apiKey) {
      return this.fallback.generateCodeChanges(context, plan);
    }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `${context.systemInstructions}\nRespond strictly with JSON matching: { "fileChanges": [{ "filePath": string, "changeType": "modified"|"added"|"deleted", "diff": string, "originalContent": string, "modifiedContent": string, "additions": number, "deletions": number }] }`
            },
            {
              role: 'user',
              content: `Implement changes for plan: ${JSON.stringify(plan)}\nPrompt: ${context.prompt}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });
      if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
      const data = await response.json() as any;
      const parsed = JSON.parse(data.choices[0].message.content);
      return parsed.fileChanges || [];
    } catch (err) {
      console.warn('OpenAI generateCodeChanges failed, using fallback:', err);
      return this.fallback.generateCodeChanges(context, plan);
    }
  }

  async chat(message: string, history: Array<{ sender: string; content: string }>, context: AIProviderContext): Promise<string> {
    if (!this.apiKey) return this.fallback.chat(message, history, context);
    try {
      const systemPrompt = [
        context.systemInstructions || 'You are an expert AI software engineer assistant.',
        context.technologyStack ? `Technology Stack: ${context.technologyStack}` : '',
        context.codingStandards ? `Coding Standards: ${context.codingStandards}` : '',
        context.architectureRules ? `Architecture Rules: ${context.architectureRules}` : ''
      ].filter(Boolean).join('\n\n');

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(h => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.content.replace(/!\[.*?\]\(data:[^)]+\)\s*/g, '[Attached Screenshot/Image]').trim() || h.content
        })),
        { role: 'user', content: formatOpenAIUserContent(message, context.image) }
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ model: this.model, messages })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`OpenAI error HTTP ${res.status}:`, errText);
        const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
        if (geminiKey) {
          console.log('OpenAI failed (e.g. 429 quota exhausted). Auto-routing to Google Gemini...');
          const gemini = new GeminiProvider(geminiKey, process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.5-flash');
          return await gemini.chat(message, history, context);
        }
        return `⚠️ **OpenAI API Error** (${res.status}): ${res.statusText}\n\nFalling back to offline assistant:\n\n${await this.fallback.chat(message, history, context)}`;
      }

      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content || this.fallback.chat(message, history, context);
    } catch (err: any) {
      console.warn('OpenAI chat failed:', err);
      const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
      if (geminiKey) {
        const gemini = new GeminiProvider(geminiKey, process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.5-flash');
        return await gemini.chat(message, history, context);
      }
      return this.fallback.chat(message, history, context);
    }
  }

  async chatStream(
    message: string,
    history: Array<{ sender: string; content: string }>,
    context: AIProviderContext,
    onChunk: (token: string) => void
  ): Promise<string> {
    if (!this.apiKey) {
      const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
      if (geminiKey) {
        const gemini = new GeminiProvider(geminiKey, process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.5-flash');
        return await gemini.chatStream(message, history, context, onChunk);
      }
      return this.fallback.chatStream ? this.fallback.chatStream(message, history, context, onChunk) : this.chat(message, history, context);
    }

    try {
      const systemPrompt = [
        context.systemInstructions || 'You are an expert AI software engineer assistant.',
        context.technologyStack ? `Technology Stack: ${context.technologyStack}` : '',
        context.codingStandards ? `Coding Standards: ${context.codingStandards}` : ''
      ].filter(Boolean).join('\n\n');

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(h => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.content.replace(/!\[.*?\]\(data:[^)]+\)\s*/g, '[Attached Screenshot/Image]').trim() || h.content
        })),
        { role: 'user', content: formatOpenAIUserContent(message, context.image) }
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ model: this.model, messages, stream: true })
      });

      if (!res.ok || !res.body) {
        const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
        if (geminiKey) {
          console.log('OpenAI stream failed. Auto-routing to Google Gemini stream...');
          const gemini = new GeminiProvider(geminiKey, process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.5-flash');
          return await gemini.chatStream(message, history, context, onChunk);
        }
        return this.chat(message, history, context);
      }

      let accumulated = '';
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                accumulated += chunk;
                onChunk(chunk);
              }
            } catch {}
          }
        }
      }

      return accumulated || this.chat(message, history, context);
    } catch (err) {
      console.warn('OpenAI chatStream failed:', err);
      return this.fallback.chatStream ? this.fallback.chatStream(message, history, context, onChunk) : this.chat(message, history, context);
    }
  }
}

