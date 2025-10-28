export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface RegularUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
}

export interface UpdateAdminUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'super_admin';
  isActive?: boolean;
}

export interface UpdateRegularUserRequest {
  email?: string;
  name?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
}
