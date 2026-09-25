import { apiRequest, setToken, saveLocalUser, clearAuth, getLocalUser } from './client';

export type User = {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  hospital_id?: number | null;
  blood_group?: string;
  age?: number;
  created_at?: string;
};

export type AuthResponse = {
  message?: string;
  token: string;
  token_type?: string;
  user: User;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  age?: string | number;
  bloodGroup?: string;
};

/**
 * Register a new patient account via backend API /auth/register
 */
export async function registerPatient(payload: RegisterPayload): Promise<AuthResponse> {
  const body: Record<string, any> = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  };
  if (payload.phone) body.phone = payload.phone.trim();
  if (payload.age) body.age = Number(payload.age);
  if (payload.bloodGroup) body.blood_group = payload.bloodGroup.trim();

  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body,
    auth: false,
  });

  if (data?.token) {
    await setToken(data.token);
    await saveLocalUser(data.user);
  }

  return data;
}

/**
 * Login patient via backend API /auth/login
 */
export async function loginPatient(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: {
      email: email.trim().toLowerCase(),
      password,
    },
    auth: false,
  });

  if (!data?.token) {
    throw new Error('Login succeeded but no access token was returned.');
  }

  // Ensure role is patient for patient mobile app
  if (data.user?.role && data.user.role !== 'patient') {
    throw new Error('This app is only for patients. Staff/admins must use the Web Portal.');
  }

  await setToken(data.token);
  await saveLocalUser(data.user);
  return data;
}

/**
 * Logout patient
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network error on logout
  } finally {
    await clearAuth();
  }
}

/**
 * Refresh current user profile from /auth/me
 */
export async function getCurrentUser(): Promise<User | null> {
  const cached = await getLocalUser();
  try {
    const data = await apiRequest<any>('/auth/me');
    const user = data.user || data;
    if (user) {
      await saveLocalUser(user);
      return user;
    }
    return cached;
  } catch {
    return cached;
  }
}
