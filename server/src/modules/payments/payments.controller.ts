import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import {
  createPaymentSchema,
  gatewaySchema,
  reconcileSchema,
  refundSchema,
  updatePaymentSchema,
  type CreatePaymentInput,
  type GatewayInput,
  type RefundInput,
  type UpdatePaymentInput,
} from "./payments.dto";
import { PaymentsService } from "./payments.service";

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.payments.list(ctx(auth, req), {
      ...parsePagination(query),
      search: typeof query.search === "string" ? query.search : undefined,
      status: typeof query.status === "string" ? query.status : undefined,
      method: typeof query.method === "string" ? query.method : undefined,
      clientId: typeof query.clientId === "string" ? query.clientId : undefined,
      invoiceId: typeof query.invoiceId === "string" ? query.invoiceId : undefined,
      fromDate: typeof query.fromDate === "string" ? query.fromDate : undefined,
      toDate: typeof query.toDate === "string" ? query.toDate : undefined,
      minAmount: typeof query.minAmount === "string" ? query.minAmount : undefined,
      maxAmount: typeof query.maxAmount === "string" ? query.maxAmount : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("stats")
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("period") period = "month") {
    return ok(await this.payments.stats(ctx(auth, req), period));
  }

  @Get("settings/gateways")
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async gateways(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.payments.listGateways(ctx(auth, req)));
  }

  @Post("settings/gateways/setup")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async setupGateway(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(gatewaySchema)) body: GatewayInput) {
    return ok(await this.payments.upsertGateway(ctx(auth, req), body), "Passerelle enregistrée");
  }

  @Put("settings/gateways/:id")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async updateGateway(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(gatewaySchema)) body: GatewayInput,
  ) {
    if (body.config) await this.payments.toggleGateway(ctx(auth, req), id, body.isActive ?? true);
    return ok(await this.payments.upsertGateway(ctx(auth, req), body), "Passerelle mise à jour");
  }

  @Patch("settings/gateways/:id/toggle")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async toggleGateway(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { isActive?: boolean },
  ) {
    return ok(await this.payments.toggleGateway(ctx(auth, req), id, body.isActive ?? true));
  }

  @Get("settings/methods")
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async methods(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.payments.listMethods(ctx(auth, req)));
  }

  @Patch("settings/methods/:id/toggle")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async toggleMethod(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { isActive?: boolean },
  ) {
    return ok(await this.payments.toggleMethod(ctx(auth, req), id, body.isActive ?? true));
  }

  @Post()
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createPaymentSchema)) body: CreatePaymentInput) {
    return ok(await this.payments.create(ctx(auth, req), body), "Paiement enregistré");
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.payments.get(ctx(auth, req), id));
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePaymentSchema)) body: UpdatePaymentInput,
  ) {
    return ok(await this.payments.update(ctx(auth, req), id, body), "Paiement mis à jour");
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.payments.remove(ctx(auth, req), id), "Paiement supprimé");
  }

  @Post(":id/refund")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.paymentsRefund)
  async refund(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(refundSchema)) body: RefundInput,
  ) {
    return ok(await this.payments.refund(ctx(auth, req), id, body), "Remboursement enregistré");
  }

  @Patch(":id/reconcile")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async reconcile(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(reconcileSchema)) body: { reconciled: boolean },
  ) {
    return ok(await this.payments.reconcile(ctx(auth, req), id, body.reconciled));
  }
}
