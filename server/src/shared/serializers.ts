import type { tenantSettings, tenants, users } from "../db/schema";

type UserRow = typeof users.$inferSelect;
type TenantRow = typeof tenants.$inferSelect;
type SettingsRow = typeof tenantSettings.$inferSelect;

/** User shape consumed by the frontend (audit §9.9 + zod-schemas.UserSchema). */
export function serializeUser(user: UserRow) {
  return {
    id: user.id,
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatarUrl ?? undefined,
    phone: user.phone ?? undefined,
    department: user.department ?? undefined,
    lastLogin: user.lastLoginAt?.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
    tenantId: user.tenantId,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Tenant shape consumed by `settingsService.Tenant` (audit §9.9). */
export function serializeTenant(tenant: TenantRow, settings?: SettingsRow | null) {
  const security = (settings?.security ?? {}) as Record<string, unknown>;
  return {
    id: tenant.id,
    _id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    email: tenant.email,
    phone: tenant.phone ?? undefined,
    address: tenant.address ?? undefined,
    city: tenant.city ?? undefined,
    country: tenant.country,
    taxNumber: tenant.taxNumber ?? undefined,
    plan: tenant.planCode,
    planId: tenant.planCode,
    status: tenant.status,
    isActive: tenant.status === "active" || tenant.status === "trial",
    currency: tenant.currency,
    language: tenant.language,
    timezone: tenant.timezone,
    logo: tenant.logoUrl ?? undefined,
    maxUsers: Number(security.maxUsers ?? 5),
    storageLimit: Number(security.storageLimit ?? 1024),
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString(),
    subscriptionStart: undefined,
    subscriptionEnd: undefined,
    settings: settings
      ? {
          theme: settings.theme,
          language: tenant.language,
          timezone: tenant.timezone,
          currency: tenant.currency,
          dateFormat: settings.dateFormat,
          numberFormat: settings.numberFormat,
          primaryColor: settings.primaryColor,
        }
      : undefined,
    security: settings
      ? {
          twoFactorAuth: Boolean(security.twoFactorAuth ?? false),
          sessionTimeout: Number(security.sessionTimeout ?? 480),
          passwordPolicy: String(security.passwordPolicy ?? "standard"),
          ipWhitelist: (security.ipWhitelist as string[] | undefined) ?? [],
          allowedDomains: (security.allowedDomains as string[] | undefined) ?? [],
        }
      : undefined,
    notifications: settings ? (settings.notifications as Record<string, unknown>) : undefined,
    integrations: settings ? (settings.integrations as Record<string, unknown>) : undefined,
  };
}
