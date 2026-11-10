import { Body, Controller, Get, HttpCode, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok } from "../../shared/http";
import { AppError } from "../../shared/errors";
import { CurrentAuth, Public, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import {
  cancelSubscriptionSchema,
  changeSubscriptionSchema,
  updateSecuritySchema,
  updateSettingsSchema,
  updateTenantSchema,
  type CancelSubscriptionInput,
  type ChangeSubscriptionInput,
  type UpdateSecurityInput,
  type UpdateSettingsInput,
  type UpdateTenantInput,
} from "./tenancy.dto";
import { SubscriptionsService, TenancyService } from "./tenancy.service";

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("tenant")
export class TenancyController {
  constructor(private readonly tenancy: TenancyService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.settingsRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.tenancy.get(ctx(auth, req)));
  }

  @Put()
  @RequirePermissions(PERMISSIONS.settingsWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(updateTenantSchema)) body: UpdateTenantInput,
  ) {
    return ok(await this.tenancy.update(ctx(auth, req), body));
  }

  @Put("settings")
  @RequirePermissions(PERMISSIONS.settingsWrite)
  async updateSettings(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(updateSettingsSchema)) body: UpdateSettingsInput,
  ) {
    return ok(await this.tenancy.updateSettings(ctx(auth, req), body));
  }

  @Put("security")
  @RequirePermissions(PERMISSIONS.settingsWrite)
  async updateSecurity(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(updateSecuritySchema)) body: UpdateSecurityInput,
  ) {
    return ok(await this.tenancy.updateSecurity(ctx(auth, req), body));
  }

  @Get("subscription")
  @RequirePermissions(PERMISSIONS.subscriptionRead)
  async subscription(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.tenancy.subscription(ctx(auth, req)));
  }

  @Post("subscription")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.subscriptionWrite)
  async changePlan(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(changeSubscriptionSchema)) body: ChangeSubscriptionInput,
  ) {
    return ok(await this.tenancy.changePlan(ctx(auth, req), body));
  }

  @Post("subscription/cancel")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.subscriptionWrite)
  async cancel(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(cancelSubscriptionSchema)) body: CancelSubscriptionInput,
  ) {
    return ok(await this.tenancy.cancelPlan(ctx(auth, req), body));
  }
}

@Controller("plans")
export class PlansController {
  constructor(private readonly tenancy: TenancyService) {}

  @Public()
  @Get()
  async list() {
    return ok(await this.tenancy.listPlans());
  }
}

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get("current")
  @RequirePermissions(PERMISSIONS.subscriptionRead)
  async current(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.subscriptions.current(ctx(auth, req));
  }

  @Get("plans")
  @RequirePermissions(PERMISSIONS.subscriptionRead)
  async plans() {
    return this.subscriptions.listPlans();
  }

  @Get("invoices")
  @RequirePermissions(PERMISSIONS.subscriptionRead)
  async invoices(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("limit") limit = "10") {
    return this.subscriptions.invoices(ctx(auth, req), Number(limit) || 10);
  }

  /** No card is stored server-side yet: the frontend falls back when this 404s. */
  @Get("payment-method")
  @RequirePermissions(PERMISSIONS.subscriptionRead)
  async paymentMethod() {
    throw AppError.notFound("Aucun moyen de paiement enregistré");
  }

  @Put("upgrade")
  @RequirePermissions(PERMISSIONS.subscriptionWrite)
  async upgrade(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body() body: { newPlanId: string; billingCycle?: "monthly" | "yearly" },
  ) {
    return this.subscriptions.changePlanById(ctx(auth, req), body.newPlanId, body.billingCycle);
  }

  @Put("downgrade")
  @RequirePermissions(PERMISSIONS.subscriptionWrite)
  async downgrade(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body() body: { newPlanId: string; billingCycle?: "monthly" | "yearly" },
  ) {
    return this.subscriptions.changePlanById(ctx(auth, req), body.newPlanId, body.billingCycle);
  }

  @Post("cancel")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.subscriptionWrite)
  async cancel(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body() body: { cancelAtPeriodEnd?: boolean; reason?: string }) {
    return this.subscriptions.cancel(ctx(auth, req), body.cancelAtPeriodEnd ?? true, body.reason);
  }

  @Get("limits")
  @RequirePermissions(PERMISSIONS.subscriptionRead)
  async limits(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return this.subscriptions.limits(ctx(auth, req));
  }
}
