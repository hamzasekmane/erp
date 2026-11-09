export interface UserData {
  name: string;
  role: string;
  avatar?: string;
  notificationCount?: number;
  status?: 'online' | 'offline' | 'away';
}

export interface NavbarProps {
  user?: UserData | null;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showThemeToggle?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}