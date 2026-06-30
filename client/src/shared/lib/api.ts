import type { ApiResponse } from '@/types';
import { API_CONFIG, ERROR_MESSAGES } from '@/infrastructure/config/constants';

// Classe d'erreur personnalisée
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

// Token management with cookies support
const TOKEN_KEY = 'woofie_token';
const LEGACY_TOKEN_KEY = 'token'; // Backward compatibility

export const tokenManager = {
  save: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      // Also save as legacy key for backward compatibility
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
      // Also set as cookie for middleware
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  },

  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    // Try new key first, then fallback to legacy
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  },

  remove: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      // Remove cookie
      document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  },

  exists: (): boolean => {
    return !!tokenManager.get();
  },
};

// HTTP Client avec gestion d'erreurs
class HttpClient {
  private baseURL: string;
  private debug = process.env.NEXT_PUBLIC_API_DEBUG === 'true';

  constructor(baseURL: string) {
    this.baseURL = baseURL;
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

    const token = tokenManager.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    if (this.debug) {
      console.log(`🌐 [API] GET ${path}`, { headers: { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'MISSING' } });
    }

    const { signal: finalSignal, cleanup } = this.createAbortSignal(signal);

    try {
      const response = await fetch(`${this.baseURL}${path}`, {
        method: 'GET',
        headers,
        signal: finalSignal,
      });

      if (this.debug) {
        console.log(`🌐 [API] Response ${path}:`, response.status, response.statusText);
      }
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (this.debug) {
        console.error(`❌ [API] Error GET ${path}:`, error);
      }
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

// Export singleton instance
export const apiClient = new HttpClient(API_CONFIG.baseUrl);

// Backwards compatibility exports
export const saveToken = tokenManager.save;
export const getToken = tokenManager.get;
export const removeToken = tokenManager.remove;
export const isAuthenticated = tokenManager.exists;

// Legacy function wrappers (pour compatibilité avec le code existant)
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
    const token = tokenManager.get();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData, browser will set it with boundary
    const res = await fetch(`${API_CONFIG.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
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

// Generic API request function for fetch-like usage
export async function apiRequest(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const token = tokenManager.get();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_CONFIG.baseUrl}${path}`, {
    ...options,
    headers,
  });
}
