import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { ok, okList, parsePagination } from "../../shared/http";
import { CurrentAuth, RequirePermissions, type AuthContext } from "../../shared/security/decorators";
import { PERMISSIONS } from "../../shared/security/permissions";
import { ZodValidationPipe } from "../../shared/validation";
import { HrService } from "./hr.service";

const departmentSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).nullish(),
  managerId: z.string().nullish(),
});

const employeeSchema = z.object({
  code: z.string().min(1).max(40),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().nullish(),
  phone: z.string().max(40).nullish(),
  departmentId: z.string().nullish(),
  position: z.string().max(120).optional(),
  contractType: z.enum(["cdi", "cdd", "intern", "freelance"]).optional(),
  hireDate: z.string().min(8),
  salary: z.number().finite().nonnegative().optional(),
  address: z.string().max(300).nullish(),
  notes: z.string().max(2000).nullish(),
});

const contractSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["cdi", "cdd", "intern", "freelance"]),
  startDate: z.string().min(8),
  endDate: z.string().min(8).nullish(),
  salary: z.number().finite().nonnegative().optional(),
  notes: z.string().max(1000).nullish(),
});

const leaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["annual", "sick", "unpaid", "maternity", "other"]),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  days: z.number().finite().positive().optional(),
  reason: z.string().max(1000).optional(),
});

const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(8),
  checkIn: z.string().max(10).optional(),
  checkOut: z.string().max(10).optional(),
  status: z.enum(["present", "late", "absent", "leave", "holiday", "remote"]).optional(),
  notes: z.string().max(500).optional(),
});

function ctx(auth: AuthContext, req: Request) {
  return { tenantId: auth.tenantId, userId: auth.userId, ip: req.ip ?? null, userAgent: req.header("user-agent") ?? null };
}

@Controller("hr")
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get("departments")
  @RequirePermissions(PERMISSIONS.hrRead)
  async departments(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.hr.listDepartments(ctx(auth, req)));
  }

  @Post("departments")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async createDepartment(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(departmentSchema)) body: z.infer<typeof departmentSchema>) {
    return ok(await this.hr.createDepartment(ctx(auth, req), body), "Département créé");
  }

  @Put("departments/:id")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async updateDepartment(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Body(new ZodValidationPipe(departmentSchema.partial())) body: z.infer<typeof departmentSchema>) {
    return ok(await this.hr.updateDepartment(ctx(auth, req), id, body));
  }

  @Delete("departments/:id")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async removeDepartment(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.hr.removeDepartment(ctx(auth, req), id));
  }

  @Get("employees")
  @RequirePermissions(PERMISSIONS.hrRead)
  async employees(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.hr.listEmployees(ctx(auth, req), {
      ...parsePagination(query),
      search: typeof query.search === "string" ? query.search : undefined,
      departmentId: typeof query.departmentId === "string" ? query.departmentId : undefined,
      status: typeof query.status === "string" ? query.status : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Get("employees/stats")
  @RequirePermissions(PERMISSIONS.hrRead)
  async employeeStats(@CurrentAuth() auth: AuthContext, @Req() req: Request) {
    return ok(await this.hr.employeeStats(ctx(auth, req)));
  }

  @Post("employees")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async createEmployee(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(employeeSchema)) body: z.infer<typeof employeeSchema>) {
    return ok(await this.hr.createEmployee(ctx(auth, req), body), "Employé créé");
  }

  @Put("employees/:id")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async updateEmployee(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return ok(await this.hr.updateEmployee(ctx(auth, req), id, body ?? {}));
  }

  @Delete("employees/:id")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async removeEmployee(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string) {
    return ok(await this.hr.removeEmployee(ctx(auth, req), id));
  }

  @Get("contracts")
  @RequirePermissions(PERMISSIONS.hrRead)
  async contracts(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("employeeId") employeeId?: string) {
    return ok(await this.hr.listContracts(ctx(auth, req), employeeId));
  }

  @Post("contracts")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async createContract(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(contractSchema)) body: z.infer<typeof contractSchema>) {
    return ok(await this.hr.createContract(ctx(auth, req), body), "Contrat créé");
  }

  @Get("leaves")
  @RequirePermissions(PERMISSIONS.hrRead)
  async leaves(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.hr.listLeaves(ctx(auth, req), {
      ...parsePagination(query),
      status: typeof query.status === "string" ? query.status : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Post("leaves")
  @RequirePermissions(PERMISSIONS.hrRead)
  async requestLeave(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(leaveSchema)) body: z.infer<typeof leaveSchema>) {
    return ok(await this.hr.requestLeave(ctx(auth, req), body), "Demande enregistrée");
  }

  @Patch("leaves/:id")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async decideLeave(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Param("id") id: string, @Body() body: { status: "approved" | "rejected" | "cancelled" }) {
    return ok(await this.hr.decideLeave(ctx(auth, req), id, body.status));
  }

  @Get("attendance")
  @RequirePermissions(PERMISSIONS.hrRead)
  async attendance(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query() query: Record<string, unknown>) {
    const result = await this.hr.listAttendance(ctx(auth, req), {
      ...parsePagination(query),
      date: typeof query.date === "string" ? query.date : undefined,
      employeeId: typeof query.employeeId === "string" ? query.employeeId : undefined,
    });
    return okList(result.items, result.pagination);
  }

  @Post("attendance")
  @RequirePermissions(PERMISSIONS.hrWrite)
  async markAttendance(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Body(new ZodValidationPipe(attendanceSchema)) body: z.infer<typeof attendanceSchema>) {
    return ok(await this.hr.markAttendance(ctx(auth, req), body));
  }

  @Get("payroll")
  @RequirePermissions(PERMISSIONS.hrRead)
  async payroll(@CurrentAuth() auth: AuthContext, @Req() req: Request, @Query("month") month?: string) {
    return ok(await this.hr.payroll(ctx(auth, req), month));
  }
}
