import { AIProvider, AIProviderContext, GeneratedFileChange, GeneratedPlan } from './AIProvider.js';
import { MockAIProvider } from './MockAIProvider.js';

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic Claude Provider';
  private apiKey: string;
  private model: string;
  private fallback: MockAIProvider;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
    this.fallback = new MockAIProvider();
  }

  async generatePlan(context: AIProviderContext): Promise<GeneratedPlan> {
    if (!this.apiKey) {
      return this.fallback.generatePlan(context);
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: `${context.systemInstructions}\nOutput ONLY valid JSON matching: { "summary": string, "steps": [{ "stepNumber": number, "title": string, "description": string, "filesToModify": string[] }], "riskAssessment": "low"|"medium"|"high", "estimatedFilesCount": number }`,
          messages: [
            {
              role: 'user',
              content: `Create plan for: ${context.prompt}\nTech Stack: ${context.technologyStack}`
            }
          ]
        })
      });
      if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
      const data = await response.json() as any;
      const text = data.content[0].text;
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      return JSON.parse(text.slice(jsonStart, jsonEnd));
    } catch (err) {
      console.warn('Anthropic generatePlan error, falling back:', err);
      return this.fallback.generatePlan(context);
    }
  }

  async generateCodeChanges(context: AIProviderContext, plan: GeneratedPlan): Promise<GeneratedFileChange[]> {
    if (!this.apiKey) {
      return this.fallback.generateCodeChanges(context, plan);
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: `${context.systemInstructions}\nOutput ONLY valid JSON matching: { "fileChanges": [{ "filePath": string, "changeType": "modified"|"added"|"deleted", "diff": string, "originalContent": string, "modifiedContent": string, "additions": number, "deletions": number }] }`,
          messages: [
            {
              role: 'user',
              content: `Implement changes for plan: ${JSON.stringify(plan)}\nPrompt: ${context.prompt}`
            }
          ]
        })
      });
      if (!response.ok) throw new Error(`Anthropic error: ${response.statusText}`);
      const data = await response.json() as any;
      const text = data.content[0].text;
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
      return parsed.fileChanges || [];
    } catch (err) {
      console.warn('Anthropic generateCodeChanges error, falling back:', err);
      return this.fallback.generateCodeChanges(context, plan);
    }
  }

  async chat(message: string, history: Array<{ sender: string; content: string }>, context: AIProviderContext): Promise<string> {
    if (!this.apiKey) return this.fallback.chat(message, history, context);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2048,
          system: context.systemInstructions,
          messages: [
            ...history.map(h => ({ role: (h.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: h.content })),
            { role: 'user' as const, content: message }
          ]
        })
      });
      const data = await response.json() as any;
      return data.content[0].text;
    } catch {
      return this.fallback.chat(message, history, context);
    }
  }
}

