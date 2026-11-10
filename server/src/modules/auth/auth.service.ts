import { Injectable, Logger } from "@nestjs/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../../db/client";
import {
  outboxEvents,
  passwordResetTokens,
  paymentMethods,
  plans,
  sessions,
  subscriptions,
  tenantSettings,
  tenants,
  users,
} from "../../db/schema";
import { audit } from "../../shared/audit";
import { AppError } from "../../shared/errors";
import { newId } from "../../shared/ids";
import { hashPassword, passwordIssues, verifyPassword } from "../../shared/security/password";
import { permissionsFor } from "../../shared/security/permissions";
import {
  hashToken,
  newRefreshToken,
  refreshExpiryDate,
  signAccessToken,
  signMfaChallenge,
  verifyMfaChallenge,
} from "../../shared/security/tokens";
import { decryptSecret, encryptSecret, secretsConfigured } from "../../shared/security/secrets";
import { generateTotpSecret, otpauthUrl, verifyTotp } from "../../shared/security/totp";
import { env } from "../../config/env";
import * as throttle from "../../shared/security/throttle";
import { serializeTenant, serializeUser } from "../../shared/serializers";
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  MfaCodeInput,
  MfaDisableInput,
  MfaVerifyInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.dto";

type Meta = { ip?: string | null; userAgent?: string | null };

const DEFAULT_PAYMENT_METHODS = [
  { code: "cash", name: "Espèces" },
  { code: "bank_transfer", name: "Virement bancaire" },
  { code: "card", name: "Carte bancaire" },
  { code: "check", name: "Chèque" },
  { code: "mobile", name: "Paiement mobile" },
];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "entreprise";
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /* ------------------------------------------------------------------ */
  /* Registration                                                        */
  /* ------------------------------------------------------------------ */

  async register(input: RegisterInput, meta: Meta) {
    const db = getDb();
    const email = input.userData.email.trim().toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, isNull(users.deletedAt)))
      .limit(1);
    if (existing) throw AppError.conflict("EMAIL_IN_USE", "Cet email est déjà utilisé");

    const issues = passwordIssues(input.userData.password);
    if (issues.length) throw AppError.badRequest(issues[0]);

    const planCode = (input.planCode ?? "trial").toLowerCase();
    const [plan] = await db.select().from(plans).where(eq(plans.code, planCode)).limit(1);
    if (!plan) throw AppError.badRequest("Formule d'abonnement inconnue");

    const tenantId = newId();
    const userId = newId();
    const now = new Date();
    const currency = (input.tenantData.currency ?? "DZD").toUpperCase();
    const businessName = input.tenantData.businessName ?? input.tenantData.name;
    const subdomain = await this.uniqueSubdomain(slugify(input.tenantData.domain ?? businessName));
    const trialEnd = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      await tx.insert(tenants).values({
        id: tenantId,
        name: businessName,
        subdomain,
        email: input.tenantData.contact?.email ?? email,
        phone: input.tenantData.contact?.phone ?? null,
        address: input.tenantData.address?.street ?? null,
        city: input.tenantData.address?.city ?? null,
        country: input.tenantData.address?.country ?? "DZ",
        taxNumber: input.tenantData.taxNumber ?? null,
        currency,
        language: input.tenantData.language ?? "fr",
        status: "trial",
        planCode: plan.code,
      });

      await tx.insert(tenantSettings).values({ tenantId });

      await tx.insert(users).values({
        id: userId,
        tenantId,
        email,
        passwordHash: hashPassword(input.userData.password),
        name: input.userData.name,
        role: "tenant_admin",
        status: "active",
        phone: input.userData.phone ?? null,
      });

      await tx.insert(subscriptions).values({
        id: newId(),
        tenantId,
        planId: plan.id,
        status: "trial",
        billingCycle: "monthly",
        startDate: now,
        endDate: trialEnd,
        trialEnd,
        priceMinor: 0,
        currency,
      });

      await tx.insert(paymentMethods).values(
        DEFAULT_PAYMENT_METHODS.map((method) => ({ id: newId(), tenantId, ...method })),
      );
    });

    await audit({
      tenantId,
      actorId: userId,
      action: "tenant.registered",
      entity: "tenant",
      entityId: tenantId,
      after: { email, plan: plan.code, currency },
      ...meta,
    });

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenantId)).limit(1);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return this.buildAuthResponse(user!, tenant!, settings ?? null, meta);
  }

  /* ------------------------------------------------------------------ */
  /* Login / refresh / logout                                            */
  /* ------------------------------------------------------------------ */

  async login(input: LoginInput, meta: Meta) {
    const db = getDb();
    const email = input.email.trim().toLowerCase();
    const throttleKey = `login:${meta.ip ?? "unknown"}:${email}`;
    if (!throttle.hit(throttleKey, 8, 15 * 60 * 1000)) throw AppError.rateLimited();

    const [user] = await db
      .select()
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, isNull(users.deletedAt)))
      .limit(1);

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      await audit({
        action: "auth.login_failed",
        entity: "user",
        entityId: user?.id ?? null,
        tenantId: user?.tenantId ?? null,
        after: { email },
        ...meta,
      });
      throw AppError.unauthorized("Email ou mot de passe incorrect");
    }
    if (user.status !== "active") throw AppError.forbidden("Compte désactivé", "ACCOUNT_DISABLED");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant || tenant.deletedAt || tenant.status === "suspended" || tenant.status === "inactive") {
      throw AppError.forbidden("Espace de travail indisponible", "TENANT_SUSPENDED");
    }

    if (user.mfaEnabled) {
      // Password accepted but no session yet: the client must prove possession
      // of the TOTP device within 5 minutes.
      await audit({
        tenantId: tenant.id,
        actorId: user.id,
        action: "auth.mfa_challenge",
        entity: "user",
        entityId: user.id,
        ...meta,
      });
      return {
        mfaRequired: true as const,
        challengeToken: await signMfaChallenge(user.id),
        expiresIn: 300,
      };
    }

    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
    throttle.resetKey(throttleKey);

    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenant.id)).limit(1);
    await audit({ tenantId: tenant.id, actorId: user.id, action: "auth.login", entity: "user", entityId: user.id, ...meta });

    return this.buildAuthResponse(user, tenant, settings ?? null, meta);
  }

  async refresh(input: RefreshInput, meta: Meta) {
    const db = getDb();
    const tokenHash = hashToken(input.refreshToken);
    const [session] = await db.select().from(sessions).where(eq(sessions.refreshTokenHash, tokenHash)).limit(1);

    if (!session) throw AppError.unauthorized("Session expirée, veuillez vous reconnecter");

    if (session.revokedAt) {
      // Refresh-token reuse: the whole family is compromised.
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.familyId, session.familyId), isNull(sessions.revokedAt)));
      throw AppError.unauthorized("Session révoquée, veuillez vous reconnecter");
    }
    if (session.expiresAt.getTime() <= Date.now()) throw AppError.unauthorized("Session expirée");

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, session.userId), isNull(users.deletedAt)))
      .limit(1);
    if (!user || user.status !== "active") throw AppError.unauthorized("Compte indisponible");

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant || tenant.deletedAt) throw AppError.unauthorized("Espace de travail indisponible");

    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));

    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenant.id)).limit(1);
    return this.buildAuthResponse(user, tenant, settings ?? null, meta, session.familyId);
  }

  async logout(auth: { userId: string; tenantId: string }, input: LogoutInput, meta: Meta) {
    const db = getDb();
    if (input.refreshToken) {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.refreshTokenHash, hashToken(input.refreshToken)), eq(sessions.userId, auth.userId)));
    } else {
      await db
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.userId, auth.userId), isNull(sessions.revokedAt)));
    }
    await audit({
      tenantId: auth.tenantId,
      actorId: auth.userId,
      action: "auth.logout",
      entity: "user",
      entityId: auth.userId,
      ...meta,
    });
    return { success: true };
  }

  async me(auth: { userId: string; tenantId: string }) {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, auth.userId), isNull(users.deletedAt)))
      .limit(1);
    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, auth.tenantId)).limit(1);
    if (!tenant) throw AppError.unauthorized("Espace de travail introuvable");
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenant.id)).limit(1);

    return {
      user: serializeUser(user),
      tenant: serializeTenant(tenant, settings ?? null),
      permissions: permissionsFor(user.role),
      mfa: this.mfaStatusFor(user),
    };
  }

  /* ------------------------------------------------------------------ */
  /* Password reset                                                      */
  /* ------------------------------------------------------------------ */

  async forgotPassword(input: ForgotPasswordInput, meta: Meta) {
    const db = getDb();
    const email = input.email.trim().toLowerCase();
    if (!throttle.hit(`forgot:${meta.ip ?? "unknown"}`, 5, 15 * 60 * 1000)) throw AppError.rateLimited();

    const [user] = await db
      .select()
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, isNull(users.deletedAt)))
      .limit(1);

    // Always the same answer: never disclose whether an account exists.
    if (!user) return { success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé." };

    const { token, hash } = newRefreshToken();
    await db.insert(passwordResetTokens).values({
      id: newId(),
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    await db.insert(outboxEvents).values({
      id: newId(),
      tenantId: user.tenantId,
      type: "password.reset",
      payload: { to: user.email, token, name: user.name },
      status: "pending",
    });
    await audit({ tenantId: user.tenantId, actorId: user.id, action: "auth.password_reset_requested", entity: "user", entityId: user.id, ...meta });

    // The outbox worker delivers the email; the link is also logged for local/dev flows.
    this.logger.log(`Password reset link: ${process.env.APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`);
    return { success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé." };
  }

  async resetPassword(input: ResetPasswordInput, meta: Meta) {
    const db = getDb();
    const issues = passwordIssues(input.password);
    if (issues.length) throw AppError.badRequest(issues[0]);

    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, hashToken(input.token)))
      .limit(1);
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw AppError.badRequest("Lien de réinitialisation invalide ou expiré");
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash: hashPassword(input.password), tokenVersion: sql`${users.tokenVersion} + 1`, updatedAt: now })
        .where(eq(users.id, row.userId));
      await tx.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.id, row.id));
      await tx
        .update(sessions)
        .set({ revokedAt: now })
        .where(and(eq(sessions.userId, row.userId), isNull(sessions.revokedAt)));
    });

    await audit({ action: "auth.password_reset", entity: "user", entityId: row.userId, ...meta });
    return { success: true, message: "Mot de passe mis à jour. Vous pouvez vous connecter." };
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  private async uniqueSubdomain(base: string): Promise<string> {
    const db = getDb();
    let candidate = base;
    for (let i = 2; i < 100; i += 1) {
      const [taken] = await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(sql`lower(${tenants.subdomain}) = ${candidate}`)
        .limit(1);
      if (!taken) return candidate;
      candidate = `${base}-${i}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  /* ------------------------------------------------------------------ */
  /* Multi-factor authentication (TOTP, RFC 6238)                        */
  /* ------------------------------------------------------------------ */

  private requireMfaStorage() {
    if (!secretsConfigured()) {
      throw new AppError(
        "MFA_UNAVAILABLE",
        "Le chiffrement des secrets n'est pas configuré (SECRETS_ENCRYPTION_KEY).",
        503,
      );
    }
  }

  private mfaStatusFor(user: { role: string; mfaEnabled: boolean; mfaSecret: string | null }) {
    return {
      enabled: user.mfaEnabled,
      pending: !user.mfaEnabled && Boolean(user.mfaSecret),
      required: env.MFA_REQUIRE_SUPERADMIN && user.role === "superadmin",
      issuer: env.MFA_ISSUER,
      storageReady: secretsConfigured(),
    };
  }

  async mfaStatus(auth: { userId: string }) {
    const [user] = await getDb().select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    return this.mfaStatusFor(user);
  }

  /** Generates (or rotates) a pending TOTP secret; MFA stays disabled until confirmed. */
  async mfaSetup(auth: { userId: string; tenantId: string }, meta: Meta) {
    this.requireMfaStorage();
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    // Rotating a secret must not silently downgrade an already protected account:
    // disabling requires password + current code first.
    if (user.mfaEnabled) {
      throw new AppError("MFA_ALREADY_ENABLED", "Désactivez d'abord la double authentification.", 409);
    }

    const secret = generateTotpSecret();
    await db
      .update(users)
      .set({ mfaSecret: encryptSecret(secret), mfaEnabled: false, mfaEnabledAt: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await audit({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "auth.mfa_setup_started",
      entity: "user",
      entityId: user.id,
      ...meta,
    });

    return {
      secret,
      otpauthUrl: otpauthUrl({ secret, account: user.email, issuer: env.MFA_ISSUER }),
      issuer: env.MFA_ISSUER,
      account: user.email,
      digits: 6,
      period: 30,
    };
  }

  /** Confirms the pending secret with a first valid code. */
  async mfaEnable(auth: { userId: string; tenantId: string }, input: MfaCodeInput, meta: Meta) {
    this.requireMfaStorage();
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    if (!user.mfaSecret) throw new AppError("MFA_NOT_STARTED", "Lancez d'abord la configuration MFA.", 400);
    if (user.mfaEnabled) throw new AppError("MFA_ALREADY_ENABLED", "La double authentification est déjà active.", 409);

    if (!verifyTotp(decryptSecret(user.mfaSecret), input.code)) {
      await audit({
        tenantId: user.tenantId,
        actorId: user.id,
        action: "auth.mfa_enable_failed",
        entity: "user",
        entityId: user.id,
        ...meta,
      });
      throw new AppError("INVALID_MFA_CODE", "Code invalide ou expiré.", 400);
    }

    await db
      .update(users)
      .set({ mfaEnabled: true, mfaEnabledAt: new Date(), mfaLastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await audit({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "auth.mfa_enabled",
      entity: "user",
      entityId: user.id,
      ...meta,
    });
    return { enabled: true };
  }

  /** Disabling requires both the password and a valid code. */
  async mfaDisable(auth: { userId: string; tenantId: string }, input: MfaDisableInput, meta: Meta) {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    if (!verifyPassword(input.password, user.passwordHash)) {
      throw AppError.unauthorized("Mot de passe incorrect");
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new AppError("MFA_NOT_ENABLED", "La double authentification n'est pas active.", 400);
    }
    if (!verifyTotp(decryptSecret(user.mfaSecret), input.code)) {
      throw new AppError("INVALID_MFA_CODE", "Code invalide ou expiré.", 400);
    }
    if (env.MFA_REQUIRE_SUPERADMIN && user.role === "superadmin") {
      throw new AppError(
        "MFA_REQUIRED",
        "La double authentification est obligatoire pour les super-administrateurs.",
        403,
      );
    }

    await db
      .update(users)
      .set({ mfaSecret: null, mfaEnabled: false, mfaEnabledAt: null, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    await audit({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "auth.mfa_disabled",
      entity: "user",
      entityId: user.id,
      ...meta,
    });
    return { enabled: false };
  }

  /** Second step of the login flow: exchanges the challenge for real tokens. */
  async verifyMfa(input: MfaVerifyInput, meta: Meta) {
    let subject: string;
    try {
      subject = (await verifyMfaChallenge(input.challengeToken)).sub;
    } catch {
      throw new AppError("MFA_CHALLENGE_EXPIRED", "Session de vérification expirée, reconnectez-vous.", 401);
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, subject), isNull(users.deletedAt)))
      .limit(1);
    if (!user || user.status !== "active" || !user.mfaEnabled || !user.mfaSecret) {
      throw AppError.unauthorized("Vérification impossible, reconnectez-vous.");
    }

    const throttleKey = `mfa:${user.id}`;
    if (!throttle.hit(throttleKey, 8, 10 * 60 * 1000)) throw AppError.rateLimited();
    if (!verifyTotp(decryptSecret(user.mfaSecret), input.code)) {
      await audit({
        tenantId: user.tenantId,
        actorId: user.id,
        action: "auth.mfa_failed",
        entity: "user",
        entityId: user.id,
        ...meta,
      });
      throw new AppError("INVALID_MFA_CODE", "Code invalide ou expiré.", 401);
    }
    throttle.resetKey(throttleKey);

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant || tenant.deletedAt || tenant.status === "suspended" || tenant.status === "inactive") {
      throw AppError.forbidden("Espace de travail indisponible", "TENANT_SUSPENDED");
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), mfaLastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    const [settings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, tenant.id)).limit(1);
    await audit({
      tenantId: tenant.id,
      actorId: user.id,
      action: "auth.mfa_login",
      entity: "user",
      entityId: user.id,
      ...meta,
    });

    return this.buildAuthResponse(user, tenant, settings ?? null, meta);
  }

  private async buildAuthResponse(
    user: typeof users.$inferSelect,
    tenant: typeof tenants.$inferSelect,
    settings: typeof tenantSettings.$inferSelect | null,
    meta: Meta,
    familyId?: string,
  ) {
    const db = getDb();
    const { token: refreshToken, hash } = newRefreshToken();
    await db.insert(sessions).values({
      id: newId(),
      userId: user.id,
      tenantId: tenant.id,
      refreshTokenHash: hash,
      familyId: familyId ?? newId(),
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      expiresAt: refreshExpiryDate(),
    });

    const token = await signAccessToken({
      sub: user.id,
      tid: tenant.id,
      role: user.role,
      ver: user.tokenVersion,
    });

    return {
      token,
      refreshToken,
      user: serializeUser(user),
      tenant: serializeTenant(tenant, settings),
      permissions: permissionsFor(user.role),
      mfaEnabled: user.mfaEnabled,
    };
  }
}
