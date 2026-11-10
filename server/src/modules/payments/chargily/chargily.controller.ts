import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { ok } from "../../../shared/http";
import { CurrentAuth, Public, RequirePermissions, type AuthContext } from "../../../shared/security/decorators";
import { PERMISSIONS } from "../../../shared/security/permissions";
import { ZodValidationPipe } from "../../../shared/validation";
import { AppError } from "../../../shared/errors";
import { ChargilyService } from "./chargily.service";
import { createCheckoutSchema, type CreateCheckoutRequest } from "./chargily.schema";

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("payments/chargily")
export class ChargilyController {
  constructor(private readonly chargily: ChargilyService) {}

  @Get("status")
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async status(@CurrentAuth() auth: AuthContext) {
    return ok(await this.chargily.status(auth.tenantId));
  }

  @Post("checkouts")
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async createCheckout(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Body(new ZodValidationPipe(createCheckoutSchema)) body: CreateCheckoutRequest,
  ) {
    return ok(await this.chargily.createCheckout(ctx(auth, req), body), "Paiement en ligne créé");
  }

  @Get("checkouts")
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("limit") limit?: string) {
    return ok(await this.chargily.list(ctx(auth, req), limit ? Number(limit) : 20));
  }

  @Post("checkouts/:id/refresh")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async refresh(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.chargily.refresh(ctx(auth, req), id));
  }

  @Post("invoices/:invoiceId/refresh")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.paymentsRead)
  async refreshInvoice(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("invoiceId") invoiceId: string) {
    return ok(await this.chargily.refreshInvoice(ctx(auth, req), invoiceId));
  }

  /**
   * Chargily calls this endpoint server-to-server. It is intentionally public:
   * authenticity is enforced by the HMAC signature over the raw body.
   */
  @Public()
  @Post("webhook")
  @HttpCode(200)
  async webhook(@Req() req: Request) {
    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    const payload = raw ? raw.toString("utf8") : JSON.stringify(req.body ?? {});
    const signature = req.header("signature") ?? undefined;
    if (!signature) throw new AppError("INVALID_SIGNATURE", "En-tête signature manquant.", 403);
    return ok(await this.chargily.handleWebhook(payload, signature), "Webhook traité");
  }
}
