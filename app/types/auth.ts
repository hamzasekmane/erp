// types/auth.ts

// المستخدم
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  avatar?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// صلاحيات المستخدم
export interface UserPermissions {
  canViewPayments: boolean;
  canCreatePayments: boolean;
  canEditPayments: boolean;
  canDeletePayments: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
}

// استجابة تسجيل الدخول
export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  permissions: UserPermissions;
}

// معلومات الجلسة
export interface Session {
  user: User;
  permissions: UserPermissions;
  token: string;
  expiresAt: string;
}