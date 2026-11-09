export interface User {
  name: string;
  email: string;
  role: 'admin' | 'employee' | string;
  avatar?: string;
  tenantName?: string;
}

export interface NavbarProps {
  user: User | null;
  token: string;
}export interface User {
  name: string;
  email: string;
  role: 'admin' | 'employee' | string;
  avatar?: string;
  tenantName?: string;
}

export interface NavbarProps {
  user: User | null;
  token: string;
}