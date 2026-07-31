export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  isActive: boolean;
  createdAt: string;
  farmName: string | null;
  factoryName: string | null;
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
  name?: string | null;
  governorate?: string | null;
  sizeInFeddans?: number | null;
}

export interface UpdateUserRequest {
  name?: string | null;
  role?: string | null;
  isVerified?: boolean | null;
  governorate?: string | null;
  sizeInFeddans?: number | null;
}

export interface AdminUsersQuery {
  role?: string | null;
  isVerified?: boolean | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}
