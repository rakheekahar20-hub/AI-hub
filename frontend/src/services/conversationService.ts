import { API_BASE, apiRequest } from './api.js';
import { Conversation, Message } from '../types/index.js';

export const conversationService = {
  async getConversations(): Promise<Conversation[]> {
    const res = await apiRequest<{ conversations: Conversation[] }>('/conversations');
    return res.conversations;
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await apiRequest<{ conversation: Conversation }>(`/conversations/${id}`);
    return res.conversation;
  },

  async createConversation(agentId: string, title?: string): Promise<Conversation> {
    const res = await apiRequest<{ conversation: Conversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ agentId, title }),
    });
    return res.conversation;
  },

  async deleteConversation(id: string): Promise<{ success: boolean; message?: string }> {
    return apiRequest<{ success: boolean; message?: string }>(`/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async addMessage(conversationId: string, content: string, sender: 'user' | 'agent' = 'user', executionId?: string): Promise<Message> {
    const res = await apiRequest<{ message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, sender, executionId }),
    });
    return res.message;
  },

  async sendChatMessage(
    conversationId: string,
    message: string,
    agentId: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal,
    provider?: string,
    model?: string,
    image?: { dataUrl: string; mimeType: string; name?: string }
  ): Promise<{ reply: string; message: Message }> {
    const token = localStorage.getItem('ai_hub_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (onChunk) {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          image,
          conversationId,
          agentId,
          stream: true,
          provider,
          model,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body stream not available');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      let finalMessage: Message | null = null;

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
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                onChunk(parsed.chunk);
              }
              if (parsed.done && parsed.message) {
                finalMessage = parsed.message;
              }
            } catch {}
          }
        }
      }

      return {
        reply: accumulated,
        message: finalMessage || {
          id: 'temp-' + Date.now(),
          conversationId,
          sender: 'agent',
          content: accumulated,
          createdAt: new Date().toISOString(),
        },
      };
    }

    const res = await apiRequest<{ reply: string; message: Message }>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        image,
        conversationId,
        agentId,
        stream: false,
        provider,
        model,
      }),
      signal,
    });

    return res;
  }
};

