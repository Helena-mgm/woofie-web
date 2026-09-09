import type { ApiResponse } from '@/types';
import { API_CONFIG, ERROR_MESSAGES } from '@/infrastructure/config/constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'woofie_token';
const LEGACY_TOKEN_KEY = 'token';
const AUTH_MARKER_KEY = 'woofie_auth';
const CSRF_COOKIE_KEY = 'woofie_csrf';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

export const tokenManager = {
  save: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  },

  remove: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      document.cookie = `${AUTH_MARKER_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `${CSRF_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  },

  exists: (): boolean => {
    if (typeof window === 'undefined') return false;
    return readCookie(AUTH_MARKER_KEY) === '1';
  },
};

class HttpClient {
  private baseURL: string;
  private debug = process.env.NEXT_PUBLIC_API_DEBUG === 'true';

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private debugInfo(...args: unknown[]): void {
    if (this.debug) {
      console.info(...args);
    }
  }

  private debugError(...args: unknown[]): void {
    if (this.debug) {
      console.error(...args);
    }
  }

  private createAbortSignal(externalSignal?: AbortSignal, customTimeout?: number) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, customTimeout ?? API_CONFIG.timeout);

    const abortExternal = () => controller.abort();

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', abortExternal);
      }
    }

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', abortExternal);
      }
    };

    return { signal: controller.signal, cleanup };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const csrfToken = readCookie(CSRF_COOKIE_KEY);
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: T | null = null;

    try {
      data = await response.json();
    } catch {
      // Response has no JSON body
      data = null;
    }

    if (!response.ok) {
      const message = this.getErrorMessage(response.status);
      throw new ApiError(message, response.status, data);
    }

    return {
      ok: true,
      data,
      status: response.status,
    };
  }

  private getErrorMessage(status: number): string {
    switch (status) {
      case 401:
        return ERROR_MESSAGES.unauthorized;
      case 403:
        return ERROR_MESSAGES.forbidden;
      case 404:
        return ERROR_MESSAGES.notFound;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.server;
      default:
        return ERROR_MESSAGES.unknown;
    }
  }

  async get<T = unknown>(path: string, signal?: AbortSignal): Promise<ApiResponse<T>> {
    const headers = this.getHeaders();
    this.debugInfo(`🌐 [API] GET ${path}`);

    const { signal: finalSignal, cleanup } = this.createAbortSignal(signal);

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: finalSignal,
      });

      this.debugInfo(`🌐 [API] Response ${path}:`, response.status, response.statusText);
      return await this.handleResponse<T>(response);
    } catch (error) {
      this.debugError(`❌ [API] Error GET ${path}:`, error);
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error
      throw new ApiError(ERROR_MESSAGES.network, 0);
    } finally {
      cleanup();
    }
  }

  async post<T = unknown>(path: string, body: unknown, timeout?: number): Promise<ApiResponse<T>> {
    const { signal, cleanup } = this.createAbortSignal(undefined, timeout);
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
        signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(ERROR_MESSAGES.network, 0);
    } finally {
      cleanup();
    }
  }

  async put<T = unknown>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const { signal, cleanup } = this.createAbortSignal();
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
        signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(ERROR_MESSAGES.network, 0);
    } finally {
      cleanup();
    }
  }

  async patch<T = unknown>(path: string, body: unknown, timeout?: number): Promise<ApiResponse<T>> {
    const { signal, cleanup } = this.createAbortSignal(undefined, timeout);
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        credentials: 'include',
        signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(ERROR_MESSAGES.network, 0);
    } finally {
      cleanup();
    }
  }

  async delete<T = unknown>(path: string): Promise<ApiResponse<T>> {
    const { signal, cleanup } = this.createAbortSignal();
    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include',
        signal,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(ERROR_MESSAGES.network, 0);
    } finally {
      cleanup();
    }
  }
}

export const apiClient = new HttpClient(API_CONFIG.baseUrl);

export const saveToken = tokenManager.save;
export const removeToken = tokenManager.remove;
export const isAuthenticated = tokenManager.exists;

export async function apiPost(path: string, body: unknown, timeout?: number) {
  try {
    const response = await apiClient.post(path, body, timeout);
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, data: error.data };
    }
    return { ok: false, status: 0, data: { error: ERROR_MESSAGES.network } };
  }
}

export async function apiPut(path: string, body: unknown) {
  try {
    const response = await apiClient.put(path, body);
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, data: error.data };
    }
    return { ok: false, status: 0, data: { error: ERROR_MESSAGES.network } };
  }
}

export async function apiPatch(path: string, body: unknown, timeout?: number) {
  try {
    const response = await apiClient.patch(path, body, timeout);
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, data: error.data };
    }
    return { ok: false, status: 0, data: { error: ERROR_MESSAGES.network } };
  }
}

export async function apiDelete(path: string) {
  try {
    const response = await apiClient.delete(path);
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, data: error.data };
    }
    return { ok: false, status: 0, data: { error: ERROR_MESSAGES.network } };
  }
}

export async function apiPostMultipart(path: string, formData: FormData) {
  try {
    const headers: Record<string, string> = {};

    const csrfToken = readCookie(CSRF_COOKIE_KEY);
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    const res = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: ERROR_MESSAGES.network } };
  }
}

export async function apiGet(path: string, signal?: AbortSignal) {
  try {
    const response = await apiClient.get(path, signal);
    return { ok: true, status: response.status, data: response.data };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, status: error.status, data: error.data };
    }
    return { ok: false, status: 0, data: { error: ERROR_MESSAGES.network } };
  }
}

export async function apiRequest(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };

  const csrfToken = readCookie(CSRF_COOKIE_KEY);
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_CONFIG.baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}
