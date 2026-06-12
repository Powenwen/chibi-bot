/**
 * Chibi Bot Dashboard - API Client
 * Centralized HTTP client for all dashboard API calls
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type { ApiResponse, ApiError } from '../types/api';

// Base API URL from environment (server root — routes are /auth/* and /api/*)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Rate limit tracking
 */
interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

let currentRateLimit: RateLimitInfo | null = null;

/**
 * Callback for when a 401 is detected — lets the store clear auth state
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/**
 * Create configured axios instance
 */
function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true, // Send session cookies
  });

  // Request interceptor - add auth headers if needed
  client.interceptors.request.use(
    (config) => {
      // Session cookie is sent automatically via withCredentials
      // Add request ID for tracing
      config.headers['X-Request-ID'] = generateRequestId();
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors and rate limits
  client.interceptors.response.use(
    (response) => {
      // Track rate limits from headers
      const limit = response.headers['x-ratelimit-limit'];
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset'];
      
      if (limit && remaining && reset) {
        currentRateLimit = {
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          resetAt: parseInt(reset) * 1000,
        };
      }

      return response;
    },
    (error: AxiosError<ApiResponse<unknown>>) => {
      const apiError = normalizeError(error);

      if (apiError.status === 401) {
        // Session expired or invalid — clear auth state and redirect
        console.warn('[API] 401 Unauthorized — clearing auth state');
        if (onUnauthorized) {
          onUnauthorized();
        }
      }

      if (apiError.status === 429) {
        // Rate limited
        const retryAfter = error.response?.headers['retry-after'];
        apiError.retryAfter = retryAfter ? parseInt(retryAfter) : 60;
        console.warn(`Rate limited. Retry after ${apiError.retryAfter}s`);
      }

      if (apiError.status === 503) {
        // Service unavailable (bot offline)
        console.error('Bot service unavailable');
      }

      return Promise.reject(apiError);
    }
  );

  return client;
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeError(error: AxiosError<ApiResponse<unknown>>): ApiError {
  if (error.response) {
    const data = error.response.data;
    return {
      code: data?.error?.code || `HTTP_${error.response.status}`,
      message: data?.error?.message || error.message,
      status: error.response.status,
    };
  }

  if (error.request) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    status: 500,
  };
}

// Singleton API client instance
const apiClient = createApiClient();

/**
 * Generic API request wrapper with type safety
 */
export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>({
    method,
    url: endpoint,
    data,
    ...config,
  });

  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Request failed');
  }

  return response.data.data as T;
}

/**
 * GET request helper
 */
export function get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('GET', endpoint, undefined, config);
}

/**
 * POST request helper
 */
export function post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('POST', endpoint, data, config);
}

/**
 * PUT request helper
 */
export function put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('PUT', endpoint, data, config);
}

/**
 * PATCH request helper
 */
export function patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('PATCH', endpoint, data, config);
}

/**
 * DELETE request helper
 */
export function del<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('DELETE', endpoint, undefined, config);
}

/**
 * Get current rate limit info
 */
export function getRateLimitInfo(): RateLimitInfo | null {
  return currentRateLimit;
}

/**
 * Check if we're currently rate limited
 */
export function isRateLimited(): boolean {
  if (!currentRateLimit) return false;
  if (currentRateLimit.remaining > 0) return false;
  return Date.now() < currentRateLimit.resetAt;
}

/**
 * Export the raw client for advanced use cases
 */
export { apiClient };

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string; uptime: number }> {
  const response = await apiClient.get('/health', { timeout: 5000 });
  return response.data;
}
