const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const TOKEN_KEY = 'av_token';
const REQUEST_TIMEOUT_MS = 30_000;
const STREAM_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // Sync to cookie for Next.js middleware
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2,
): Promise<T> {
  const token = getToken();

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, { ...config, signal: controller.signal });

      if (response.status === 401) {
        clearToken();
        window.location.href = '/auth/login';
        throw new ApiError('No autenticado', 401);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'Error del servidor',
          response.status,
          data.details,
        );
      }

      // Unwrap { success, data, timestamp } envelope
      return (data.data !== undefined ? data.data : data) as T;
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof ApiError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('La solicitud tardó demasiado', 0);
      }
      if (attempt === retries) throw new ApiError('Error de conexión', 0);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new ApiError('Error inesperado', 0);
}

// SSE streaming for Claude responses
export async function* streamSSE(
  endpoint: string,
  body: object,
): AsyncGenerator<{ type: string; content?: string; messageId?: string; model?: string; error?: string }> {
  const token = getToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    throw new ApiError('Error al conectar con el servidor de IA', response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            yield JSON.parse(line.slice(6));
          } catch {
            // skip malformed chunks
          }
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

// Blob download (raw fetch without envelope unwrapping)
async function requestBlob(endpoint: string): Promise<Blob> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!response.ok) throw new ApiError('Error al descargar', response.status);
  return response.blob();
}

// Multipart file upload
async function uploadFile(endpoint: string, formData: FormData): Promise<any> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.message || 'Error al subir archivo', response.status);
  return data.data !== undefined ? data.data : data;
}

export const api = {
  auth: {
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    getProfile: () => request<any>('/auth/profile'),
    updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  tenants: {
    me: () => request<any>('/tenants/me'),
    update: (body: any) => request<any>('/tenants/me', { method: 'PATCH', body: JSON.stringify(body) }),
    stats: () => request<any>('/tenants/me/stats'),
    usage: () => request<any>('/tenants/me/usage'),
  },

  users: {
    list: () => request<any[]>('/users'),
    me: () => request<any>('/auth/profile'),
    updateMe: (data: any) => request<any>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    invite: (body: any) => request<any>('/users/invite', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
    deactivate: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
  },

  ai: {
    listAdvisors: () => request<any[]>('/ai/advisors'),
    getAdvisor: (id: string) => request<any>(`/ai/advisors/${id}`),
    createConversation: (body: any) => request<any>('/ai/conversation', { method: 'POST', body: JSON.stringify(body) }),
    sendMessage: (id: string, body: any) => request<any>(`/ai/conversation/${id}/message`, { method: 'POST', body: JSON.stringify(body) }),
    streamMessage: (id: string, content: string) => streamSSE(`/ai/conversation/${id}/stream`, { content }),
    getConversation: (id: string) => request<any>(`/ai/conversation/${id}`),
    listConversations: (params?: string) => request<any>(`/ai/conversations${params ? '?' + params : ''}`),
    analyzeDocument: (body: any) => request<any>('/ai/analyze', { method: 'POST', body: JSON.stringify(body) }),
  },

  contracts: {
    list: (params?: string) => request<any>(`/contracts${params ? '?' + params : ''}`),
    get: (id: string) => request<any>(`/contracts/${id}`),
    create: (body: any) => request<any>('/contracts', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/contracts/${id}`, { method: 'DELETE' }),
    versions: (id: string) => request<any[]>(`/contracts/${id}/versions`),
    downloadPdf: (id: string) => requestBlob(`/contracts/${id}/pdf`),
  },

  documents: {
    upload: (formData: FormData) => uploadFile('/documents/upload', formData),
  },

  analysis: {
    list: (params?: string) => request<any>(`/analysis${params ? '?' + params : ''}`),
    get: (id: string) => request<any>(`/analysis/${id}`),
    overview: () => request<any>('/analysis/overview'),
  },

  compliance: {
    list: (params?: string) => request<any>(`/compliance${params ? '?' + params : ''}`),
    get: (id: string) => request<any>(`/compliance/${id}`),
    create: (body: any) => request<any>('/compliance', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/compliance/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/compliance/${id}`, { method: 'DELETE' }),
    upcoming: (days?: number) => request<any[]>(`/compliance/upcoming${days ? '?days=' + days : ''}`),
  },

  billing: {
    wallet: () => request<any>('/billing/wallet'),
    transactions: (params?: string) => request<any>(`/billing/transactions${params ? '?' + params : ''}`),
    checkout: (body: any) => request<any>('/billing/checkout', { method: 'POST', body: JSON.stringify(body) }),
    buyCredits: (pack: string) => request<any>('/billing/credits/buy', { method: 'POST', body: JSON.stringify({ pack }) }),
  },

  alerts: {
    list: (params?: string) => request<any>(`/alerts${params ? '?' + params : ''}`),
    unreadCount: () => request<any>('/alerts/unread-count'),
    markRead: (id: string) => request<any>(`/alerts/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<any>('/alerts/mark-all-read', { method: 'POST' }),
  },

  dashboard: {
    stats: () => request<any>('/tenants/me/stats'),
  },
};
