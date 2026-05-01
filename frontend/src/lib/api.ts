const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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

// Single in-flight refresh promise para evitar múltiples /auth/refresh paralelos
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      // Liberar el lock en el próximo tick
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/auth/')) return;
  const redirect = window.location.pathname + window.location.search;
  window.location.href = `/auth/login?redirect=${encodeURIComponent(redirect)}`;
}

async function rawFetch(endpoint: string, init: RequestInit, signal?: AbortSignal) {
  return fetch(`${API_BASE}${endpoint}`, {
    ...init,
    credentials: 'include',
    signal,
  });
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2,
): Promise<T> {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      let response = await rawFetch(endpoint, config, controller.signal);

      // Auto-refresh en 401 (excepto en el endpoint de refresh mismo)
      if (response.status === 401 && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/login')) {
        const refreshed = await refreshSession();
        if (refreshed) {
          response = await rawFetch(endpoint, config, controller.signal);
        } else {
          redirectToLogin();
          throw new ApiError('No autenticado', 401);
        }
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new ApiError(
          data.message || 'Error del servidor',
          response.status,
          data.details,
        );
      }

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  let response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
    signal: controller.signal,
  });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearTimeout(timeout);
      redirectToLogin();
      throw new ApiError('No autenticado', 401);
    }
    response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: controller.signal,
    });
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeout);
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

async function requestBlob(endpoint: string): Promise<Blob> {
  let response = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(`${API_BASE}${endpoint}`, { credentials: 'include' });
    }
  }
  if (!response.ok) throw new ApiError('Error al descargar', response.status);
  return response.blob();
}

async function uploadFile(endpoint: string, formData: FormData): Promise<any> {
  let response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
    }
  }
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.message || 'Error al subir archivo', response.status);
  return data.data !== undefined ? data.data : data;
}

export const api = {
  auth: {
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
    refresh: () => refreshSession(),
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
    subscribe: (plan: string) => request<any>('/billing/subscribe', { method: 'POST', body: JSON.stringify({ plan }) }),
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
