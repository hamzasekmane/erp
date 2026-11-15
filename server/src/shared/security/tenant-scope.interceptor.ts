import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { from, lastValueFrom, type Observable } from "rxjs";
import { currentTenantId, runGlobal, runTenant } from "../../db/client";
import type { AuthContext } from "./decorators";

/** Routes that are platform-wide by design and must see every tenant. */
const CROSS_TENANT_PREFIXES = ["/api/admin", "/api/internal", "/api/plans"];

/**
 * Applies the tenant's Row-Level Security context to the whole request.
 *
 * Guards run before interceptors, so authentication (which happens before a
 * tenant is known for `@Public` routes) is handled separately by the guard via
 * `runGlobal`. By the time this interceptor runs, `request.auth` is populated
 * and the tenant is known.
 *
 * Everything the controller and its services do inside `next.handle()` runs
 * inside the AsyncLocalStorage tenant scope, so `getDb()` returns the scoped
 * transaction and every query is filtered by RLS.
 *
 * Platform-admin and internal routes are explicitly run with no tenant scope:
 * they are *designed* to operate across tenants, and hiding that behind an
 * implicit scope would be worse than naming it.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { auth?: AuthContext }>();
    const tenantId = request.auth?.tenantId;

    // Already scoped (e.g. a nested call) or no authenticated tenant: run as-is.
    if (!tenantId || currentTenantId() === tenantId) return next.handle();

    const path = request.originalUrl ?? request.url ?? "";
    if (CROSS_TENANT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return from(runGlobal(async () => lastValueFrom(next.handle())));
    }

    return from(runTenant(tenantId, async () => lastValueFrom(next.handle())));
  }
}
