import { useAppStore } from '../store/useAppStore';
import { resetToLogin } from './navigation';

/**
 * Performs an authenticated HTTP fetch request with automatic 401 interception.
 * - Injects `Authorization: Bearer <token>` automatically from the persisted Zustand store.
 * - If the token is missing or the API responds with 401 Unauthorized:
 *   - Clears auth state from Zustand store and AsyncStorage via `logout()`.
 *   - Resets navigation directly to the Login screen silently without prompt.
 *
 * @param {string} url - Target URL or endpoint
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  const store = useAppStore.getState();
  const token = store.token || store.authToken;

  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Auto-logout: clear auth credentials and persisted store
      useAppStore.getState().logout();
      // Silently reset navigation to Login
      resetToLogin();
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export default authenticatedFetch;
