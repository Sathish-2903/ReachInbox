import axios from 'axios';
import { EmailItem, SchedulePayload, UploadResult, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('reachinbox_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  getStatus: async (): Promise<{ googleConfigured: boolean; slackConfigured: boolean }> => {
    try {
      const res = await api.get<{ success: boolean; data: { googleConfigured: boolean; slackConfigured: boolean } }>('/auth/status');
      return res.data.data;
    } catch {
      return { googleConfigured: false, slackConfigured: false };
    }
  },
  getGoogleAuthUrl: async (): Promise<string> => {
    const res = await api.get<{ success: boolean; url: string }>('/auth/google');
    return res.data.url;
  },
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const res = await api.get<{ success: boolean; data: User }>('/auth/me');
      return res.data.data;
    } catch {
      return null;
    }
  },
  logout: () => {
    localStorage.removeItem('reachinbox_token');
  },
};

export const emailApi = {
  getScheduled: async (page = 1, limit = 50): Promise<{ items: EmailItem[]; total: number }> => {
    const res = await api.get<{ success: boolean; data: { items: EmailItem[]; pagination: { total: number } } }>(
      `/emails/scheduled?page=${page}&limit=${limit}`
    );
    return { items: res.data.data.items, total: res.data.data.pagination.total };
  },
  getSent: async (page = 1, limit = 50): Promise<{ items: EmailItem[]; total: number }> => {
    const res = await api.get<{ success: boolean; data: { items: EmailItem[]; pagination: { total: number } } }>(
      `/emails/sent?page=${page}&limit=${limit}`
    );
    return { items: res.data.data.items, total: res.data.data.pagination.total };
  },
  schedule: async (payload: SchedulePayload) => {
    const res = await api.post('/emails/schedule', payload);
    return res.data;
  },
  search: async (query: string): Promise<EmailItem[]> => {
    const res = await api.get<{ success: boolean; data: { items: EmailItem[] } }>(
      `/emails/search?q=${encodeURIComponent(query)}`
    );
    return res.data.data.items || [];
  },
  uploadFile: async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ success: boolean; data: UploadResult }>('/emails/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  parseText: async (text: string): Promise<UploadResult> => {
    const res = await api.post<{ success: boolean; data: UploadResult }>('/emails/upload', { text });
    return res.data.data;
  },
};

export const slackApi = {
  getAuthUrl: async (): Promise<string> => {
    const res = await api.get<{ success: boolean; url: string }>('/slack/auth');
    return res.data.url;
  },
  getStatus: async (): Promise<{ connected: boolean }> => {
    const res = await api.get<{ success: boolean; data: { connected: boolean } }>('/slack/status');
    return res.data.data;
  },
  disconnect: async () => {
    const res = await api.post('/slack/disconnect');
    return res.data;
  },
};
