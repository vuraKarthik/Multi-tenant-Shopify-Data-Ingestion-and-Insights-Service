// API utility functions

/**
 * In development, this will be proxied by Vite
 * In production, this will be the actual API URL
 */
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};


export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};


 // Fetch data from API with authentication
 
export const fetchFromApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${getApiUrl()}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
};
