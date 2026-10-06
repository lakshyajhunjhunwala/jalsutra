/**
 * API Configuration & Endpoint Resolver
 *
 * Automatically resolves API URLs:
 * - On Vercel / Remote CDN: routes directly to https://jalsutra.onrender.com to bypass
 *   Vercel's 10-second serverless proxy execution limit (preventing 502 Bad Gateway).
 * - On Localhost: routes to `/api/...` on the local Express server.
 * - Supports VITE_API_URL environment variable override.
 */

export function getApiUrl(path: string): string {
  const isVercelOrRemote =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  const baseUrl =
    (import.meta as any).env?.VITE_API_URL ||
    (isVercelOrRemote ? 'https://jalsutra.onrender.com' : '');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
