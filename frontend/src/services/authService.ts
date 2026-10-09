import { apiRequest } from './api.js';
import { User } from '../types/index.js';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, password?: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('ai_hub_token', data.token);
    localStorage.setItem('ai_hub_user', JSON.stringify(data.user));
    return data;
  },

  async register(email: string, password?: string, name?: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem('ai_hub_token', data.token);
    localStorage.setItem('ai_hub_user', JSON.stringify(data.user));
    return data;
  },

  async demoLogin(): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/demo', {
      method: 'POST',
    });
    localStorage.setItem('ai_hub_token', data.token);
    localStorage.setItem('ai_hub_user', JSON.stringify(data.user));
    return data;
  },

  async firebaseAuth(email: string, name?: string, provider: string = 'firebase'): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ email, name, provider }),
    });
    localStorage.setItem('ai_hub_token', data.token);
    localStorage.setItem('ai_hub_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return apiRequest<{ user: User }>('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('ai_hub_token');
    localStorage.removeItem('ai_hub_user');
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem('ai_hub_user');
    return stored ? JSON.parse(stored) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('ai_hub_token');
  }
};

