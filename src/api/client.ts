let currentToken: string | null = null;

export function setApiToken(token: string | null) {
  currentToken = token;
}

export function getApiToken(): string | null {
  return currentToken;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (currentToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // Needed for httpOnly refresh cookies!
  });

  // If 401 and we had a token, attempt refresh once
  if (response.status === 401 && currentToken && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.token) {
          setApiToken(data.token);
          headers.set('Authorization', `Bearer ${data.token}`);
          const retryRes = await fetch(endpoint, {
            ...options,
            headers,
            credentials: 'include'
          });
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({ error: 'Erro na requisição.' }));
            throw new Error(errData.error || `Erro ${retryRes.status}`);
          }
          return retryRes.json();
        }
      }
    } catch {
      // Refresh failed, clear token
      setApiToken(null);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro inesperado no servidor.' }));
    throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
