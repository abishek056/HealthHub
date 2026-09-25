import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getCandidateApiUrls, setWorkingApiBaseUrl } from './config';

const TOKEN_KEY = '@healthhub_patient_token';
const USER_KEY = '@healthhub_patient_user';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export async function saveLocalUser(user: any): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getLocalUser(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  auth?: boolean;
  timeoutMs?: number;
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Track active verified base URL across app lifecycle
let verifiedBaseUrl: string | null = null;

async function doFetch(
  baseUrl: string,
  path: string,
  headers: Record<string, string>,
  method: string,
  body?: any,
  timeoutMs: number = 6000
): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true, timeoutMs = 8000 } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const candidates = getCandidateApiUrls();
  const baseUrlsToTry = verifiedBaseUrl
    ? [verifiedBaseUrl, ...candidates.filter((u) => u !== verifiedBaseUrl)]
    : candidates;

  let response: Response | null = null;
  let lastError: any = null;
  let successfulBaseUrl: string | null = null;

  for (const candidateUrl of baseUrlsToTry) {
    try {
      // Use faster timeout when probing multiple candidates
      const perCandidateTimeout =
        baseUrlsToTry.length > 1 && !verifiedBaseUrl
          ? Math.min(timeoutMs, 2500)
          : timeoutMs;

      response = await doFetch(candidateUrl, path, headers, method, body, perCandidateTimeout);
      successfulBaseUrl = candidateUrl;
      verifiedBaseUrl = candidateUrl;
      setWorkingApiBaseUrl(candidateUrl);
      break;
    } catch (e: any) {
      lastError = e;
      // Invalidate if current verified URL failed
      if (verifiedBaseUrl === candidateUrl) {
        verifiedBaseUrl = null;
      }
    }
  }

  if (!response || !successfulBaseUrl) {
    if (lastError?.name === 'AbortError') {
      throw new ApiError(
        'Connection timed out. Please check that the backend is running on port 8000 and your device is on the same network.',
        408
      );
    }
    throw new ApiError(
      `Cannot reach server at ${API_BASE_URL}. Ensure backend is running on port 8000.`,
      0
    );
  }

  let data: any = null;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      // Token expired or invalid
      await clearAuth();
    }

    // Format validation errors if returned from Laravel (e.g. data.errors)
    let message = data?.message || data?.error || `Request failed (${response.status})`;
    if (data?.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      if (firstKey && Array.isArray(data.errors[firstKey])) {
        message = data.errors[firstKey][0];
      }
    }

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

