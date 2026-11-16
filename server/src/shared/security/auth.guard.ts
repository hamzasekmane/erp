import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, runTenant } from "../../db/client";
import { users } from "../../db/schema";
import { AppError } from "../errors";
import { IS_PUBLIC_KEY, PERMISSIONS_KEY, type AuthContext } from "./decorators";
import type { Permission } from "./permissions";
import { permissionsFor } from "./permissions";
import { verifyAccessToken } from "./tokens";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    // NOTE: reflector is injected by Nest through the global APP_GUARD provider.
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    if (!header?.startsWith("Bearer ")) throw AppError.unauthorized("Session expirée, veuillez vous reconnecter");

    let claims;
    try {
      claims = await verifyAccessToken(header.slice(7).trim());
    } catch {
      throw AppError.unauthorized("Session expirée, veuillez vous reconnecter");
    }

    // The token carries the tenant, so the user can be read inside its scope.
    // This guard runs BEFORE the TenantScopeInterceptor (guards precede
    // interceptors in Nest), so without this the SELECT would be unscoped: it
    // returns zero rows against a non-superuser connection and every
    // authenticated request answered 401 "Utilisateur introuvable". That went
    // unnoticed because the test connection is a superuser, which bypasses RLS.
    const [user] = await runTenant(claims.tid, async () =>
      getDb()
        .select()
        .from(users)
        .where(and(eq(users.id, claims.sub), isNull(users.deletedAt)))
        .limit(1),
    );

    if (!user) throw AppError.unauthorized("Utilisateur introuvable");
    if (user.status !== "active") throw AppError.forbidden("Compte désactivé", "ACCOUNT_DISABLED");
    if (user.tenantId !== claims.tid) throw AppError.unauthorized("Session invalide");
    if (user.tokenVersion !== claims.ver) throw AppError.unauthorized("Session expirée");

    const auth: AuthContext = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    request.auth = auth;

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required?.length) {
      const granted = new Set(permissionsFor(user.role));
      const missing = required.filter((permission) => !granted.has(permission));
      if (missing.length) throw AppError.forbidden("Permissions insuffisantes", "INSUFFICIENT_PERMISSIONS");
    }

    return true;
  }
}
