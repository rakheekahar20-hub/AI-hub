import { apiRequest } from './api.js';
import { Agent, CreateAgentDTO, UpdateAgentDTO, AgentExecution } from '../types/index.js';

export const agentService = {
  async getAgents(): Promise<Agent[]> {
    const res = await apiRequest<{ agents: Agent[] }>('/agents');
    return res.agents;
  },

  async getAgent(id: string): Promise<Agent> {
    const res = await apiRequest<{ agent: Agent }>(`/agents/${id}`);
    return res.agent;
  },

  async createAgent(data: CreateAgentDTO): Promise<Agent> {
    const res = await apiRequest<{ agent: Agent }>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.agent;
  },

  async updateAgent(id: string, data: UpdateAgentDTO): Promise<Agent> {
    const res = await apiRequest<{ agent: Agent }>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.agent;
  },

  async deleteAgent(id: string): Promise<void> {
    await apiRequest(`/agents/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicateAgent(id: string): Promise<Agent> {
    const res = await apiRequest<{ agent: Agent }>(`/agents/${id}/duplicate`, {
      method: 'POST',
    });
    return res.agent;
  },

  async testRepository(data: { repositoryUrl: string; authMethod: string; gitToken?: string }, agentId?: string): Promise<any> {
    const endpoint = agentId ? `/agents/${agentId}/repository/test` : '/agents/repository/test';
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async syncRepository(agentId: string): Promise<any> {
    return apiRequest(`/agents/${agentId}/repository/sync`, {
      method: 'POST',
    });
  },

  async testServer(serverConfig: any, agentId?: string): Promise<any> {
    const endpoint = agentId ? `/agents/${agentId}/servers/test` : '/agents/servers/test';
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(serverConfig),
    });
  },

  async getAgentExecutions(agentId: string): Promise<AgentExecution[]> {
    const res = await apiRequest<{ executions: AgentExecution[] }>(`/agents/${agentId}/executions`);
    return res.executions;
  }
};

