export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id?: string;
  email: string;
  displayName?: string;
  roles: string[];
}

export interface JwtPayload {
  sub?: string;
  nameid?: string;
  unique_name?: string;
  email?: string;
  role?: string | string[];
  roles?: string[];
  exp?: number;
}
