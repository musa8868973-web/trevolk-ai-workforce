/**
 * Frontend Auth API Service
 * Connects to the backend server at http://localhost:4000/api/v1
 */

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_API_URL as string | undefined) ||
  'http://localhost:4000/api/v1';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organizationName?: string | undefined;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface WorkspaceSummary {
  workspaceId: string;
  workspaceName?: string;
  role?: string;
}

export interface AuthResponseData {
  user: AuthUser;
  tokens: AuthTokens;
  workspace?: WorkspaceSummary;
  workspaces?: WorkspaceSummary[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ──────────────── Auth Storage Helpers ────────────────

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trevolk_access_token');
}

export function getStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('trevolk_workspace_id');
}

export function storeAuthSession(data: AuthResponseData): {
  accessToken: string;
  workspaceId: string;
} {
  const token = data.tokens?.accessToken || '';
  const wsId =
    data.workspace?.workspaceId ||
    data.workspaces?.[0]?.workspaceId ||
    '';

  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('trevolk_access_token', token);
    if (wsId) localStorage.setItem('trevolk_workspace_id', wsId);
    if (data.user) localStorage.setItem('trevolk_user', JSON.stringify(data.user));
  }

  return { accessToken: token, workspaceId: wsId };
}

export function clearAuthSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('trevolk_access_token');
    localStorage.removeItem('trevolk_workspace_id');
    localStorage.removeItem('trevolk_user');
  }
}

// ──────────────── Auth API Methods ────────────────

export async function loginUser(payload: LoginPayload): Promise<AuthResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as ApiResponse<AuthResponseData>;

  if (!response.ok || !body.success || !body.data) {
    const errorMsg =
      body.error?.message ||
      body.message ||
      `Login failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  storeAuthSession(body.data);
  return body.data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponseData> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      organizationName: payload.organizationName || `${payload.name}'s Org`,
    }),
  });

  const body = (await response.json()) as ApiResponse<AuthResponseData>;

  if (!response.ok || !body.success || !body.data) {
    const errorMsg =
      body.error?.message ||
      body.message ||
      `Registration failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  storeAuthSession(body.data);
  return body.data;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = (await response.json()) as ApiResponse<{ user: AuthUser }>;
    if (response.ok && body.success && body.data) {
      return body.data.user;
    }
    return null;
  } catch {
    return null;
  }
}
