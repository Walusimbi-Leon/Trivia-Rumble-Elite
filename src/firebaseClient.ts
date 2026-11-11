/**
 * Firebase Realtime Database Data Client for Trivia Rumble Elite
 * 
 * Works through the same-origin `/firebase` proxy to bypass Discord Activity
 * iframe sandbox restrictions and rate limits.
 */

const FB_BASE = '/firebase';
const NS = 'studio-3101124565-bd63c-default-rtdb';

function buildUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  const sep = cleanPath.includes('?') ? '&' : '?';
  return `${FB_BASE}/${cleanPath}.json${sep}ns=${NS}`;
}

async function fbRequest<T>(path: string, method: string, body?: unknown): Promise<T | null> {
  const url = buildUrl(path);
  try {
    let res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok && method !== 'GET' && method !== 'POST') {
      // Fallback for sandboxes that restrict PUT/PATCH/DELETE: POST with X-Fb-Method
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Fb-Method': method,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }

    if (!res.ok) {
      console.warn(`[FirebaseClient] HTTP ${res.status} on ${method} ${path}`);
      return null;
    }

    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch (err) {
    console.warn(`[FirebaseClient] Request failed (${method} ${path}):`, err);
    return null;
  }
}

export async function dbRead<T>(path: string): Promise<T | null> {
  return fbRequest<T>(path, 'GET');
}

export async function dbReadRange<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, v);
  }
  return fbRequest<T>(`${path}?${qs.toString()}`, 'GET');
}

export async function dbWrite<T>(path: string, data: unknown): Promise<T | null> {
  return fbRequest<T>(path, 'PUT', data);
}

export async function dbUpdate<T>(path: string, data: unknown): Promise<T | null> {
  return fbRequest<T>(path, 'PATCH', data);
}

export async function dbDelete<T>(path: string): Promise<T | null> {
  return fbRequest<T>(path, 'DELETE');
}
