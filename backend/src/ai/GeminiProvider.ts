import { AIProvider, AIProviderContext, AttachedImageContext, GeneratedFileChange, GeneratedPlan } from './AIProvider.js';
import { MockAIProvider } from './MockAIProvider.js';

function extractImageParts(image?: AttachedImageContext, message?: string) {
  let mimeType = image?.mimeType || 'image/png';
  let base64 = image?.base64 || '';

  if (!base64 && image?.dataUrl) {
    const match = image.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64 = match[2];
    }
  }

  // Also check if message contains a markdown data URL image: ![...](data:image/...;base64,...)
  if (!base64 && message) {
    const match = message.match(/!\[.*?\]\(data:([^;]+);base64,([^)]+)\)/);
    if (match) {
      mimeType = match[1];
      base64 = match[2];
    }
  }

  if (base64) {
    return {
      inlineData: {
        mimeType,
        data: base64
      }
    };
  }

  return null;
}

function formatGeminiContents(
  history: Array<{ sender: string; content: string }>,
  message: string,
  image?: AttachedImageContext
) {
  const turns: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

  // Filter valid non-empty history and exclude error banners
  const validHistory = (history || [])
    .filter(h => h.content && h.content.trim() && !h.content.startsWith('⚠️'))
    .slice(-10);

  for (const h of validHistory) {
    const role: 'user' | 'model' = h.sender === 'user' ? 'user' : 'model';
    // Gemini multiturn conversation MUST start with user turn
    if (turns.length === 0 && role === 'model') {
      continue;
    }
    // Clean history from data:image inline strings to keep payload size lightweight
    const cleanHistoryText = h.content.replace(/!\[.*?\]\(data:[^)]+\)\s*/g, '[Attached Screenshot/Image]').trim();
    if (!cleanHistoryText) continue;

    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n\n${cleanHistoryText}`;
    } else {
      turns.push({ role, parts: [{ text: cleanHistoryText }] });
    }
  }

  // Build current user prompt with optional image
  const imagePart = extractImageParts(image, message);
  const cleanPrompt = message.replace(/!\[.*?\]\(data:[^)]+\)\s*/g, '').trim() || (imagePart ? 'Please inspect and analyze this attached image / screenshot.' : message.trim());

  const currentParts: Array<any> = [];
  if (imagePart) {
    currentParts.push(imagePart);
  }
  currentParts.push({ text: cleanPrompt });

  const last = turns[turns.length - 1];
  if (last && last.role === 'user') {
    if (imagePart) {
      last.parts.unshift(imagePart);
    }
    last.parts[last.parts.length - 1].text += `\n\n${cleanPrompt}`;
  } else {
    turns.push({ role: 'user', parts: currentParts });
  }

  if (turns.length === 0 || turns[0].role !== 'user') {
    return [{ role: 'user' as const, parts: currentParts }];
  }

  return turns;
}

function normalizeGeminiModel(model: string): string {
  if (!model) return 'gemini-3.5-flash';
  const clean = model.replace(/^models\//, '').trim();
  if (
    clean.includes('1.5-flash') ||
    clean.includes('2.0-flash') ||
    clean.includes('2.5-flash') ||
    clean === 'gemini-flash'
  ) {
    return 'gemini-3.5-flash';
  }
  if (
    clean.includes('1.5-pro') ||
    clean.includes('2.0-pro') ||
    clean.includes('2.5-pro') ||
    clean === 'gemini-pro'
  ) {
    return 'gemini-3.5-flash';
  }
  return clean;
}

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini Provider';
  private apiKey: string;
  private model: string;
  private fallback: MockAIProvider;

  constructor(apiKey: string, model: string = 'gemini-3.5-flash') {
    this.apiKey = (apiKey || '').trim().replace(/^["']|["']$/g, '');
    this.model = normalizeGeminiModel(model || 'gemini-3.5-flash');
    this.fallback = new MockAIProvider();
  }

  private getCandidateModels(): string[] {
    const list = [
      this.model,
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite'
    ];
    return Array.from(new Set(list));
  }

  async generatePlan(context: AIProviderContext): Promise<GeneratedPlan> {
    if (!this.apiKey) {
      return this.fallback.generatePlan(context);
    }

    for (const modelToTry of this.getCandidateModels()) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${this.apiKey}`;
        const systemPrompt = `${context.systemInstructions}\nGenerate a JSON plan matching: { "summary": string, "steps": [{ "stepNumber": number, "title": string, "description": string, "filesToModify": string[] }], "riskAssessment": "low"|"medium"|"high", "estimatedFilesCount": number }`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nTask: ${context.prompt}\nTech Stack: ${context.technologyStack}` }]
              }
            ],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (!response.ok) continue;
        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text);
      } catch (err) {
        continue;
      }
    }

    return this.fallback.generatePlan(context);
  }

  async generateCodeChanges(context: AIProviderContext, plan: GeneratedPlan): Promise<GeneratedFileChange[]> {
    if (!this.apiKey) {
      return this.fallback.generateCodeChanges(context, plan);
    }

    for (const modelToTry of this.getCandidateModels()) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${this.apiKey}`;
        const prompt = `Based on plan: ${JSON.stringify(plan)}\nProduce JSON matching: { "fileChanges": [{ "filePath": string, "changeType": "modified"|"added"|"deleted", "diff": string, "originalContent": string, "modifiedContent": string, "additions": number, "deletions": number }] }`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (!response.ok) continue;
        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return parsed.fileChanges || [];
        }
      } catch (err) {
        continue;
      }
    }

    return this.fallback.generateCodeChanges(context, plan);
  }

  async chat(message: string, history: Array<{ sender: string; content: string }>, context: AIProviderContext): Promise<string> {
    if (!this.apiKey) return this.fallback.chat(message, history, context);

    const candidateModels = this.getCandidateModels();
    let lastError = '';

    for (const modelToTry of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${this.apiKey}`;
        const systemPrompt = [
          context.systemInstructions || 'You are an expert AI software engineer assistant.',
          context.technologyStack ? `Technology Stack: ${context.technologyStack}` : '',
          context.codingStandards ? `Coding Standards: ${context.codingStandards}` : '',
          context.architectureRules ? `Architecture Rules: ${context.architectureRules}` : ''
        ].filter(Boolean).join('\n\n');

        const contents = formatGeminiContents(history, message, context.image);

        const requestBody: any = {
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        };

        if (systemPrompt.trim()) {
          requestBody.systemInstruction = { parts: [{ text: systemPrompt.trim() }] };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errText = await response.text();
          let errMsg = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const parsed = JSON.parse(errText);
            errMsg = parsed.error?.message || errMsg;
          } catch {}
          lastError = errMsg;
          console.warn(`Gemini chat model ${modelToTry} failed (${response.status}):`, errMsg);
          continue;
        }

        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Gemini chat model ${modelToTry} error:`, err.message);
        continue;
      }
    }

    return `⚠️ **Gemini API Error**: ${lastError || 'All Gemini models unavailable'}\n\nFalling back to offline assistant:\n\n${await this.fallback.chat(message, history, context)}`;
  }

  async chatStream(
    message: string,
    history: Array<{ sender: string; content: string }>,
    context: AIProviderContext,
    onChunk: (token: string) => void
  ): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.chatStream ? this.fallback.chatStream(message, history, context, onChunk) : this.chat(message, history, context);
    }

    const candidateModels = this.getCandidateModels();
    let lastError = '';

    for (const modelToTry of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
        const systemPrompt = [
          context.systemInstructions || 'You are an expert AI software engineer assistant.',
          context.technologyStack ? `Technology Stack: ${context.technologyStack}` : '',
          context.codingStandards ? `Coding Standards: ${context.codingStandards}` : ''
        ].filter(Boolean).join('\n\n');

        const contents = formatGeminiContents(history, message, context.image);

        const requestBody: any = {
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        };

        if (systemPrompt.trim()) {
          requestBody.systemInstruction = { parts: [{ text: systemPrompt.trim() }] };
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok || !response.body) {
          const errText = await response.text().catch(() => '');
          lastError = `HTTP ${response.status}: ${errText.slice(0, 100)}`;
          console.warn(`Gemini stream model ${modelToTry} failed (${response.status}), trying next candidate...`);
          continue;
        }

        let accumulated = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamFailed = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.error) {
                  lastError = parsed.error.message;
                  streamFailed = true;
                  break;
                }
                const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (textChunk) {
                  accumulated += textChunk;
                  onChunk(textChunk);
                }
              } catch {}
            }
          }
          if (streamFailed) break;
        }

        if (streamFailed || !accumulated.trim()) {
          console.warn(`Gemini stream model ${modelToTry} produced empty or error stream, trying next candidate...`);
          continue;
        }

        return accumulated;
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Gemini stream model ${modelToTry} threw exception:`, err.message);
        continue;
      }
    }

    console.warn('All Gemini stream candidates failed, attempting non-streaming chat...');
    return this.chat(message, history, context);
  }
}
