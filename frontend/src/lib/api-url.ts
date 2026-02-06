/**
 * API URL utilities for connecting to the backend service.
 * Uses environment variables with fallbacks for local development.
 */

/**
 * Get the full URL for an API endpoint on the main backend.
 * @param path - The API path (e.g., '/api/chat')
 * @returns Full URL to the API endpoint
 */
export function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return `${baseUrl}${path}`;
}

/**
 * Get the full URL for an API endpoint on the Memory service.
 * @param path - The API path (e.g., '/memories')
 * @returns Full URL to the Memory API endpoint
 */
export function getMemoryApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_MEMORY_API_URL || 'http://localhost:8000';
  return `${baseUrl}${path}`;
}
