export interface AdminUser {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  isActive: boolean;
  createdAt: string;
  farmName?: string;
  factoryName?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  name?: string;
  governorate?: string;
  sizeInFeddans?: number;
}

export interface UpdateUserRequest {
  name?: string;
  role?: string;
  isVerified?: boolean;
  governorate?: string;
  sizeInFeddans?: number;
}
