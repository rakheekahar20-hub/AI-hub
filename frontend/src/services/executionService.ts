import { apiRequest, API_BASE } from './api.js';
import { AgentExecution, AgentExecutionLog } from '../types/index.js';

export const executionService = {
  async startExecution(agentId: string, prompt: string, isDemo?: boolean): Promise<AgentExecution> {
    const res = await apiRequest<{ execution: AgentExecution }>(`/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ prompt, isDemo }),
    });
    return res.execution;
  },

  async getExecution(id: string): Promise<AgentExecution> {
    const res = await apiRequest<{ execution: AgentExecution }>(`/executions/${id}`);
    return res.execution;
  },

  async approve(id: string, options: { approveAll?: boolean; fileIds?: string[] } = {}): Promise<any> {
    return apiRequest(`/executions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  async reject(id: string, options: { reason?: string; fileIds?: string[] } = {}): Promise<any> {
    return apiRequest(`/executions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  },

  async commit(id: string, commitMessage?: string): Promise<any> {
    return apiRequest(`/executions/${id}/commit`, {
      method: 'POST',
      body: JSON.stringify({ commitMessage }),
    });
  },

  async push(id: string): Promise<any> {
    return apiRequest(`/executions/${id}/push`, {
      method: 'POST',
    });
  },

  async deploy(id: string): Promise<any> {
    return apiRequest(`/executions/${id}/deploy`, {
      method: 'POST',
    });
  },

  async getLogs(id: string): Promise<AgentExecutionLog[]> {
    const res = await apiRequest<{ logs: AgentExecutionLog[] }>(`/executions/${id}/logs`);
    return res.logs;
  },

  /**
   * Subscribe to live execution events via SSE
   */
  subscribeToExecution(id: string, onEvent: (event: any) => void): () => void {
    const eventSource = new EventSource(`${API_BASE}/executions/${id}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream error/reconnecting:', err);
    };

    return () => {
      eventSource.close();
    };
  }
};

