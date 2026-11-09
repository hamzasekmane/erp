export const ROLES = ["superadmin", "tenant_admin", "manager", "user"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  dashboardRead: "dashboard:read",
  clientsRead: "clients:read",
  clientsWrite: "clients:write",
  clientsDelete: "clients:delete",
  catalogRead: "catalog:read",
  catalogWrite: "catalog:write",
  invoicesRead: "invoices:read",
  invoicesWrite: "invoices:write",
  invoicesDelete: "invoices:delete",
  paymentsRead: "payments:read",
  paymentsWrite: "payments:write",
  paymentsRefund: "payments:refund",
  reportsRead: "reports:read",
  usersRead: "users:read",
  usersWrite: "users:write",
  settingsRead: "settings:read",
  settingsWrite: "settings:write",
  subscriptionRead: "subscription:read",
  subscriptionWrite: "subscription:write",
  apiKeysRead: "api_keys:read",
  apiKeysWrite: "api_keys:write",
  tenantsRead: "tenants:read",
  tenantsWrite: "tenants:write",
  auditRead: "audit:read",
  notificationsRead: "notifications:read",
  notificationsWrite: "notifications:write",
  hrRead: "hr:read",
  hrWrite: "hr:write",
  supportRead: "support:read",
  supportWrite: "support:write",
  archivesRead: "archives:read",
  archivesWrite: "archives:write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const all = Object.values(PERMISSIONS);

const base: Permission[] = [
  PERMISSIONS.dashboardRead,
  PERMISSIONS.clientsRead,
  PERMISSIONS.clientsWrite,
  PERMISSIONS.catalogRead,
  PERMISSIONS.invoicesRead,
  PERMISSIONS.invoicesWrite,
  PERMISSIONS.paymentsRead,
  PERMISSIONS.paymentsWrite,
  PERMISSIONS.reportsRead,
  PERMISSIONS.subscriptionRead,
  PERMISSIONS.notificationsRead,
  PERMISSIONS.notificationsWrite,
];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  superadmin: new Set(all),
  tenant_admin: new Set<Permission>([
    ...base,
    PERMISSIONS.clientsDelete,
    PERMISSIONS.catalogWrite,
    PERMISSIONS.invoicesDelete,
    PERMISSIONS.paymentsRefund,
    PERMISSIONS.usersRead,
    PERMISSIONS.usersWrite,
    PERMISSIONS.settingsRead,
    PERMISSIONS.settingsWrite,
    PERMISSIONS.subscriptionWrite,
    PERMISSIONS.apiKeysRead,
    PERMISSIONS.apiKeysWrite,
    PERMISSIONS.tenantsRead,
    PERMISSIONS.auditRead,
    PERMISSIONS.hrRead,
    PERMISSIONS.hrWrite,
    PERMISSIONS.supportRead,
    PERMISSIONS.supportWrite,
    PERMISSIONS.archivesRead,
    PERMISSIONS.archivesWrite,
  ]),
  manager: new Set<Permission>([
    ...base,
    PERMISSIONS.catalogWrite,
    PERMISSIONS.usersRead,
    PERMISSIONS.settingsRead,
    PERMISSIONS.auditRead,
    PERMISSIONS.hrRead,
    PERMISSIONS.hrWrite,
    PERMISSIONS.supportRead,
    PERMISSIONS.supportWrite,
    PERMISSIONS.archivesRead,
    PERMISSIONS.archivesWrite,
  ]),
  user: new Set<Permission>([...base, PERMISSIONS.hrRead, PERMISSIONS.supportRead, PERMISSIONS.supportWrite, PERMISSIONS.archivesRead]),
};

export function permissionsFor(role: string): Permission[] {
  const set = ROLE_PERMISSIONS[(role as Role) in ROLE_PERMISSIONS ? (role as Role) : "user"];
  return [...set];
}

export function hasPermission(role: string, permission: Permission): boolean {
  const set = ROLE_PERMISSIONS[(role as Role) in ROLE_PERMISSIONS ? (role as Role) : "user"];
  return set.has(permission);
}
