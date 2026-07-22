export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  businessType: string;
  name?: string;
  governorate?: string;
  sizeInFeddans?: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  confirmPassword: string;
  token: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id?: string;
  email: string;
  displayName?: string;

  role?: string;
  roles?: string[];

  emailConfirmed?: boolean;
  isVerified?: boolean;
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
