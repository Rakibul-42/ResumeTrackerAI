import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 150000,
});

apiClient.interceptors.response.use(response => response, error => {
  const body = error.response?.data?.error;
  const message = body?.message || (error.code === 'ECONNABORTED'
    ? 'The request timed out. Refresh to check whether it completed before trying again.'
    : error.response ? 'Request failed. Please try again.' : 'Cannot reach the backend. Check that the server is running.');
  const normalized = Object.assign(new Error(message), {
    status: error.response?.status,
    code: body?.code,
    details: body?.details,
  });
  const authEntry = ['/auth/login', '/auth/register', '/auth/password', '/auth/logout'];
  if (normalized.status === 401 && !authEntry.includes(error.config?.url) && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:expired'));
  }
  return Promise.reject(normalized);
});
