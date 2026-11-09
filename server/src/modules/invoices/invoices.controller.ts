import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, Public, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { PaymentsService } from "../payments/payments.service";
import {
  createInvoiceSchema,
  invoicePaymentSchema,
  sendInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  type CreateInvoiceInput,
  type InvoicePaymentInput,
  type SendInvoiceInput,
  type UpdateInvoiceInput,
} from "./invoices.dto";
import { InvoicesService } from "./invoices.service";

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("invoices")
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly payments: PaymentsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async list(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.invoices.list(ctx(auth, req), {
      ...parsePagination(query),
      search: typeof query.search === "string" ? query.search : undefined,
      status: typeof query.status === "string" ? query.status : undefined,
      clientId: typeof query.clientId === "string" ? query.clientId : undefined,
      fromDate: typeof query.fromDate === "string" ? query.fromDate : undefined,
      toDate: typeof query.toDate === "string" ? query.toDate : undefined,
      dueFrom: typeof query.dueFrom === "string" ? query.dueFrom : undefined,
      dueTo: typeof query.dueTo === "string" ? query.dueTo : undefined,
      minAmount: typeof query.minAmount === "string" ? query.minAmount : undefined,
      maxAmount: typeof query.maxAmount === "string" ? query.maxAmount : undefined,
      sortBy: typeof query.sortBy === "string" ? query.sortBy : undefined,
      sortOrder: typeof query.sortOrder === "string" ? query.sortOrder : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("stats")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async stats(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("period") period = "month") {
    return ok(await this.invoices.stats(ctx(auth, req), period));
  }

  @Get("overdue")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async overdue(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("limit") limit = "10") {
    return ok(await this.invoices.overdue(ctx(auth, req), Number(limit) || 10));
  }

  @Get("client/:clientId")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async byClient(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("clientId") clientId: string, @Query() query: Record<string, unknown>) {
    const result = await this.invoices.byClient(ctx(auth, req), clientId, {
      ...parsePagination(query),
      status: typeof query.status === "string" ? query.status : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.invoicesWrite)
  async create(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(createInvoiceSchema)) body: CreateInvoiceInput) {
    return ok(await this.invoices.create(ctx(auth, req), body), "Facture créée");
  }

  @Get(":id")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async get(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.invoices.get(ctx(auth, req), id));
  }

  @Put(":id")
  @RequirePermissions(PERMISSIONS.invoicesWrite)
  async update(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateInvoiceSchema)) body: UpdateInvoiceInput,
  ) {
    return ok(await this.invoices.update(ctx(auth, req), id, body), "Facture mise à jour");
  }

  @Patch(":id/status")
  @RequirePermissions(PERMISSIONS.invoicesWrite)
  async status(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateInvoiceStatusSchema)) body: { status: string },
  ) {
    return ok(await this.invoices.updateStatus(ctx(auth, req), id, body.status), "Statut mis à jour");
  }

  @Post(":id/duplicate")
  @RequirePermissions(PERMISSIONS.invoicesWrite)
  async duplicate(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.invoices.duplicate(ctx(auth, req), id), "Facture dupliquée");
  }

  @Post(":id/send")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.invoicesWrite)
  async send(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sendInvoiceSchema)) body: SendInvoiceInput,
  ) {
    return ok(await this.invoices.send(ctx(auth, req), id, body));
  }

  /** Both routes are consumed by the frontend (`/pay` and `/payment`). */
  @Post(":id/pay")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async pay(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(invoicePaymentSchema)) body: InvoicePaymentInput,
  ) {
    return ok(await this.recordPayment(id, body, ctx(auth, req)), "Paiement enregistré");
  }

  @Post(":id/payment")
  @HttpCode(200)
  @RequirePermissions(PERMISSIONS.paymentsWrite)
  async payment(
    @CurrentAuth() auth: AuthContext,
    @Req() req: Request,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(invoicePaymentSchema)) body: InvoicePaymentInput,
  ) {
    return ok(await this.recordPayment(id, body, ctx(auth, req)), "Paiement enregistré");
  }

  @Get(":id/pdf")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async pdf(@CurrentAuth() auth: AuthContext, @Param("id") id: string, @Res() res: Response) {
    await this.invoices.streamPdf(id, auth.tenantId, res);
  }

  @Get(":id/export/pdf")
  @RequirePermissions(PERMISSIONS.invoicesRead)
  async exportPdf(@CurrentAuth() auth: AuthContext, @Param("id") id: string, @Res() res: Response) {
    await this.invoices.streamPdf(id, auth.tenantId, res);
  }

  @Public()
  @Get(":id/view")
  async view(@Param("id") id: string) {
    return { success: true, data: await this.invoices.publicView(id) };
  }

  @Public()
  @Get(":id/export/pdf/public")
  async publicPdf(@Param("id") id: string, @Res() res: Response) {
    await this.invoices.streamPdf(id, null, res);
  }

  @Delete(":id")
  @RequirePermissions(PERMISSIONS.invoicesDelete)
  async remove(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.invoices.remove(ctx(auth, req), id), "Facture supprimée");
  }

  private async recordPayment(id: string, body: InvoicePaymentInput, context: ReturnType<typeof ctx>) {
    const invoice = await this.invoices.get(context, id);
    const amount = body.amount ?? invoice.balance;
    return this.payments.create(context, {
      invoiceId: id,
      amount,
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    });
  }
}
