// Cliente HTTP. Mismos endpoints en modo mock y en modo real.
// Use the demo only when explicitly enabled. Missing .env must not silently
// make the application look connected while it is reading browser-local data.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const BASE = import.meta.env.VITE_API_URL || '/api';

export const tokenStore = {
  get: () => localStorage.getItem('token'),
  set: (t) => localStorage.setItem('token', t),
  clear: () => localStorage.removeItem('token'),
};

export async function request(method, path, body) {
  try {
    if (USE_MOCK) {
      const { mockRequest } = await import('./mockDb.js');
      return await mockRequest(method, path, body, tokenStore.get());
    }
    const token = tokenStore.get();
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('No responde el backend. Inicia Spring Boot y verifica que esté disponible en http://localhost:8080.');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(data?.message || 'Ocurrió un error en el servidor');
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (err) {
    const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (err.status === 401 && !isAuthCall) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw err;
  }
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
};
