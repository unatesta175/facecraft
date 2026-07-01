/**
 * Browser: use same-origin /api when served behind nginx (production).
 * Local dev (Next on :3000, API on :4000): use NEXT_PUBLIC_API_URL or localhost:4000.
 * SSR on server: use internal API_URL or localhost:4000.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    }
    return '';
  }

  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}
